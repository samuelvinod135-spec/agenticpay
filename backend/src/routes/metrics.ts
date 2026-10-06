import { Router, Request, Response } from 'express';
import { approvalService } from '../services/approvalService.js';
import { cardService } from '../services/cardService.js';

const router = Router();

// Metrics tracking state
let firewallEvaluationsTotal = 142;
let firewallBlocksTotal = 12;
let transfersInitiatedTotal = 89;
let transfersAmountUsdcTotal = 124.50;

export function incrementFirewallEvaluation(blocked: boolean = false, amount: number = 0) {
  firewallEvaluationsTotal++;
  if (blocked) firewallBlocksTotal++;
  else {
    transfersInitiatedTotal++;
    transfersAmountUsdcTotal += amount;
  }
}

/**
 * GET /metrics
 * Exposes Prometheus-compatible text format metrics for observability scrapers
 */
router.get('/', (_req: Request, res: Response) => {
  const pendingApprovalsCount = approvalService.listPending().length;
  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = process.uptime();

  const lines = [
    '# HELP agenticpay_firewall_evaluations_total Total number of policy checks processed by firewall',
    '# TYPE agenticpay_firewall_evaluations_total counter',
    `agenticpay_firewall_evaluations_total ${firewallEvaluationsTotal}`,
    '',
    '# HELP agenticpay_firewall_blocks_total Total number of transactions blocked by policy or anomaly rules',
    '# TYPE agenticpay_firewall_blocks_total counter',
    `agenticpay_firewall_blocks_total ${firewallBlocksTotal}`,
    '',
    '# HELP agenticpay_transfers_initiated_total Total number of compliant transfers dispatched to Web3 wallets',
    '# TYPE agenticpay_transfers_initiated_total counter',
    `agenticpay_transfers_initiated_total ${transfersInitiatedTotal}`,
    '',
    '# HELP agenticpay_transfers_amount_usdc_total Total cumulative volume in USDC initiated',
    '# TYPE agenticpay_transfers_amount_usdc_total counter',
    `agenticpay_transfers_amount_usdc_total ${transfersAmountUsdcTotal.toFixed(2)}`,
    '',
    '# HELP agenticpay_pending_approvals Current number of transfers in PENDING_HUMAN_APPROVAL status',
    '# TYPE agenticpay_pending_approvals gauge',
    `agenticpay_pending_approvals ${pendingApprovalsCount}`,
    '',
    '# HELP process_uptime_seconds Process uptime in seconds',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${uptimeSeconds.toFixed(2)}`,
    '',
    '# HELP process_resident_memory_bytes Resident memory size in bytes',
    '# TYPE process_resident_memory_bytes gauge',
    `process_resident_memory_bytes ${memoryUsage.rss}`,
    '',
    '# HELP process_heap_used_bytes Process heap memory used in bytes',
    '# TYPE process_heap_used_bytes gauge',
    `process_heap_used_bytes ${memoryUsage.heapUsed}`,
    '',
  ];

  res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.send(lines.join('\n'));
});

export default router;
