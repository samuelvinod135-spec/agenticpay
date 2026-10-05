import dotenv from 'dotenv';
import crypto from 'crypto';
import {
  initiateDeveloperControlledWalletsClient,
  CircleDeveloperControlledWalletsClient,
  Blockchain,
} from '@circle-fin/developer-controlled-wallets';

dotenv.config();

export interface AgentWalletResult {
  id: string;
  address: string;
  blockchain: string;
  walletSetId?: string;
  provider: 'circle' | 'cdp';
  isLive: boolean;
  state: 'LIVE' | 'SIMULATED';
  createdAt: string;
}

export interface WalletBalanceResult {
  walletId: string;
  tokenBalances: Array<{
    token: {
      id: string;
      blockchain: string;
      tokenAddress?: string;
      standard?: string;
      name?: string;
      symbol?: string;
      decimals?: number;
    };
    amount: string;
    updateDate: string;
  }>;
}

export class WalletService {
  private client: CircleDeveloperControlledWalletsClient | null = null;
  private defaultWalletSetId: string | null = null;

  constructor() {
    this.initClient();
  }

  /**
   * Check if live Circle credentials are provided in the environment
   */
  public isCircleConfigured(): boolean {
    const apiKey = process.env.CIRCLE_API_KEY;
    const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

    return (
      !!apiKey &&
      !apiKey.includes('your_circle_api_key') &&
      apiKey.trim().length > 10 &&
      !!entitySecret &&
      !entitySecret.includes('your_32_byte') &&
      entitySecret.trim().length >= 32
    );
  }

  /**
   * Initialize Circle Developer-Controlled Wallets SDK client
   */
  private initClient(): void {
    if (this.isCircleConfigured()) {
      try {
        this.client = initiateDeveloperControlledWalletsClient({
          apiKey: process.env.CIRCLE_API_KEY!,
          entitySecret: process.env.CIRCLE_ENTITY_SECRET!,
        });
        console.log('[WalletService] Circle Developer-Controlled Wallets SDK initialized successfully.');
      } catch (err: any) {
        console.error('[WalletService] Failed to initialize Circle client:', err.message);
        this.client = null;
      }
    } else {
      console.log(
        '[WalletService] Circle credentials not detected or using placeholder. Running in simulated Web3 testnet mode.'
      );
    }
  }

  /**
   * Get or create a default WalletSet for agent wallets
   */
  public async getOrCreateDefaultWalletSet(name: string = 'AgenticPay Default Fleet'): Promise<string> {
    if (this.defaultWalletSetId) {
      return this.defaultWalletSetId;
    }

    if (this.client && this.isCircleConfigured()) {
      try {
        // Check for existing wallet sets
        const listResponse = await this.client.listWalletSets();
        const existingSets = listResponse.data?.walletSets;

        if (existingSets && existingSets.length > 0) {
          this.defaultWalletSetId = existingSets[0].id;
          return this.defaultWalletSetId;
        }

        // Create a new wallet set if none exists
        const createResponse = await this.client.createWalletSet({ name });
        if (createResponse.data?.walletSet?.id) {
          this.defaultWalletSetId = createResponse.data.walletSet.id;
          return this.defaultWalletSetId;
        }
      } catch (err: any) {
        console.warn('[WalletService] Error retrieving/creating Circle WalletSet:', err.message);
      }
    }

    // Mock fallback WalletSet ID
    this.defaultWalletSetId = 'mock-walletset-' + crypto.randomBytes(8).toString('hex');
    return this.defaultWalletSetId;
  }

  /**
   * Provision a developer-controlled wallet on Base Sepolia for an AI agent
   */
  public async createAgentWallet(options?: {
    name?: string;
    walletSetId?: string;
    blockchain?: Blockchain;
  }): Promise<AgentWalletResult> {
    const blockchain = options?.blockchain || Blockchain.BaseSepolia;
    const now = new Date().toISOString();

    if (this.client && this.isCircleConfigured()) {
      try {
        const walletSetId = options?.walletSetId || (await this.getOrCreateDefaultWalletSet());

        const response = await this.client.createWallets({
          blockchains: [blockchain],
          count: 1,
          walletSetId,
        });

        const createdWallet = response.data?.wallets?.[0];

        if (createdWallet) {
          return {
            id: createdWallet.id,
            address: createdWallet.address,
            blockchain: createdWallet.blockchain.toLowerCase(),
            walletSetId: createdWallet.walletSetId,
            provider: 'circle',
            isLive: true,
            state: 'LIVE',
            createdAt: createdWallet.createDate || now,
          };
        }
      } catch (err: any) {
        console.error('[WalletService] Circle live wallet creation failed, falling back to simulation:', err.message);
      }
    }

    // Fallback: Generate deterministic cryptographic EVM address on Base Sepolia
    const randomBytes = crypto.randomBytes(20);
    const mockAddress = '0x' + randomBytes.toString('hex');
    const mockWalletId = crypto.randomUUID();

    return {
      id: mockWalletId,
      address: mockAddress,
      blockchain: 'base-sepolia',
      walletSetId: options?.walletSetId || 'simulated-wallet-set',
      provider: 'circle',
      isLive: false,
      state: 'SIMULATED',
      createdAt: now,
    };
  }

  /**
   * Retrieve wallet details by ID
   */
  public async getWallet(walletId: string): Promise<any> {
    if (this.client && this.isCircleConfigured()) {
      try {
        const res = await this.client.getWallet({ id: walletId });
        return res.data?.wallet;
      } catch (err: any) {
        console.warn(`[WalletService] Failed to fetch Circle wallet ${walletId}:`, err.message);
      }
    }

    return {
      id: walletId,
      blockchain: 'BASE-SEPOLIA',
      state: 'SIMULATED',
      createDate: new Date().toISOString(),
    };
  }

  /**
   * Retrieve token balances for a wallet
   */
  public async getWalletBalance(walletId: string): Promise<WalletBalanceResult> {
    if (this.client && this.isCircleConfigured()) {
      try {
        const res = await this.client.getWalletTokenBalance({ id: walletId });
        return {
          walletId,
          tokenBalances: (res.data?.tokenBalances as any) || [],
        };
      } catch (err: any) {
        console.warn(`[WalletService] Failed to fetch Circle balance for ${walletId}:`, err.message);
      }
    }

    // Mock initial balance for Base Sepolia testnet demonstration
    return {
      walletId,
      tokenBalances: [
        {
          token: {
            id: 'usdc-base-sepolia-token-id',
            blockchain: 'BASE-SEPOLIA',
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
          },
          amount: '100.00',
          updateDate: new Date().toISOString(),
        },
      ],
    };
  }
}

export const walletService = new WalletService();
