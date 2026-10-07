export interface AgenticPayClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
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

export interface UpdatePolicyParams {
  single_tx_cap_usdc?: number;
  daily_spend_cap_usdc?: number;
  whitelisted_addresses?: string[];
  active?: boolean;
}

export interface CreateTransferParams {
  agentId: string;
  amount: number;
  recipient: string;
  chain?: string;
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

export interface IssueCardParams {
  agentId: string;
  limitUsdc?: number;
  spendingLimitUsd?: number;
  merchantCategory?: string;
  allowedMcc?: string[];
  memo?: string;
  ttlMinutes?: number;
}

export interface VirtualCard {
  id: string;
  agent_id: string;
  last4: string;
  spending_limit_usd: number;
  current_spend_usd: number;
  status: 'ACTIVE' | 'TERMINATED' | 'FROZEN';
  memo?: string;
  allowed_mcc?: string[];
  created_at?: string;
  expires_at?: string;
}

export interface JournalLine {
  id: string;
  entryId: string;
  accountCode: string;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  currency: string;
}

export interface JournalEntry {
  id: string;
  referenceId: string;
  memo: string;
  lines: JournalLine[];
  createdAt: string;
}

export interface GetLedgerLogsParams {
  agentId?: string;
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
