import { supabase, isSupabaseConfigured } from '../config/supabase';
import crypto from 'crypto';

export interface PolicyRecord {
  id: string;
  agent_id: string;
  single_tx_cap_usdc: number;
  daily_spend_cap_usdc: number;
  whitelisted_addresses: string[];
  restricted_hours?: any;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PolicyEvaluationResult {
  allowed: boolean;
  reason?: string;
  policy?: PolicyRecord;
  spentLast24h?: number;
}

export interface AuditLogRecord {
  id: string;
  org_id?: string | null;
  agent_id?: string | null;
  wallet_id?: string;
  destination_address?: string;
  amount?: number;
  reason: string;
  created_at: string;
}

// In-memory policy cache / fallback
const memoryPolicies = new Map<string, PolicyRecord>();
const memoryAuditLogs: AuditLogRecord[] = [];

// Seed default policy for AutoPay-Agent-01 / default wallet
const defaultPolicy: PolicyRecord = {
  id: '00000000-0000-0000-0000-000000000099',
  agent_id: '70b13fc9-253d-425e-8fdb-bbeb697129c2',
  single_tx_cap_usdc: 1.00,
  daily_spend_cap_usdc: 10.00,
  whitelisted_addresses: [],
  restricted_hours: [],
  active: true,
  created_at: new Date().toISOString(),
};
memoryPolicies.set('70b13fc9-253d-425e-8fdb-bbeb697129c2', defaultPolicy);
memoryPolicies.set('AutoPay-Agent-01', defaultPolicy);
memoryPolicies.set('f94177bd-764a-5951-b5fa-0b2968f7a682', defaultPolicy);

export const policyEngine = {
  /**
   * Resolve an agent record and ID by id, name, or walletId
   */
  async resolveAgentId(identifier: string): Promise<{ agentId: string; name?: string; walletId?: string } | null> {
    const trimmed = identifier?.trim();
    if (!trimmed) return null;

    if (isSupabaseConfigured()) {
      try {
        // 1. Try agent by id or name
        const { data: agent } = await supabase
          .from('agents')
          .select('id, name')
          .or(`id.eq.${trimmed},name.eq.${trimmed}`)
          .maybeSingle();

        if (agent) {
          const { data: w } = await supabase
            .from('wallets')
            .select('id, wallet_address')
            .eq('agent_id', agent.id)
            .maybeSingle();

          return {
            agentId: agent.id,
            name: agent.name,
            walletId: w?.id || 'f94177bd-764a-5951-b5fa-0b2968f7a682',
          };
        }

        // 2. Try wallet table
        const { data: wallet } = await supabase
          .from('wallets')
          .select('id, agent_id, wallet_address')
          .or(`id.eq.${trimmed},wallet_address.eq.${trimmed}`)
          .maybeSingle();

        if (wallet && wallet.agent_id) {
          return { agentId: wallet.agent_id, walletId: wallet.id };
        }
      } catch (err: any) {
        console.warn('[policyEngine] Notice resolving agent from DB:', err.message);
      }
    }

    // Fallback checks
    if (trimmed === 'AutoPay-Agent-01' || trimmed === 'f94177bd-764a-5951-b5fa-0b2968f7a682') {
      return {
        agentId: '70b13fc9-253d-425e-8fdb-bbeb697129c2',
        name: 'AutoPay-Agent-01',
        walletId: 'f94177bd-764a-5951-b5fa-0b2968f7a682',
      };
    }

    return { agentId: trimmed };
  },

  /**
   * Fetch active policy for an agent
   */
  async getAgentPolicy(agentIdentifier: string): Promise<PolicyRecord | null> {
    const resolved = await this.resolveAgentId(agentIdentifier);
    const agentId = resolved?.agentId || agentIdentifier;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('policies')
          .select('*')
          .eq('agent_id', agentId)
          .maybeSingle();

        if (!error && data) {
          const cached = memoryPolicies.get(agentId) || memoryPolicies.get(agentIdentifier);
          const policy: PolicyRecord = {
            id: data.id,
            agent_id: data.agent_id,
            single_tx_cap_usdc: Number(data.single_tx_cap_usdc ?? data.max_per_tx_usd ?? data.max_per_transaction ?? cached?.single_tx_cap_usdc ?? 1.00),
            daily_spend_cap_usdc: Number(data.daily_spend_cap_usdc ?? data.daily_limit_usd ?? data.daily_limit ?? cached?.daily_spend_cap_usdc ?? 10.00),
            whitelisted_addresses: Array.isArray(data.whitelisted_addresses) ? data.whitelisted_addresses : (cached?.whitelisted_addresses ?? []),
            restricted_hours: data.restricted_hours || cached?.restricted_hours || [],
            active: data.active !== undefined ? Boolean(data.active) : (cached?.active ?? true),
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
          // Sync to memory cache
          memoryPolicies.set(agentId, policy);
          if (resolved?.name) memoryPolicies.set(resolved.name, policy);
          return policy;
        }
      } catch (err: any) {
        console.warn('[policyEngine] DB policy fetch fallback:', err.message);
      }
    }

    // Memory cache fallback
    return memoryPolicies.get(agentId) ||
           memoryPolicies.get(agentIdentifier) ||
           (resolved?.name ? memoryPolicies.get(resolved.name) : null) ||
           defaultPolicy;
  },

