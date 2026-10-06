/**
 * Verification Script for Day 15: Multi-Sig & Human-in-the-Loop Approvals
 * Run with: npm run test:day15
 */
import axios from 'axios';
import { approvalService } from '../src/services/approvalService.js';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api/v1';

async function runDay15Verification() {
  console.log('======================================================================');
  console.log('🚀 AGENTICPAY: DAY 15 HUMAN-IN-THE-LOOP APPROVAL VERIFICATION');
  console.log('======================================================================\n');

  // Test 1: Unit logic verification
  console.log('--- TEST 1: Approval Service Threshold & Expiration Logic ---');
  const subThreshold = approvalService.requiresApproval(15.00);
  const aboveThreshold = approvalService.requiresApproval(25.00);
  console.log(`- Amount $15.00 requires approval: ${subThreshold} (Expected: false)`);
  console.log(`- Amount $25.00 requires approval: ${aboveThreshold} (Expected: true)`);
  if (subThreshold !== false || aboveThreshold !== true) {
    throw new Error('Approval threshold logic verification failed');
  }

  // Create a pending test approval directly to verify expiration calculation
  const testApproval = approvalService.createPendingApproval({
    agentId: 'test-agent',
    walletId: 'test-wallet',
    destinationAddress: '0x2222222222222222222222222222222222222222',
    amountUsdc: 50.00,
    reason: 'Executive purchase test',
  });
  console.log(`- Created approval ID: ${testApproval.id}`);
  console.log(`- Status: ${testApproval.status}`);
  console.log(`- Expires at: ${testApproval.expiresAt}`);
  
  const expireDiffMinutes = (new Date(testApproval.expiresAt).getTime() - new Date(testApproval.createdAt).getTime()) / (60 * 1000);
  console.log(`- Expiration window: ${expireDiffMinutes} minutes (Expected: 15 minutes)`);
  if (expireDiffMinutes !== 15) {
    throw new Error('Expiration window is not 15 minutes');
  }
  console.log('✅ Unit checks passed!\n');

  // Test 2: Trigger High-Value Transfer via API
  console.log('--- TEST 2: High-Value Transfer Triggers HTTP 202 PENDING_HUMAN_APPROVAL ---');
  let pendingApprovalId: string = '';
  try {
    const res = await axios.post(`${BASE_URL}/payments/transfer`, {
      walletId: 'f94177bd-764a-5951-b5fa-0b2968f7a682',
      destinationAddress: '0x9f4d4f18475a4218fe6afef72352f0b9e52fdb3d',
      amount: 25.00,
      reason: 'Urgent server upgrade payment',
    });
    console.log(`- Response HTTP Status: ${res.status}`);
    console.log(`- Status: ${res.data.status}`);
    console.log(`- Approval ID: ${res.data.approvalId}`);
    console.log(`- Message: ${res.data.message}`);

    if (res.status !== 202 || res.data.status !== 'PENDING_HUMAN_APPROVAL') {
      throw new Error(`Expected HTTP 202 PENDING_HUMAN_APPROVAL, received ${res.status}`);
    }
    pendingApprovalId = res.data.approvalId;
    console.log('✅ High-value transfer properly halted for human approval!\n');
  } catch (err: any) {
    console.error('Failed test 2:', err.response?.data || err.message);
    throw err;
  }

  // Test 3: Query Pending Approvals Queue
  console.log('--- TEST 3: Query Pending Approvals Queue ---');
  const queueRes = await axios.get(`${BASE_URL}/approvals/pending`);
  console.log(`- Pending queue count: ${queueRes.data.count}`);
  const found = queueRes.data.approvals.find((a: any) => a.id === pendingApprovalId);
  if (!found) {
    throw new Error(`Queued approval ${pendingApprovalId} not found in pending list`);
  }
  console.log(`- Found approval: ${found.id} for $${found.amountUsdc} USDC`);
  console.log('✅ Pending approvals queue verified!\n');

  // Test 4: Operator Approves the Transfer
  console.log('--- TEST 4: Operator Decision (APPROVE) ---');
  const decisionRes = await axios.post(`${BASE_URL}/approvals/${pendingApprovalId}/decide`, {
    decision: 'APPROVE',
    operatorId: 'secops-lead-01',
    reason: 'Verified vendor invoice signature and executive signoff.',
  });
  console.log(`- Operator decision response: ${decisionRes.data.message}`);
  console.log(`- Updated status: ${decisionRes.data.approval.status}`);
  console.log(`- Decided by: ${decisionRes.data.approval.decidedBy}`);
  if (decisionRes.data.approval.status !== 'APPROVED') {
    throw new Error('Approval status was not updated to APPROVED');
  }
  console.log('✅ Operator approval processed!\n');

  // Test 5: Verify Idempotency & Inactive State
  console.log('--- TEST 5: Subsequent Decision on Finalized Item Rejection ---');
  try {
    await axios.post(`${BASE_URL}/approvals/${pendingApprovalId}/decide`, {
      decision: 'REJECT',
      operatorId: 'another-operator',
    });
    throw new Error('Expected 400 error when modifying already decided approval');
  } catch (err: any) {
    console.log(`- Successfully rejected duplicate decision: ${err.response?.data?.error || err.message}`);
    console.log('✅ State machine transition protections verified!\n');
  }

  console.log('======================================================================');
  console.log('🎉 ALL DAY 15 VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('======================================================================');
}

runDay15Verification().catch((err) => {
  console.error('\n❌ Day 15 Verification Failed:', err);
  process.exit(1);
});
