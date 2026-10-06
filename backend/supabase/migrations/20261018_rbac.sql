-- Migration for Day 18: Enterprise SSO & Role-Based Access Control (RBAC)
-- Creates organization_members table with ADMIN, DEVELOPER, AUDITOR roles

CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'DEVELOPER', 'AUDITOR')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(org_id, role);

COMMENT ON TABLE organization_members IS 'Stores tenant team memberships with granular RBAC permissions (ADMIN, DEVELOPER, AUDITOR).';
