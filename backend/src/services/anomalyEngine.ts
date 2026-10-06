export interface AgentRiskProfile {
  agentId: string;
  status: 'ACTIVE' | 'SUSPENDED';
  historicalAverageAmount: number;
  totalTransactionsCount: number;
  recentTimestamps: number[];
  suspendedReason?: string;
  lastRiskScore: number;
}

const memoryRiskProfiles = new Map<string, AgentRiskProfile>();

export const anomalyEngine = {
  /**
   * Retrieve or initialize risk profile for an agent
   */
  getProfile(agentId: string): AgentRiskProfile {
    let profile = memoryRiskProfiles.get(agentId);
    if (!profile) {
      profile = {
        agentId,
        status: 'ACTIVE',
        historicalAverageAmount: 1.0, // Baseline baseline $1.00
        totalTransactionsCount: 1,
        recentTimestamps: [],
        lastRiskScore: 0.1,
      };
      memoryRiskProfiles.set(agentId, profile);
    }
    return profile;
  },

  /**
   * Evaluate a proposed transfer against fraud and anomaly heuristics
   */
  evaluateTransaction(params: {
    agentId: string;
    amount: number;
    destinationAddress: string;
    isWhitelisted: boolean;
  }): { allowed: boolean; riskScore: number; reason?: string } {
    const profile = this.getProfile(params.agentId);

    // 1. Check if already suspended
    if (profile.status === 'SUSPENDED') {
      return {
        allowed: false,
        riskScore: profile.lastRiskScore,
        reason: `Agent is SUSPENDED due to prior fraud anomaly: ${profile.suspendedReason}`,
      };
    }

    const now = Date.now();
    // Prune timestamps older than 60 seconds for velocity window
    profile.recentTimestamps = profile.recentTimestamps.filter((t) => now - t < 60000);

    let velocityFactor = 0.0;
    if (profile.recentTimestamps.length >= 5) {
      velocityFactor = 0.4; // High burst velocity
    } else if (profile.recentTimestamps.length >= 3) {
      velocityFactor = 0.2;
    }

    let divergenceFactor = 0.0;
    const avg = profile.historicalAverageAmount || 1.0;
    if (params.amount > avg * 4) {
      divergenceFactor = 0.5; // >4x divergence
    } else if (params.amount > avg * 2.5) {
      divergenceFactor = 0.3;
    }

    const destinationFactor = params.isWhitelisted ? 0.0 : 0.15;

    const totalRiskScore = parseFloat(Math.min(1.0, velocityFactor + divergenceFactor + destinationFactor).toFixed(2));
    profile.lastRiskScore = totalRiskScore;

    // Threshold: > 0.85 triggers auto-freeze
    if (totalRiskScore > 0.85) {
      profile.status = 'SUSPENDED';
      profile.suspendedReason = `Anomaly Detected (Score: ${totalRiskScore}): Divergence ${params.amount} > ${avg * 3}x avg, Velocity burst: ${profile.recentTimestamps.length}/min`;
      return {
        allowed: false,
        riskScore: totalRiskScore,
        reason: profile.suspendedReason,
      };
    }

    // Update historical rolling baseline
    profile.recentTimestamps.push(now);
    profile.totalTransactionsCount += 1;
    profile.historicalAverageAmount = (profile.historicalAverageAmount * (profile.totalTransactionsCount - 1) + params.amount) / profile.totalTransactionsCount;

    return { allowed: true, riskScore: totalRiskScore };
  },

  /**
   * Admin unfreeze / restore of a suspended agent
   */
  unfreezeAgent(agentId: string): AgentRiskProfile {
    const profile = this.getProfile(agentId);
    profile.status = 'ACTIVE';
    profile.suspendedReason = undefined;
    profile.lastRiskScore = 0.1;
    profile.recentTimestamps = [];
    return profile;
  },
};
