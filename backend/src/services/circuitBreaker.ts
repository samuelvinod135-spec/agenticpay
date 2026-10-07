import { Request, Response, NextFunction } from 'express';

export type CircuitStatus = 'HEALTHY' | 'SYSTEM_QUARANTINE';

interface TransferEvent {
  timestamp: number;
  success: boolean;
  reason?: string;
  tenantOrgId?: string;
}

export class GlobalCircuitBreaker {
  private events: TransferEvent[] = [];
  private readonly windowMs: number = 60 * 1000; // 60 seconds
  private readonly failureThresholdPercent: number = 15; // 15%
  private readonly minSampleSize: number = 5; // Minimum transfers before evaluating threshold
  private state: CircuitStatus = 'HEALTHY';
  private trippedAt?: string;
  private tripReason?: string;

  // Quarantined tenant set
  private frozenTenants: Set<string> = new Set();

  /**
   * Record a transfer outcome in the sliding 60s window
   */
  public recordOutcome(success: boolean, reason?: string, tenantOrgId?: string): void {
    const now = Date.now();
    this.events.push({
      timestamp: now,
      success,
      reason,
      tenantOrgId,
    });
    this.pruneOldEvents();
    this.evaluateCircuitState();
  }

  /**
   * Remove events older than 60s
   */
  private pruneOldEvents(): void {
    const cutoff = Date.now() - this.windowMs;
    this.events = this.events.filter((e) => e.timestamp >= cutoff);
  }

  /**
   * Evaluate whether failure rate exceeds 15% threshold
   */
  private evaluateCircuitState(): void {
    this.pruneOldEvents();

    if (this.events.length < this.minSampleSize) {
      return;
    }

    const failedCount = this.events.filter((e) => !e.success).length;
    const failureRate = (failedCount / this.events.length) * 100;

    if (failureRate > this.failureThresholdPercent && this.state !== 'SYSTEM_QUARANTINE') {
      this.state = 'SYSTEM_QUARANTINE';
      this.trippedAt = new Date().toISOString();
      this.tripReason = `Failure / anomaly rate reached ${failureRate.toFixed(1)}% (>15% ceiling) across ${this.events.length} transfers in 60s window`;
      console.warn(`[CircuitBreaker] 🚨 AUTO-TRIP ACTIVATED: ${this.tripReason}`);
    }
  }

  /**
   * Reset global circuit breaker back to HEALTHY
   */
  public resetGlobalCircuit(): void {
    this.state = 'HEALTHY';
    this.events = [];
    this.trippedAt = undefined;
    this.tripReason = undefined;
    console.log('[CircuitBreaker] 🟢 Global circuit breaker manually reset to HEALTHY.');
  }

  /**
   * Force manual trip (e.g. for testing or emergency lockdown)
   */
  public tripGlobalCircuit(reason?: string): void {
    this.state = 'SYSTEM_QUARANTINE';
    this.trippedAt = new Date().toISOString();
    this.tripReason = reason || 'Manual emergency circuit breaker trip';
  }

  /**
   * Freeze a specific tenant
   */
  public freezeTenant(tenantOrgId: string): void {
    this.frozenTenants.add(tenantOrgId.trim().toLowerCase());
  }

  /**
   * Unfreeze a tenant
   */
  public unfreezeTenant(tenantOrgId: string): void {
    this.frozenTenants.delete(tenantOrgId.trim().toLowerCase());
  }

  /**
   * Check if a tenant is frozen
   */
  public isTenantFrozen(tenantOrgId?: string): boolean {
    if (!tenantOrgId) return false;
    return this.frozenTenants.has(tenantOrgId.trim().toLowerCase());
  }

  /**
   * Current circuit status inspection
   */
  public getStatus() {
    this.pruneOldEvents();
    const total = this.events.length;
    const failed = this.events.filter((e) => !e.success).length;
    const failureRate = total > 0 ? (failed / total) * 100 : 0;

    return {
      status: this.state,
      quarantined: this.state === 'SYSTEM_QUARANTINE',
      trippedAt: this.trippedAt,
      tripReason: this.tripReason,
      metrics: {
        totalTransfersInWindow: total,
        failedOrFlaggedTransfers: failed,
        failureRatePercent: parseFloat(failureRate.toFixed(2)),
        windowSeconds: 60,
      },
      frozenTenants: Array.from(this.frozenTenants),
    };
  }

  public getState(): CircuitStatus {
    return this.state;
  }
}

export const circuitBreaker = new GlobalCircuitBreaker();

/**
 * Express Middleware protecting financial transfer routes against tripped circuit or frozen tenants
 */
export function circuitBreakerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const tenantOrgId = (req as any).orgId || (req.headers['x-tenant-id'] as string);

  // 1. Check if specific tenant is in emergency freeze
  if (tenantOrgId && circuitBreaker.isTenantFrozen(tenantOrgId)) {
    res.status(423).json({
      success: false,
      error: 'Tenant Quarantined',
      code: 'TENANT_FROZEN',
      message: `Tenant account '${tenantOrgId}' is in emergency freeze. All autonomous agent transfers halted.`,
    });
    return;
  }

  // 2. Check if global circuit breaker has tripped
  if (circuitBreaker.getState() === 'SYSTEM_QUARANTINE') {
    const status = circuitBreaker.getStatus();
    res.status(503).json({
      success: false,
      error: 'System Quarantine',
      code: 'GLOBAL_CIRCUIT_BREAKER_TRIPPED',
      message: `Global financial circuit breaker active: ${status.tripReason || 'High anomaly error rate detected (>15%)'}. All transfers temporarily halted.`,
      trippedAt: status.trippedAt,
    });
    return;
  }

  next();
}
