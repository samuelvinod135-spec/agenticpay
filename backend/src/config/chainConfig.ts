export interface ChainSpecification {
  id: number;
  name: string;
  network: 'base-sepolia' | 'base-mainnet';
  currency: string;
  rpcUrls: string[];
  blockExplorerUrl: string;
  usdcContract: string;
  maxGasPriceGwei: number;
  isTestnet: boolean;
}

export const SUPPORTED_CHAINS: Record<number, ChainSpecification> = {
  84532: {
    id: 84532,
    name: 'Base Sepolia Testnet',
    network: 'base-sepolia',
    currency: 'ETH',
    rpcUrls: [
      'https://sepolia.base.org',
      'https://base-sepolia-rpc.publicnode.com',
      'https://1rpc.io/base-sepolia',
    ],
    blockExplorerUrl: 'https://sepolia.basescan.org',
    usdcContract: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    maxGasPriceGwei: 5.0,
    isTestnet: true,
  },
  8453: {
    id: 8453,
    name: 'Base Mainnet',
    network: 'base-mainnet',
    currency: 'ETH',
    rpcUrls: [
      'https://mainnet.base.org',
      'https://base.llamarpc.com',
      'https://1rpc.io/base',
    ],
    blockExplorerUrl: 'https://basescan.org',
    usdcContract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    maxGasPriceGwei: 3.5,
    isTestnet: false,
  },
};

export const getActiveChainConfig = (): ChainSpecification => {
  const chainIdStr = process.env.CHAIN_ID || process.env.DEFAULT_CHAIN_ID || '84532';
  const chainId = parseInt(chainIdStr, 10);
  return SUPPORTED_CHAINS[chainId] || SUPPORTED_CHAINS[84532];
};
