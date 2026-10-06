import crypto from 'crypto';

export interface PendingApproval {
  id: string;
  agentId: string;
  walletId: string;
  destinationAddress: string;
  amountUsdc: number;
  reason?: string;
  status: 'PENDING_HUMAN_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  thresholdUsdc: number;
  decidedBy?: string;
  decisionReason?: string;
  expiresAt: string;
  createdAt: string;
}

const memoryApprovals = new Map<string, PendingApproval>();

export const approvalService = {
  // Global default threshold ($20.00)
  defaultThresholdUsdc: 20.0,

  /**
   * Check if an amount warrants pausing for human-in-the-loop review
   */
  requiresApproval(amountUsdc: number, customThreshold?: number): boolean {
    const threshold = customThreshold !== undefined ? customThreshold : this.defaultThresholdUsdc;
    return amountUsdc >= threshold;
  },

  /**
   * Queue transfer for human approval with a 15-minute expiration window
   */
  createPendingApproval(params: {
    agentId: string;
    walletId: string;
    destinationAddress: string;
    amountUsdc: number;
    reason?: string;
    thresholdUsdc?: number;
  }): PendingApproval {
    const id = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString(); // 15 minutes window

    const approval: PendingApproval = {
      id,
      agentId: params.agentId,
      walletId: params.walletId,
      destinationAddress: params.destinationAddress,
      amountUsdc: params.amountUsdc,
      reason: params.reason,
      status: 'PENDING_HUMAN_APPROVAL',
      thresholdUsdc: params.thresholdUsdc || this.defaultThresholdUsdc,
      expiresAt,
      createdAt: now.toISOString(),
    };

    memoryApprovals.set(id, approval);
    return approval;
  },

  /**
   * List pending approvals, auto-expiring any that exceeded 15 minutes
   */
  listPending(): PendingApproval[] {
    const now = Date.now();
    const results: PendingApproval[] = [];

    for (const app of memoryApprovals.values()) {
      if (app.status === 'PENDING_HUMAN_APPROVAL') {
        if (new Date(app.expiresAt).getTime() < now) {
          app.status = 'EXPIRED';
        } else {
          results.push(app);
        }
      }
    }

    return results;
  },

  /**
   * Get an approval by ID
   */
  get(approvalId: string): PendingApproval | undefined {
    return memoryApprovals.get(approvalId);
  },

  /**
   * Operator human decision on queued transfer
   */
  decide(
    approvalId: string,
    decision: 'APPROVE' | 'REJECT',
    operatorId: string,
    reason?: string
  ): PendingApproval {
    const approval = memoryApprovals.get(approvalId);
    if (!approval) {
      throw new Error(`Approval ID '${approvalId}' not found.`);
    }

    if (approval.status !== 'PENDING_HUMAN_APPROVAL') {
      throw new Error(`Cannot decide on approval in status '${approval.status}'.`);
    }

    if (new Date(approval.expiresAt).getTime() < Date.now()) {
      approval.status = 'EXPIRED';
      throw new Error('Approval request has expired (15-minute window passed).');
    }

    approval.status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    approval.decidedBy = operatorId;
    approval.decisionReason = reason;

    return approval;
  },
};
