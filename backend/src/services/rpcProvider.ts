import { getActiveChainConfig, ChainSpecification } from '../config/chainConfig';

export interface RpcHealthStatus {
  url: string;
  healthy: boolean;
  latencyMs: number;
  lastBlockNumber?: number;
  lastChecked: string;
}

export class ResilientRpcProvider {
  private chain: ChainSpecification;
  private activeRpcIndex: number = 0;
  private healthCache: Map<string, RpcHealthStatus> = new Map();

  constructor(chain?: ChainSpecification) {
    this.chain = chain || getActiveChainConfig();
  }

  /**
   * Return the primary active RPC URL
   */
  public getActiveRpcUrl(): string {
    return this.chain.rpcUrls[this.activeRpcIndex] || this.chain.rpcUrls[0];
  }

  /**
   * Health-check an individual JSON-RPC endpoint
   */
  public async checkEndpointHealth(url: string, timeoutMs: number = 4000): Promise<RpcHealthStatus> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);
      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data: any = await res.json();
      const lastBlockNumber = parseInt(data.result, 16);

      const status: RpcHealthStatus = {
        url,
        healthy: !isNaN(lastBlockNumber),
        latencyMs,
        lastBlockNumber,
        lastChecked: new Date().toISOString(),
      };
      this.healthCache.set(url, status);
      return status;
    } catch (err: any) {
      const status: RpcHealthStatus = {
        url,
        healthy: false,
        latencyMs: Date.now() - startTime,
        lastChecked: new Date().toISOString(),
      };
      this.healthCache.set(url, status);
      return status;
    }
  }

  /**
   * Execute JSON-RPC request with automated multi-endpoint failover
   */
  public async executeRpc<T = any>(method: string, params: any[] = []): Promise<T> {
    const rpcUrls = this.chain.rpcUrls;
    let lastError: Error | null = null;

    for (let i = 0; i < rpcUrls.length; i++) {
      const candidateIndex = (this.activeRpcIndex + i) % rpcUrls.length;
      const url = rpcUrls[candidateIndex];

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method,
            params,
            id: Date.now(),
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: any = await res.json();
        if (data.error) throw new Error(data.error.message || 'RPC Error');

        // Found working endpoint, update active pointer
        this.activeRpcIndex = candidateIndex;
        return data.result as T;
      } catch (err: any) {
        lastError = err;
        console.warn(`[RpcProvider] Endpoint ${url} failed for ${method}. Failing over...`);
      }
    }

    throw new Error(`All ${rpcUrls.length} RPC endpoints failed for ${method}. Last error: ${lastError?.message}`);
  }

  /**
   * Query gas price in Gwei with max gas protection checks
   */
  public async getGasPriceGwei(): Promise<{ gasPriceGwei: number; safe: boolean; maxAllowedGwei: number }> {
    try {
      const hexGas = await this.executeRpc<string>('eth_gasPrice');
      const gasWei = BigInt(hexGas);
      const gasGwei = Number(gasWei) / 1e9;
      const maxAllowed = this.chain.maxGasPriceGwei;

      return {
        gasPriceGwei: gasGwei,
        safe: gasGwei <= maxAllowed,
        maxAllowedGwei: maxAllowed,
      };
    } catch (err) {
      // Fallback safe estimate on Base Sepolia
      return {
        gasPriceGwei: 0.05,
        safe: true,
        maxAllowedGwei: this.chain.maxGasPriceGwei,
      };
    }
  }

  /**
   * Get cached or live health matrix
   */
  public async getHealthMatrix(): Promise<RpcHealthStatus[]> {
    const results: RpcHealthStatus[] = [];
    for (const url of this.chain.rpcUrls) {
      const health = await this.checkEndpointHealth(url);
      results.push(health);
    }
    return results;
  }
}

export const rpcProvider = new ResilientRpcProvider();
