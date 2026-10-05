import { supabase, isSupabaseConfigured } from '../config/supabase';
import crypto from 'crypto';
import { walletService } from './walletService';

export interface AgentRecord {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  wallet?: WalletRecord;
  policy?: PolicyRecord;
}

export interface WalletRecord {
  id: string;
  agent_id: string;
  wallet_address: string;
  chain: string;
  provider: 'circle' | 'cdp';
  created_at: string;
}

export interface PolicyRecord {
  id: string;
  agent_id: string;
  daily_limit_usd: number;
  max_per_tx_usd: number;
  allowed_chains_json: string[];
  created_at: string;
}

export interface TransactionRecord {
  id: string;
  agent_id: string;
  amount_usd: number;
  tx_hash: string | null;
  status: 'pending' | 'confirmed' | 'failed';
  failure_reason?: string;
  created_at: string;
}

// In-memory mock database for instant testing before live DB credentials are set
const mockAgents: AgentRecord[] = [
  {
    id: 'agent-1111-2222-3333-444444444444',
    user_id: '00000000-0000-0000-0000-000000000001',
    name: 'Eliza Data Harvester (Autonomous)',
    created_at: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
    wallet: {
      id: 'wallet-001',
      agent_id: 'agent-1111-2222-3333-444444444444',
      wallet_address: '0x71C...49b2E14A89E624A9B3b942AcD320',
      chain: 'base-sepolia',
      provider: 'circle',
      created_at: new Date().toISOString()
    },
    policy: {
      id: 'policy-001',
      agent_id: 'agent-1111-2222-3333-444444444444',
      daily_limit_usd: 15.00,
      max_per_tx_usd: 2.50,
      allowed_chains_json: ['base-sepolia'],
      created_at: new Date().toISOString()
    }
  },
  {
    id: 'agent-5555-6666-7777-888888888888',
    user_id: '00000000-0000-0000-0000-000000000001',
    name: 'LangChain Compute Agent',
    created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    wallet: {
      id: 'wallet-002',
      agent_id: 'agent-5555-6666-7777-888888888888',
      wallet_address: '0x99A...1e84C21D39F997E89b47B090a18F',
      chain: 'base-sepolia',
      provider: 'circle',
      created_at: new Date().toISOString()
    },
    policy: {
      id: 'policy-002',
      agent_id: 'agent-5555-6666-7777-888888888888',
      daily_limit_usd: 25.00,
      max_per_tx_usd: 5.00,
      allowed_chains_json: ['base-sepolia'],
      created_at: new Date().toISOString()
    }
  }
];

const mockTransactions: TransactionRecord[] = [
  {
    id: 'tx-001',
    agent_id: 'agent-1111-2222-3333-444444444444',
    amount_usd: 0.75,
    tx_hash: '0x3b89fa2194b8e219001b9ca49308112048f0291e0a9829cd9b578c7b415a77c1',
    status: 'confirmed',
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
  },
  {
    id: 'tx-002',
    agent_id: 'agent-1111-2222-3333-444444444444',
    amount_usd: 1.20,
    tx_hash: '0x88fca911298492040182bbcad890123849182390abdfef908129038401928374',
    status: 'confirmed',
    created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
  },
  {
    id: 'tx-003',
    agent_id: 'agent-5555-6666-7777-888888888888',
    amount_usd: 2.10,
    tx_hash: '0x5501928471923849012398401928304918203948102938401928304918203948',
    status: 'confirmed',
    created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString()
  }
];

