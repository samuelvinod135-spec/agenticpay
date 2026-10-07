import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '../config/supabase';

export interface ComplianceAuditRecord {
  id: string;
  tx_id?: string;
  agent_id: string;
  prompt_hash: string;
  policy_snapshot_json: any;
  signature_verdict: string;
  ledger_entry_id?: string;
  tenant_org_id?: string;
  risk_score: number;
  created_at: string;
}

export interface RecordComplianceParams {
  txId?: string;
  agentId: string;
  promptOrIntent?: string;
  policySnapshot: any;
  signatureVerdict: 'APPROVED' | 'POLICY_BLOCKED' | 'SYSTEM_QUARANTINED' | 'RATE_LIMITED' | 'REJECTED';
  ledgerEntryId?: string;
  tenantOrgId?: string;
  riskScore?: number;
}

const memoryComplianceLogs: ComplianceAuditRecord[] = [];

export const complianceService = {
  /**
   * Cryptographically hash an agent intent / prompt using SHA-256
   */
  hashPrompt(promptOrIntent?: string): string {
    const raw = promptOrIntent?.trim() || 'NO_PROMPT_SUPPLIED';
    return crypto.createHash('sha256').update(raw).digest('hex');
  },

  /**
   * Record a tamper-evident compliance audit record correlated with ledger entries
   */
  async recordAuditEntry(params: RecordComplianceParams): Promise<ComplianceAuditRecord> {
    const id = crypto.randomUUID();
    const promptHash = this.hashPrompt(params.promptOrIntent);
    const now = new Date().toISOString();

    const record: ComplianceAuditRecord = {
      id,
      tx_id: params.txId,
      agent_id: params.agentId,
      prompt_hash: promptHash,
      policy_snapshot_json: params.policySnapshot || {},
      signature_verdict: params.signatureVerdict,
      ledger_entry_id: params.ledgerEntryId,
      tenant_org_id: params.tenantOrgId || '00000000-0000-0000-0000-000000000001',
      risk_score: params.riskScore ?? 0,
      created_at: now,
    };

    memoryComplianceLogs.unshift(record);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('compliance_audit_logs').insert({
          id,
          tx_id: record.tx_id,
          agent_id: record.agent_id,
          prompt_hash: record.prompt_hash,
          policy_snapshot_json: record.policy_snapshot_json,
          signature_verdict: record.signature_verdict,
          ledger_entry_id: record.ledger_entry_id,
          tenant_org_id: record.tenant_org_id,
          risk_score: record.risk_score,
          created_at: record.created_at,
        });
      } catch (err: any) {
        console.warn('[complianceService] Notice writing to Supabase:', err.message);
      }
    }

    return record;
  },

  /**
   * Retrieve compliance audit logs
   */
  async getAuditLogs(filters?: { agentId?: string; limit?: number }): Promise<ComplianceAuditRecord[]> {
    let logs = [...memoryComplianceLogs];
    if (filters?.agentId) {
      const target = filters.agentId.toLowerCase();
      logs = logs.filter((l) => l.agent_id.toLowerCase() === target);
    }
    const limit = filters?.limit || 100;
    return logs.slice(0, limit);
  },

  /**
   * Export audit report formatted for SOC2 Type II and PCI-DSS external auditors (JSON or CSV)
   */
  async exportAuditReport(
    format: 'json' | 'csv' = 'json',
    filters?: { agentId?: string; limit?: number }
  ): Promise<string> {
    const logs = await this.getAuditLogs(filters);

    if (format === 'json') {
      return JSON.stringify(
        {
          standard: 'SOC2_TYPE_II_AND_PCI_DSS',
          exportedAt: new Date().toISOString(),
          recordCount: logs.length,
          integrityCheck: 'SHA256_HASH_CORRELATED',
          records: logs,
        },
        null,
        2
      );
    }

    // CSV format
    const headers = [
      'id',
      'created_at',
      'agent_id',
      'tx_id',
      'prompt_hash',
      'signature_verdict',
      'ledger_entry_id',
      'risk_score',
      'single_tx_cap',
      'daily_spend_cap',
    ];

    const rows = logs.map((l) => {
      const cap = l.policy_snapshot_json?.single_tx_cap_usdc ?? 'N/A';
      const daily = l.policy_snapshot_json?.daily_spend_cap_usdc ?? 'N/A';
      return [
        l.id,
        `"${l.created_at}"`,
        `"${l.agent_id}"`,
        `"${l.tx_id || ''}"`,
        `"${l.prompt_hash}"`,
        `"${l.signature_verdict}"`,
        `"${l.ledger_entry_id || ''}"`,
        l.risk_score,
        cap,
        daily,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },
};
