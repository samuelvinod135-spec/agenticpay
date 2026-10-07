import {
  AgenticPayClientConfig,
  AgentPolicy,
  UpdatePolicyParams,
  CreateTransferParams,
  TransferResult,
  IssueCardParams,
  VirtualCard,
  GetLedgerLogsParams,
  JournalEntry,
  AuditLogItem,
} from './types';

export class AgenticPayClient {
  public readonly apiKey: string;
  public readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(config: AgenticPayClientConfig) {
    if (!config?.apiKey) {
      throw new Error('AgenticPayClient requires an apiKey (e.g. ag_live_...)');
    }
    this.apiKey = config.apiKey.trim();
    this.baseUrl = (config.baseUrl || process.env.AGENTICPAY_BASE_URL || process.env.API_URL || 'http://localhost:4000').replace(/\/+$/, '');
    this.timeoutMs = config.timeoutMs || 10000;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...((options.headers as Record<string, string>) || {}),
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      const data: any = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorMsg = data?.reason || data?.message || data?.error || `HTTP ${res.status} Error`;
        const error: any = new Error(errorMsg);
        error.status = res.status;
        error.data = data;
        throw error;
      }

      return data as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Policy Firewall & Budget Governance
   */
  public readonly policies = {
    /**
     * Retrieve active budget policy caps and current daily spend for an agent
     */
    get: async (agentId: string): Promise<AgentPolicy> => {
      const data = await this.request<{ success: boolean; policy: AgentPolicy }>(
        `/api/v1/agents/${encodeURIComponent(agentId)}/policy`
      );
      return data.policy;
    },

    /**
     * Update dynamic policy limits (per-tx cap, daily spend cap, whitelisted addresses)
     */
    update: async (agentId: string, updates: UpdatePolicyParams): Promise<AgentPolicy> => {
      const data = await this.request<{ success: boolean; policy: AgentPolicy }>(
        `/api/v1/agents/${encodeURIComponent(agentId)}/policy`,
        {
          method: 'PUT',
          body: JSON.stringify(updates),
        }
      );
      return data.policy;
    },
  };

  /**
   * Alias for backward compatibility
   */
  public readonly agents = {
    getPolicy: (agentId: string) => this.policies.get(agentId),
    updatePolicy: (agentId: string, updates: UpdatePolicyParams) => this.policies.update(agentId, updates),
  };

  /**
   * Financial Rails & Settlement Transfers
   */
  public readonly transfers = {
    /**
     * Execute a policy-verified on-chain transfer (e.g. USDC on Base Sepolia)
     */
    create: async (params: CreateTransferParams): Promise<TransferResult> => {
      const url = `${this.baseUrl}/api/v1/payments/transfer`;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            agentId: params.agentId,
            walletId: params.agentId,
            recipient: params.recipient,
            destinationAddress: params.recipient,
            amount: params.amount,
            chain: params.chain || 'base-sepolia',
            reason: params.reason,
          }),
        });

        const data: any = await res.json().catch(() => ({}));

        if (!res.ok || data?.success === false) {
          return {
            success: false,
            error: data?.error || 'Policy Violation',
            reason: data?.reason || data?.message || 'Transfer rejected by policy firewall',
            message: data?.reason || data?.message || 'Transfer failed',
            policy: data?.policy,
          };
        }

        const tx = data.transaction || {};
        return {
          success: true,
          message: data.message || 'USDC transfer successfully initiated.',
          transactionId: tx.transactionId,
          txHash: tx.txHash,
          state: tx.state || 'INITIATED',
          amount: tx.amount || params.amount,
          destinationAddress: tx.destinationAddress || params.recipient,
          blockchain: tx.blockchain || params.chain || 'base-sepolia',
          recordId: data.recordId || tx.dbRecordId,
        };
      } catch (err: any) {
        return {
          success: false,
          error: 'Network Error',
          reason: err.message,
          message: err.message,
        };
      }
    },
  };

  /**
   * Ephemeral Virtual Credit Card (VCC) Issuing
   */
  public readonly cards = {
    /**
     * Issue an ephemeral virtual card with hard spend limits and optional MCC whitelist
     */
    issue: async (params: IssueCardParams): Promise<VirtualCard> => {
      const spendingLimit = params.limitUsdc ?? params.spendingLimitUsd ?? 50;
      const payload: any = {
        agentId: params.agentId,
        spendingLimitUsd: spendingLimit,
        memo: params.memo || (params.merchantCategory ? `Card for ${params.merchantCategory}` : undefined),
        allowedMcc: params.allowedMcc,
        ttlMinutes: params.ttlMinutes,
      };

      const data = await this.request<{ success: boolean; card: VirtualCard }>(
        '/api/v1/cards/issue',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      return data.card;
    },

    /**
     * Retrieve status and balance of an existing virtual card
     */
    get: async (cardId: string): Promise<VirtualCard> => {
      const data = await this.request<{ success: boolean; card: VirtualCard }>(
        `/api/v1/cards/${encodeURIComponent(cardId)}`
      );
      return data.card;
    },
  };

  /**
   * Double-Entry Financial Ledger
   */
  public readonly ledger = {
    /**
     * Fetch double-entry audit journal logs, optionally filtered by agentId
     */
    getLogs: async (params?: GetLedgerLogsParams): Promise<JournalEntry[]> => {
      const query = params?.agentId ? `?agentId=${encodeURIComponent(params.agentId)}` : '';
      const data = await this.request<{ success: boolean; count: number; logs: JournalEntry[] }>(
        `/api/v1/ledger/logs${query}`
      );
      return data.logs || [];
    },
  };

  /**
   * Compliance and Security Audit Logs
   */
  public readonly auditLogs = {
    /**
     * Fetch policy violation audit logs with optional agent filtering
     */
    list: async (agentId?: string): Promise<AuditLogItem[]> => {
      const query = agentId ? `?agentId=${encodeURIComponent(agentId)}` : '';
      const data = await this.request<{ success: boolean; count: number; logs: AuditLogItem[] }>(
        `/api/v1/audit-logs${query}`
      );
      return data.logs || [];
    },
  };
}