  /**
   * Update or create agent policy dynamically in the database
   */
  async updateAgentPolicy(
    agentIdentifier: string,
    updates: {
      single_tx_cap_usdc?: number;
      singleTxCapUsdc?: number;
      daily_spend_cap_usdc?: number;
      dailySpendCapUsdc?: number;
      whitelisted_addresses?: string[];
      whitelistedAddresses?: string[];
      restricted_hours?: any;
      active?: boolean;
    }
  ): Promise<PolicyRecord> {
    const resolved = await this.resolveAgentId(agentIdentifier);
    const agentId = resolved?.agentId || agentIdentifier;

    const singleCap = updates.single_tx_cap_usdc ?? updates.singleTxCapUsdc;
    const dailyCap = updates.daily_spend_cap_usdc ?? updates.dailySpendCapUsdc;
    const whitelisted = updates.whitelisted_addresses ?? updates.whitelistedAddresses;
    const active = updates.active;

    const current = await this.getAgentPolicy(agentId);

    const merged: PolicyRecord = {
      id: current?.id || crypto.randomUUID(),
      agent_id: agentId,
      single_tx_cap_usdc: singleCap !== undefined ? Number(singleCap) : (current?.single_tx_cap_usdc ?? 1.00),
      daily_spend_cap_usdc: dailyCap !== undefined ? Number(dailyCap) : (current?.daily_spend_cap_usdc ?? 10.00),
      whitelisted_addresses: whitelisted !== undefined ? whitelisted : (current?.whitelisted_addresses ?? []),
      restricted_hours: updates.restricted_hours !== undefined ? updates.restricted_hours : (current?.restricted_hours ?? []),
      active: active !== undefined ? Boolean(active) : (current?.active !== false),
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const fullPayload: any = {
          single_tx_cap_usdc: merged.single_tx_cap_usdc,
          daily_spend_cap_usdc: merged.daily_spend_cap_usdc,
          whitelisted_addresses: merged.whitelisted_addresses,
          active: merged.active,
          max_per_tx_usd: merged.single_tx_cap_usdc,
          daily_limit_usd: merged.daily_spend_cap_usdc,
          max_per_transaction: merged.single_tx_cap_usdc,
          daily_limit: merged.daily_spend_cap_usdc,
        };

        const { data: existing } = await supabase
          .from('policies')
          .select('id')
          .eq('agent_id', agentId)
          .maybeSingle();

        if (existing) {
          const { error: updErr } = await supabase
            .from('policies')
            .update(fullPayload)
            .eq('agent_id', agentId);

          if (updErr) {
            // Fallback update with existing schema columns
            await supabase
              .from('policies')
              .update({
                max_per_tx_usd: merged.single_tx_cap_usdc,
                daily_limit_usd: merged.daily_spend_cap_usdc,
              })
              .eq('agent_id', agentId);
          }
        } else {
          const { error: insErr } = await supabase
            .from('policies')
            .insert({
              id: merged.id,
              agent_id: agentId,
              ...fullPayload,
            });

          if (insErr) {
            await supabase
              .from('policies')
              .insert({
                id: merged.id,
                agent_id: agentId,
                max_per_tx_usd: merged.single_tx_cap_usdc,
                daily_limit_usd: merged.daily_spend_cap_usdc,
              });
          }
        }
      } catch (err: any) {
        console.warn('[policyEngine] Notice updating DB policies:', err.message);
      }
    }

    // Always update memory store
    memoryPolicies.set(agentId, merged);
    if (resolved?.name) memoryPolicies.set(resolved.name, merged);
    if (resolved?.walletId) memoryPolicies.set(resolved.walletId, merged);

