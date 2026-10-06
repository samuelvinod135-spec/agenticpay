export interface AgenticPayClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface AgentPolicy {
  id: string;
  agent_id: string;
  single_tx_cap_usdc: number;
  daily_spend_cap_usdc: number;
  whitelisted_addresses: string[];
  restricted_hours?: any;
  active: boolean;
  current_daily_spend_usdc?: number;
  remaining_daily_budget_usdc?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTransferParams {
  agentId: string;
  amount: number;
  recipient: string;
  reason?: string;
}

export interface TransferResult {
  success: boolean;
  message: string;
  transactionId?: string;
  txHash?: string;
  state?: string;
  amount?: string | number;
  destinationAddress?: string;
  blockchain?: string;
  recordId?: string;
  error?: string;
  reason?: string;
  policy?: Partial<AgentPolicy>;
}

export interface AuditLogItem {
  id: string;
  org_id?: string | null;
  agent_id?: string | null;
  wallet_id?: string;
  destination_address?: string;
  amount?: number;
  reason: string;
  created_at: string;
}