export const agentStore = {
  async getAgentsByUser(userId: string): Promise<AgentRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data: agents, error } = await supabase
          .from('agents')
          .select(`
            *,
            wallets (*),
            policies (*)
          `)
          .eq('user_id', userId);

        if (!error && agents) {
          return agents.map(a => ({
            id: a.id,
            user_id: a.user_id,
            name: a.name,
            created_at: a.created_at,
            wallet: a.wallets?.[0] || a.wallets || undefined,
            policy: a.policies?.[0] || a.policies || undefined
          }));
        }
      } catch (err) {
        console.warn('Falling back to local store for agents due to DB error:', err);
      }
    }
    return mockAgents.filter(a => a.user_id === userId || userId === '00000000-0000-0000-0000-000000000001');
  },

  async createAgent(
    userId: string,
    name: string,
    provider: 'circle' | 'cdp' = 'circle',
    dailyLimitUsd: number = 10.0,
    maxPerTxUsd: number = 1.0
  ): Promise<AgentRecord> {
    const agentId = crypto.randomUUID();
    const generatedWallet = await walletService.createAgentWallet({
      name: `Agent ${name} Wallet`
    });
    const walletAddr = generatedWallet.address;
    const now = new Date().toISOString();

    if (isSupabaseConfigured() && userId !== '00000000-0000-0000-0000-000000000001') {
      try {
        const { data: agent, error: agentErr } = await supabase
          .from('agents')
          .insert({ id: agentId, user_id: userId, name })
          .select()
          .single();

        if (agentErr) throw agentErr;

        const { data: wallet } = await supabase
          .from('wallets')
          .insert({
            agent_id: agentId,
            wallet_address: walletAddr,
            chain: generatedWallet.blockchain,
            provider
          })
          .select()
          .single();

        const { data: policy } = await supabase
          .from('policies')
          .insert({
            agent_id: agentId,
            daily_limit_usd: dailyLimitUsd,
            max_per_tx_usd: maxPerTxUsd,
            allowed_chains_json: ['base-sepolia']
          })
          .select()
          .single();

        return {
          id: agent.id,
          user_id: agent.user_id,
          name: agent.name,
          created_at: agent.created_at,
          wallet: wallet || undefined,
          policy: policy || undefined
        };
      } catch (err) {
        console.warn('Falling back to local store for agent creation:', err);
      }
    }

    const newAgent: AgentRecord = {
      id: agentId,
      user_id: userId,
      name,
      created_at: now,
      wallet: {
        id: generatedWallet.id,
        agent_id: agentId,
        wallet_address: walletAddr,
        chain: generatedWallet.blockchain,
        provider,
        created_at: now
      },
      policy: {
        id: crypto.randomUUID(),
        agent_id: agentId,
        daily_limit_usd: dailyLimitUsd,
        max_per_tx_usd: maxPerTxUsd,
        allowed_chains_json: ['base-sepolia'],
        created_at: now
      }
    };

    mockAgents.unshift(newAgent);
    return newAgent;
  },

  async updatePolicy(agentId: string, dailyLimitUsd: number, maxPerTxUsd: number, allowedChains: string[]): Promise<PolicyRecord | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('policies')
          .update({
            daily_limit_usd: dailyLimitUsd,
            max_per_tx_usd: maxPerTxUsd,
            allowed_chains_json: allowedChains
          })
          .eq('agent_id', agentId)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('DB update failed, updating mock store:', err);
      }
    }

    const agent = mockAgents.find(a => a.id === agentId);
    if (!agent || !agent.policy) return null;
    agent.policy.daily_limit_usd = dailyLimitUsd;
    agent.policy.max_per_tx_usd = maxPerTxUsd;
    agent.policy.allowed_chains_json = allowedChains;
    return agent.policy;
  },

  async getTransactions(agentId?: string): Promise<TransactionRecord[]> {
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('transactions').select('*').order('created_at', { ascending: false });
        if (agentId) query = query.eq('agent_id', agentId);
        const { data, error } = await query;
        if (!error && data) return data;
      } catch (err) {
        console.warn('DB transactions fetch failed, returning mock store:', err);
      }
    }

    if (agentId) {
      return mockTransactions.filter(t => t.agent_id === agentId);
    }
    return mockTransactions;
  },

  async executeSimulatedPayment(agentId: string, amountUsd: number): Promise<{ success: boolean; transaction: TransactionRecord; reason?: string }> {
    // Find agent & policy
    let policy: PolicyRecord | undefined;

    if (isSupabaseConfigured()) {
      try {
        const { data } = await supabase.from('policies').select('*').eq('agent_id', agentId).single();
        if (data) policy = data;
      } catch (e) {}
    }

    if (!policy) {
      const a = mockAgents.find(x => x.id === agentId);
      policy = a?.policy;
    }

    const txId = crypto.randomUUID();
    const now = new Date().toISOString();

    if (!policy) {
      const failedTx: TransactionRecord = {
        id: txId,
        agent_id: agentId,
        amount_usd: amountUsd,
        tx_hash: null,
        status: 'failed',
        failure_reason: 'Policy not found for agent',
        created_at: now
      };
      mockTransactions.unshift(failedTx);
      return { success: false, transaction: failedTx, reason: failedTx.failure_reason };
    }

    // Policy check: Max per tx
    if (amountUsd > Number(policy.max_per_tx_usd)) {
      const failedTx: TransactionRecord = {
        id: txId,
        agent_id: agentId,
        amount_usd: amountUsd,
        tx_hash: null,
        status: 'failed',
        failure_reason: `Amount $${amountUsd} exceeds max per transaction limit of $${policy.max_per_tx_usd}`,
        created_at: now
      };
      mockTransactions.unshift(failedTx);
      return { success: false, transaction: failedTx, reason: failedTx.failure_reason };
    }

    // Policy check: Daily limit
    const dayStart = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const recentTxs = mockTransactions.filter(t => t.agent_id === agentId && t.status === 'confirmed' && t.created_at >= dayStart);
    const dayTotal = recentTxs.reduce((sum, t) => sum + Number(t.amount_usd), 0);

    if (dayTotal + amountUsd > Number(policy.daily_limit_usd)) {
      const failedTx: TransactionRecord = {
        id: txId,
        agent_id: agentId,
        amount_usd: amountUsd,
        tx_hash: null,
        status: 'failed',
        failure_reason: `Daily limit exceeded. Spent $${dayTotal.toFixed(2)} + $${amountUsd.toFixed(2)} > Limit $${policy.daily_limit_usd}`,
        created_at: now
      };
      mockTransactions.unshift(failedTx);
      return { success: false, transaction: failedTx, reason: failedTx.failure_reason };
    }

    // Success
    const fakeHash = '0x' + crypto.randomBytes(32).toString('hex');
    const confirmedTx: TransactionRecord = {
      id: txId,
      agent_id: agentId,
      amount_usd: amountUsd,
      tx_hash: fakeHash,
      status: 'confirmed',
      created_at: now
    };

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('transactions').insert(confirmedTx);
      } catch (e) {}
    }

    mockTransactions.unshift(confirmedTx);
    return { success: true, transaction: confirmedTx };
  }
};
