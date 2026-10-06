-- Migration for Day 16: Sub-Agent Hierarchies & Parent-Child Budgets
-- Adds parent_agent_id relation to agents table to establish organizational hierarchies

ALTER TABLE agents
ADD COLUMN IF NOT EXISTS parent_agent_id UUID REFERENCES agents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agents_parent_agent_id ON agents(parent_agent_id);

-- Optional column on policies for hierarchical strictness
ALTER TABLE policies
ADD COLUMN IF NOT EXISTS inherit_parent_limits BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN agents.parent_agent_id IS 'References the orchestrator / parent agent whose budget umbrella covers this sub-agent.';