    return merged;
  },

  /**
   * Log policy rejections to the audit_logs table
   */
  async logAuditViolation(params: {
    orgId?: string | null;
    agentId?: string | null;
    walletId?: string;
    destinationAddress?: string;
    amount?: number;
    reason: string;
  }): Promise<AuditLogRecord> {
    const record: AuditLogRecord = {
      id: crypto.randomUUID(),
      org_id: params.orgId || null,
      agent_id: params.agentId || null,
      wallet_id: params.walletId,
      destination_address: params.destinationAddress,
      amount: params.amount,
      reason: params.reason,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('audit_logs').insert({
          id: record.id,
          org_id: record.org_id,
          agent_id: record.agent_id,
          wallet_id: record.wallet_id,
          destination_address: record.destination_address,
          amount: record.amount,
          reason: record.reason,
        });

        if (error) {
          console.warn('[policyEngine] Notice logging to audit_logs table:', error.message);
        }
      } catch (err: any) {
        console.warn('[policyEngine] Notice recording audit log in DB:', err.message);
      }
    }

    memoryAuditLogs.unshift(record);
    return record;
  },

  /**
   * Calculate live rolling 24-hour spend for a wallet
   */
  async getRolling24hSpend(walletId: string): Promise<number> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    if (isSupabaseConfigured()) {
      try {
        const { data: txs, error } = await supabase
          .from('transactions')
          .select('amount, status')
          .eq('wallet_id', walletId.trim())
          .gte('created_at', twentyFourHoursAgo)
          .in('status', ['COMPLETE', 'INITIATED', 'PENDING']);

        if (!error && txs) {
          return txs.reduce((sum, tx) => sum + (parseFloat(String(tx.amount)) || 0), 0);
        }
      } catch (err: any) {
        console.warn('[policyEngine] Notice computing 24h spend from DB:', err.message);
      }
    }

    return 0;
  },

  /**
   * Evaluate a transfer proposal against dynamic database policies:
   * 1. Active status check
   * 2. Single Transaction Hard Cap (`single_tx_cap_usdc`)
   * 3. Rolling 24h Spend Cap (`daily_spend_cap_usdc`)
   * 4. Destination Address Whitelist (`whitelisted_addresses`)
   * Logs violation to `audit_logs` if rejected.
   */
  async evaluateTransfer(params: {
    walletId: string;
    destinationAddress: string;
    amount: number;
    agentId?: string;
    orgId?: string;
  }): Promise<PolicyEvaluationResult> {
    const { walletId, destinationAddress, amount, orgId } = params;

    // Resolve agent identifier
    const resolved = await this.resolveAgentId(params.agentId || walletId);
    const agentId = resolved?.agentId || params.agentId || walletId;

    // Fetch dynamic policy
    const policy = await this.getAgentPolicy(agentId);

    if (!policy) {
      const reason = 'Policy Violation: No policy found for agent';
      await this.logAuditViolation({ orgId, agentId, walletId, destinationAddress, amount, reason });
      return { allowed: false, reason };
    }

    // 1. Active Policy Check
    if (policy.active === false) {
      const reason = 'Policy Violation: Agent spending policy is currently disabled';
      await this.logAuditViolation({ orgId, agentId, walletId, destinationAddress, amount, reason });
      return { allowed: false, reason, policy };
    }

    // 2. Single Transaction Hard Cap Check
    if (amount > policy.single_tx_cap_usdc) {
      const reason = `Policy Violation: Exceeds per-transaction limit (Cap: $${policy.single_tx_cap_usdc.toFixed(2)} USDC, Requested: $${amount.toFixed(2)} USDC)`;
      await this.logAuditViolation({ orgId, agentId, walletId, destinationAddress, amount, reason });
      return { allowed: false, reason, policy };
    }

    // 3. Destination Address Whitelist Check
    if (policy.whitelisted_addresses && policy.whitelisted_addresses.length > 0) {
      const normalizedDest = destinationAddress.trim().toLowerCase();
      const isWhitelisted = policy.whitelisted_addresses.some(
        (addr) => addr.trim().toLowerCase() === normalizedDest
      );

      if (!isWhitelisted) {
        const reason = `Policy Violation: Destination address ${destinationAddress} is not in approved whitelist`;
        await this.logAuditViolation({ orgId, agentId, walletId, destinationAddress, amount, reason });
        return { allowed: false, reason, policy };
      }
    }

    // 4. Rolling 24h Spend Cap Check
    const spentLast24h = await this.getRolling24hSpend(walletId);
    if (spentLast24h + amount > policy.daily_spend_cap_usdc) {
      const reason = `Policy Violation: Exceeds daily spending limit (Cap: $${policy.daily_spend_cap_usdc.toFixed(2)} USDC, Spent 24h: $${spentLast24h.toFixed(2)} USDC, Requested: $${amount.toFixed(2)} USDC)`;
      await this.logAuditViolation({ orgId, agentId, walletId, destinationAddress, amount, reason });
      return { allowed: false, reason, policy, spentLast24h };
    }

    return {
      allowed: true,
      policy,
      spentLast24h,
    };
  },

  /**
   * Retrieve recent audit logs for debugging & compliance
   */
  async getAuditLogs(limit: number = 50): Promise<AuditLogRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && data) return data;
      } catch (err: any) {
        // Fall back to memory
      }
    }
    return memoryAuditLogs.slice(0, limit);
  },
};
