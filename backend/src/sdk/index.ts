import {
  AgenticPayClientConfig,
  AgentPolicy,
  CreateTransferParams,
  TransferResult,
  AuditLogItem,
} from './types';

export * from './types';
export * from './langchain';

export class AgenticPayClient {
  public readonly apiKey: string;
  public readonly baseUrl: string;

  constructor(config: AgenticPayClientConfig) {
    if (!config?.apiKey) {
      throw new Error('AgenticPayClient requires an apiKey (e.g. ag_live_...)');
    }
    this.apiKey = config.apiKey.trim();
    this.baseUrl = (config.baseUrl || process.env.AGENTICPAY_BASE_URL || process.env.API_URL || 'http://localhost:4000').replace(/\/+$/, '');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...((options.headers as Record<string, string>) || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers,
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
  }

  /**
   * Agent management and policy controls
   */
  public readonly agents = {
    /**
     * Fetch active budget limits and current spend for an agent
     */
    getPolicy: async (agentId: string): Promise<AgentPolicy> => {
      const data = await this.request<{ success: boolean; policy: AgentPolicy }>(
        `/api/v1/agents/${encodeURIComponent(agentId)}/policy`
      );
      return data.policy;
    },

    /**
     * Update dynamic policy limits for an agent
     */
    updatePolicy: async (
      agentId: string,
      updates: {
        single_tx_cap_usdc?: number;
        daily_spend_cap_usdc?: number;
        whitelisted_addresses?: string[];
        active?: boolean;
      }
    ): Promise<AgentPolicy> => {
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
   * Programmatic transfers with policy firewall verification
   */
  public readonly transfers = {
    /**
     * Execute a policy-verified USDC transfer on Base Sepolia
     */
    create: async (params: CreateTransferParams): Promise<TransferResult> => {
      const url = `${this.baseUrl}/api/v1/payments/transfer`;
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
        blockchain: tx.blockchain || 'base-sepolia',
        recordId: data.recordId || tx.dbRecordId,
      };
    },
  };

  /**
   * Compliance and audit log records
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

  /**
   * Ephemeral Virtual Credit Card (VCC) issuing
   */
  public readonly cards = {
    /**
     * Issue an ephemeral virtual card with hard spending limits
     */
    issue: async (params: {
      agentId: string;
      spendingLimitUsd: number;
      memo?: string;
      allowedMcc?: string[];
      ttlMinutes?: number;
    }): Promise<any> => {
      const data = await this.request<{ success: boolean; card: any }>(
        '/api/v1/cards/issue',
        {
          method: 'POST',
          body: JSON.stringify(params),
        }
      );
      return data.card;
    },

    /**
     * Get virtual card details
     */
    get: async (cardId: string): Promise<any> => {
      const data = await this.request<{ success: boolean; card: any }>(
        `/api/v1/cards/${encodeURIComponent(cardId)}`
      );
      return data.card;
    },
  };
}
