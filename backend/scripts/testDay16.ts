/**
 * Verification Script for Day 16: Sub-Agent Hierarchies & Parent-Child Budgets
 * Run with: npm run test:day16
 */
import axios from 'axios';
import { hierarchyService } from '../src/services/hierarchyService.js';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api/v1';

async function runDay16Verification() {
  console.log('======================================================================');
  console.log('🚀 AGENTICPAY: DAY 16 SUB-AGENT HIERARCHY & BUDGET VERIFICATION');
  console.log('======================================================================\n');

  hierarchyService.resetSpend();

  // Test 1: Link Sub-Agents to Parent Orchestrator via API
  console.log('--- TEST 1: Establish Sub-Agent Hierarchy via API ---');
  const parentId = 'parent-orchestrator-alpha';
  const child1Id = 'sub-worker-scraper';
  const child2Id = 'sub-worker-indexer';

  const linkRes1 = await axios.post(`${BASE_URL}/agents/hierarchy/link`, {
    childAgentId: child1Id,
    parentAgentId: parentId,
    childDailyCapUsdc: 8.0,
    parentDailyCapUsdc: 10.0,
  });
  console.log(`- Linked ${child1Id} -> ${parentId}: ${linkRes1.data.message}`);

  const linkRes2 = await axios.post(`${BASE_URL}/agents/hierarchy/link`, {
    childAgentId: child2Id,
    parentAgentId: parentId,
    childDailyCapUsdc: 8.0,
    parentDailyCapUsdc: 10.0,
  });
  console.log(`- Linked ${child2Id} -> ${parentId}: ${linkRes2.data.message}`);

  // Sync test runner process instance
  await hierarchyService.linkSubAgent({
    childAgentId: child1Id,
    parentAgentId: parentId,
    childDailyCapUsdc: 8.0,
    parentDailyCapUsdc: 10.0,
  });
  await hierarchyService.linkSubAgent({
    childAgentId: child2Id,
    parentAgentId: parentId,
    childDailyCapUsdc: 8.0,
    parentDailyCapUsdc: 10.0,
  });

  // Test 2: Verify Hierarchy Overview Endpoint
  console.log('\n--- TEST 2: Inspect Hierarchy Status via API ---');
  const overviewRes = await axios.get(`${BASE_URL}/agents/${parentId}/hierarchy`);
  const hierarchyData = overviewRes.data.hierarchy;
  console.log(`- Parent Agent: ${hierarchyData.agentId}`);
  console.log(`- Registered Children: ${hierarchyData.childAgentIds.join(', ')}`);
  console.log(`- Umbrella Parent Cap: $${hierarchyData.parentCapUsdc} USDC`);
  console.log(`- Initial Family Spend: $${hierarchyData.familyAggregateSpendUsdc} USDC`);

  if (hierarchyData.childAgentIds.length !== 2) {
    throw new Error('Expected 2 children registered under parent');
  }
  console.log('✅ Hierarchy registration verified!\n');

  // Test 3: Sub-Agent Spending Within Both Budgets
  console.log('--- TEST 3: Sub-Agent 1 Executes Compliant Spend ($6.00 USDC) ---');
  const check1 = hierarchyService.validateHierarchicalSpend(child1Id, 6.00);
  console.log(`- Validation allowed: ${check1.allowed}`);
  if (!check1.allowed) {
    throw new Error(`Validation unexpectedly failed: ${check1.reason}`);
  }
  hierarchyService.recordSpend(child1Id, 6.00);
  await axios.post(`${BASE_URL}/agents/${child1Id}/hierarchy/record-spend`, { amountUsdc: 6.00 });
  console.log(`- Recorded $6.00 spend on ${child1Id}. Family aggregate: $${hierarchyService.getAggregateFamilySpend(parentId)} USDC`);
  console.log('✅ Spend processed successfully!\n');

  // Test 4: Sub-Agent 2 Triggers Umbrella Parent Cap Violation
  console.log('--- TEST 4: Sub-Agent 2 Exceeds Parent Umbrella Cap ($5.00 USDC requested) ---');
  console.log('Note: Child 2 has $8.00 personal cap, but parent only has $4.00 remaining ($10.00 - $6.00).');
  const check2 = hierarchyService.validateHierarchicalSpend(child2Id, 5.00);
  console.log(`- Validation allowed: ${check2.allowed}`);
  console.log(`- Rejection Reason: "${check2.reason}"`);

  if (check2.allowed) {
    throw new Error('Expected transaction to be rejected by parent umbrella budget!');
  }
  if (!check2.reason?.includes('Parent agent umbrella budget cap exceeded')) {
    throw new Error(`Expected parent umbrella violation message, got: ${check2.reason}`);
  }
  console.log('✅ Parent umbrella budget protection successfully triggered!\n');

  // Test 5: Sub-Agent 2 Executes Spend Fitting Inside Parent Remaining Budget
  console.log('--- TEST 5: Sub-Agent 2 Executes Permitted Spend ($3.50 USDC) ---');
  const check3 = hierarchyService.validateHierarchicalSpend(child2Id, 3.50);
  console.log(`- Validation allowed: ${check3.allowed}`);
  if (!check3.allowed) {
    throw new Error(`Validation unexpectedly failed: ${check3.reason}`);
  }
  hierarchyService.recordSpend(child2Id, 3.50);
  await axios.post(`${BASE_URL}/agents/${child2Id}/hierarchy/record-spend`, { amountUsdc: 3.50 });
  const totalFamily = hierarchyService.getAggregateFamilySpend(parentId);
  console.log(`- Recorded $3.50 spend on ${child2Id}. Total family aggregate: $${totalFamily.toFixed(2)} / $10.00 USDC`);
  console.log('✅ Sub-agent spend under parent umbrella verified!\n');

  // Test 6: Sub-Agent 1 Exceeds Individual Cap
  console.log('--- TEST 6: Sub-Agent 1 Exceeds Its Own Individual Cap ---');
  // Child 1 has spent $6.00, cap is $8.00. Asking for $2.50 ($6 + $2.5 = $8.50 > $8.00).
  const check4 = hierarchyService.validateHierarchicalSpend(child1Id, 2.50);
  console.log(`- Validation allowed: ${check4.allowed}`);
  console.log(`- Rejection Reason: "${check4.reason}"`);

  if (check4.allowed) {
    throw new Error('Expected transaction to be rejected by sub-agent individual budget!');
  }
  if (!check4.reason?.includes('Sub-agent daily budget exceeded')) {
    throw new Error(`Expected sub-agent budget violation message, got: ${check4.reason}`);
  }
  console.log('✅ Sub-agent individual limit protection verified!\n');

  // Test 7: Confirm Final Hierarchy State via API
  console.log('--- TEST 7: Query Final Hierarchical Summary via API ---');
  const finalOverview = await axios.get(`${BASE_URL}/agents/${child1Id}/hierarchy`);
  const finalData = finalOverview.data.hierarchy;
  console.log(`- Child 1 Individual Spend: $${finalData.individualSpendUsdc} / $${finalData.individualDailyCapUsdc} USDC`);
  console.log(`- Family Aggregate Spend: $${finalData.familyAggregateSpendUsdc} / $${finalData.parentCapUsdc} USDC`);
  console.log(`- Remaining Parent Budget: $${finalData.remainingParentBudgetUsdc} USDC`);

  if (finalData.familyAggregateSpendUsdc !== 9.50) {
    throw new Error(`Expected family spend $9.50, received $${finalData.familyAggregateSpendUsdc}`);
  }
  console.log('✅ Final hierarchy audit verified!\n');

  console.log('======================================================================');
  console.log('🎉 ALL DAY 16 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================================');
}

runDay16Verification().catch((err) => {
  console.error('\n❌ Day 16 Verification Failed:', err);
  process.exit(1);
});
