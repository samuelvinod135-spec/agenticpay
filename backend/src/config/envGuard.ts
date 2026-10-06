import dotenv from 'dotenv';
dotenv.config();

export interface EnvironmentGuardrailResult {
  allowed: boolean;
  environment: string;
  violations: string[];
}

/**
 * Environment Guardrails
 * Protects against accidental execution with mainnet keys or mainnet chains in dev/test.
 */
export const verifyEnvironmentGuardrails = (): EnvironmentGuardrailResult => {
  const env = process.env.NODE_ENV || 'development';
  const violations: string[] = [];

  const mainnetRpc = process.env.BASE_MAINNET_RPC_URL || '';
  const mainnetKey = process.env.MAINNET_PRIVATE_KEY || '';
  const targetChain = process.env.DEFAULT_CHAIN_ID || process.env.BLOCKCHAIN || 'base-sepolia';

  if (env === 'development' || env === 'test') {
    // 1. Guard against mainnet chain target in non-production
    if (targetChain === 'base-mainnet' || targetChain === '8453') {
      violations.push('Target chain is set to Base Mainnet (8453) in development/test environment.');
    }

    // 2. Guard against production mainnet private keys loaded in dev/test
    if (mainnetKey && !mainnetKey.startsWith('0x0000') && !mainnetKey.includes('mock')) {
      violations.push('Production MAINNET_PRIVATE_KEY detected in development/test environment.');
    }

    // 3. Guard against unauthenticated mainnet RPC endpoints
    if (mainnetRpc && !mainnetRpc.includes('localhost') && !mainnetRpc.includes('sepolia') && targetChain === '8453') {
      violations.push('Production mainnet RPC configured without explicit production environment flag.');
    }
  }

  return {
    allowed: violations.length === 0,
    environment: env,
    violations,
  };
};

/**
 * Asserts guardrails on startup; throws in case of severe misconfiguration
 */
export const assertEnvironmentSafety = (): void => {
  const result = verifyEnvironmentGuardrails();
  if (!result.allowed) {
    const errorMsg = `[ENV_GUARDRAIL_VIOLATION] Unsafe environment configuration:\n  - ${result.violations.join('\n  - ')}`;
    console.error(errorMsg);
    if (process.env.ENFORCE_ENV_GUARDRAILS === 'true') {
      throw new Error(errorMsg);
    }
  }
};
