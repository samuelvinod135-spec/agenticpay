import crypto from 'crypto';

export type SupportedChainId = 'base' | 'arbitrum' | 'solana';

export interface ChainRouteDetails {
  chain: SupportedChainId;
  name: string;
  nativeAsset: string;
  usdcContractOrMint: string;
  estimatedFeeUsd: number;
  avgConfirmationSeconds: number;
}

export const CHAIN_REGISTRY: Record<SupportedChainId, ChainRouteDetails> = {
  base: {
    chain: 'base',
    name: 'Base Network (Coinbase L2)',
    nativeAsset: 'ETH',
    usdcContractOrMint: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    estimatedFeeUsd: 0.003,
    avgConfirmationSeconds: 2,
  },
  arbitrum: {
    chain: 'arbitrum',
    name: 'Arbitrum One L2',
    nativeAsset: 'ETH',
    usdcContractOrMint: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    estimatedFeeUsd: 0.008,
    avgConfirmationSeconds: 3,
  },
  solana: {
    chain: 'solana',
    name: 'Solana High-Performance L1',
    nativeAsset: 'SOL',
    usdcContractOrMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    estimatedFeeUsd: 0.0005,
    avgConfirmationSeconds: 1,
  },
};

export const chainAdapter = {
  /**
   * Validate destination address for target blockchain
   */
  validateAddress(chain: SupportedChainId, address: string): { valid: boolean; reason?: string } {
    const trimmed = address.trim();
    if (chain === 'base' || chain === 'arbitrum') {
      const isEvm = /^0x[a-fA-F0-9]{40}$/.test(trimmed);
      return {
        valid: isEvm,
        reason: isEvm ? undefined : 'Address must be a 42-character EVM hex address (0x...)',
      };
    }

    if (chain === 'solana') {
      const isSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
      return {
        valid: isSolana,
        reason: isSolana ? undefined : 'Address must be a 32-44 character base58 Solana public key',
      };
    }

    return { valid: false, reason: `Unsupported chain ${chain}` };
  },

  /**
   * Route and simulate cross-chain transfer
   */
  async routeTransfer(params: {
    chain: SupportedChainId;
    recipient: string;
    amountUsdc: number;
  }): Promise<{
    success: boolean;
    route: ChainRouteDetails;
    dispatchId: string;
    txHash: string;
    feeUsd: number;
  }> {
    const route = CHAIN_REGISTRY[params.chain];
    if (!route) {
      throw new Error(`Chain ${params.chain} is not supported.`);
    }

    const validation = this.validateAddress(params.chain, params.recipient);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const dispatchId = crypto.randomUUID();
    let txHash: string;

    if (params.chain === 'solana') {
      txHash = crypto.randomBytes(32).toString('base64');
    } else {
      txHash = '0x' + crypto.randomBytes(32).toString('hex');
    }

    return {
      success: true,
      route,
      dispatchId,
      txHash,
      feeUsd: route.estimatedFeeUsd,
    };
  },
};
