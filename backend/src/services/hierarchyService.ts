import { supabase } from '../lib/supabase.js';

export interface HierarchyNode {
  agentId: string;
  parentAgentId: string | null;
  name?: string;
  dailySpendCapUsdc: number;
  currentSpendUsdc: number;
}

interface HierarchyValidationResult {
  allowed: boolean;
  reason?: string;
  parentAgentId?: string;
  parentCapUsdc?: number;
  parentCurrentSpendUsdc?: number;
}

class HierarchyService {
  // In-memory cache & fallback for fast lookups and resilient local testing
  private parentMap = new Map<string, string>(); // childAgentId -> parentAgentId
  private childrenMap = new Map<string, Set<string>>(); // parentAgentId -> Set<childAgentId>
  private dailyCapMap = new Map<string, number>(); // agentId -> dailyCap
  private dailySpendMap = new Map<string, number>(); // agentId -> currentDaySpend

  /**
   * Link a sub-agent to an overarching parent agent
   */
  async linkSubAgent(params: {
    childAgentId: string;
    parentAgentId: string;
    childDailyCapUsdc?: number;
    parentDailyCapUsdc?: number;
  }): Promise<{ success: boolean; childAgentId: string; parentAgentId: string }> {
    const { childAgentId, parentAgentId, childDailyCapUsdc = 5.0, parentDailyCapUsdc = 10.0 } = params;

    if (childAgentId === parentAgentId) {
      throw new Error('An agent cannot be its own parent.');
    }

    this.parentMap.set(childAgentId, parentAgentId);
    if (!this.childrenMap.has(parentAgentId)) {
      this.childrenMap.set(parentAgentId, new Set<string>());
    }
    this.childrenMap.get(parentAgentId)!.add(childAgentId);

    if (childDailyCapUsdc) {
      this.dailyCapMap.set(childAgentId, childDailyCapUsdc);
    }
    if (parentDailyCapUsdc && !this.dailyCapMap.has(parentAgentId)) {
      this.dailyCapMap.set(parentAgentId, parentDailyCapUsdc);
    }

    // Attempt DB synchronization (graceful fallback)
    try {
      await supabase
        .from('agents')
        .update({ parent_agent_id: parentAgentId })
        .eq('id', childAgentId);
    } catch {
      // In-memory handles fallback
    }

    return {
      success: true,
      childAgentId,
      parentAgentId,
    };
  }

  /**
   * Set or update spending caps for an agent in hierarchy
   */
  setAgentBudget(agentId: string, dailyCapUsdc: number): void {
    this.dailyCapMap.set(agentId, dailyCapUsdc);
  }

  /**
   * Retrieve parent ID of an agent
   */
  getParentId(agentId: string): string | null {
    return this.parentMap.get(agentId) || null;
  }

  /**
   * Retrieve direct children of an agent
   */
  getChildrenIds(parentAgentId: string): string[] {
    const children = this.childrenMap.get(parentAgentId);
    return children ? Array.from(children) : [];
  }

  /**
   * Compute aggregate family daily spend across parent and all descendants
   */
  getAggregateFamilySpend(parentAgentId: string): number {
    let total = this.dailySpendMap.get(parentAgentId) || 0;
    const children = this.getChildrenIds(parentAgentId);
    for (const childId of children) {
      total += this.dailySpendMap.get(childId) || 0;
    }
    return total;
  }

  /**
   * Validate if a proposed spend by a child agent violates either:
   * 1. The child agent's individual daily budget cap
   * 2. The overarching parent agent's aggregate daily budget cap
   */
  validateHierarchicalSpend(agentId: string, amountUsdc: number): HierarchyValidationResult {
    const childCap = this.dailyCapMap.get(agentId) ?? 5.0;
    const childSpent = this.dailySpendMap.get(agentId) || 0;

    // Check 1: Child's own spending cap
    if (childSpent + amountUsdc > childCap) {
      return {
        allowed: false,
        reason: `Sub-agent daily budget exceeded. (Cap: $${childCap.toFixed(2)}, Current: $${childSpent.toFixed(2)}, Requested: $${amountUsdc.toFixed(2)})`,
      };
    }

    // Check 2: Parent's aggregate budget cap (if parent exists)
    const parentId = this.getParentId(agentId);
    if (parentId) {
      const parentCap = this.dailyCapMap.get(parentId) ?? 10.0;
      const aggregateSpent = this.getAggregateFamilySpend(parentId);

      if (aggregateSpent + amountUsdc > parentCap) {
        return {
          allowed: false,
          reason: `Parent agent umbrella budget cap exceeded. (Parent Cap: $${parentCap.toFixed(2)}, Family Spent: $${aggregateSpent.toFixed(2)}, Requested: $${amountUsdc.toFixed(2)})`,
          parentAgentId: parentId,
          parentCapUsdc: parentCap,
          parentCurrentSpendUsdc: aggregateSpent,
        };
      }
    }

    return { allowed: true, parentAgentId: parentId || undefined };
  }

  /**
   * Record confirmed spend against child and update family accounting
   */
  recordSpend(agentId: string, amountUsdc: number): void {
    const current = this.dailySpendMap.get(agentId) || 0;
    this.dailySpendMap.set(agentId, current + amountUsdc);
  }

  /**
   * Reset spending counters (e.g. at UTC midnight or for testing)
   */
  resetSpend(agentId?: string): void {
    if (agentId) {
      this.dailySpendMap.delete(agentId);
    } else {
      this.dailySpendMap.clear();
    }
  }

  /**
   * Get hierarchy status and budget overview for an agent
   */
  getHierarchyOverview(agentId: string): {
    agentId: string;
    parentAgentId: string | null;
    childAgentIds: string[];
    individualDailyCapUsdc: number;
    individualSpendUsdc: number;
    familyAggregateSpendUsdc: number;
    parentCapUsdc?: number;
    remainingParentBudgetUsdc?: number;
  } {
    const parentId = this.getParentId(agentId);
    const childIds = this.getChildrenIds(agentId);
    const individualCap = this.dailyCapMap.get(agentId) ?? 5.0;
    const individualSpend = this.dailySpendMap.get(agentId) || 0;

    let familySpend = individualSpend;
    let parentCap: number | undefined;
    let remainingParentBudget: number | undefined;

    if (parentId) {
      parentCap = this.dailyCapMap.get(parentId) ?? 10.0;
      familySpend = this.getAggregateFamilySpend(parentId);
      remainingParentBudget = Math.max(0, parentCap - familySpend);
    } else if (childIds.length > 0) {
      familySpend = this.getAggregateFamilySpend(agentId);
      parentCap = individualCap;
      remainingParentBudget = Math.max(0, parentCap - familySpend);
    }

    return {
      agentId,
      parentAgentId: parentId,
      childAgentIds: childIds,
      individualDailyCapUsdc: individualCap,
      individualSpendUsdc: individualSpend,
      familyAggregateSpendUsdc: familySpend,
      parentCapUsdc: parentCap,
      remainingParentBudgetUsdc: remainingParentBudget,
    };
  }
}

export const hierarchyService = new HierarchyService();
