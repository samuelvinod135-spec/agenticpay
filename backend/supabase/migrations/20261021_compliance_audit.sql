-- ==============================================================================
-- 🛡️ SOC2 TYPE II & PCI-DSS COMPLIANCE AUDIT LOG MIGRATION
-- ==============================================================================
-- Stores tamper-evident records of agent prompts (SHA-256), policy firewall
-- decisions, cryptographic signature verdicts, and correlated double-entry
-- ledger entry IDs for SOC2 & PCI-DSS compliance audits.

CREATE TABLE IF NOT EXISTS compliance_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tx_id TEXT,
    agent_id TEXT NOT NULL,
    prompt_hash TEXT NOT NULL,
    policy_snapshot_json JSONB NOT NULL,
    signature_verdict TEXT NOT NULL,
    ledger_entry_id TEXT,
    tenant_org_id TEXT DEFAULT '00000000-0000-0000-0000-000000000001',
    risk_score NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for high-velocity compliance queries
CREATE INDEX IF NOT EXISTS idx_compliance_audit_agent ON compliance_audit_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_tx ON compliance_audit_logs(tx_id);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_created ON compliance_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_audit_org ON compliance_audit_logs(tenant_org_id);
