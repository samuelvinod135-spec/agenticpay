import { AgenticPayClient } from './index';

export interface LlamaIndexToolMetadata {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export interface AgenticPayLlamaIndexToolOptions {
  agentId?: string;
}

/**
 * Standard LlamaIndex FunctionTool implementation for AgenticPay
 */
export class AgenticPayLlamaIndexTool {
  public readonly metadata: LlamaIndexToolMetadata = {
    name: 'agenticpay_transfer',
    description:
      'Initiates an on-chain USDC payment governed by institutional financial policy and spending caps on Base Sepolia.',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Amount of USDC to transfer (e.g. 1.50)',
        },
        recipient: {
          type: 'string',
          description: '42-character EVM recipient address (0x...) on Base Sepolia',
        },
        reason: {
          type: 'string',
          description: 'Business purpose or justification for the autonomous payment',
        },
      },
      required: ['amount', 'recipient'],
    },
  };

  private client: AgenticPayClient;
  private agentId: string;

  constructor(
    clientOrConfig: AgenticPayClient | { client: AgenticPayClient; agentId?: string },
    options?: AgenticPayLlamaIndexToolOptions
  ) {
    if ('client' in clientOrConfig && clientOrConfig.client) {
      this.client = clientOrConfig.client;
      this.agentId = clientOrConfig.agentId || 'AutoPay-Agent-01';
    } else if (clientOrConfig instanceof AgenticPayClient) {
      this.client = clientOrConfig;
      this.agentId = options?.agentId || 'AutoPay-Agent-01';
    } else {
      throw new Error('AgenticPayLlamaIndexTool requires a valid AgenticPayClient instance.');
    }
  }

  async call(params: { amount: number; recipient: string; reason?: string }): Promise<string> {
    const { amount, recipient, reason } = params;

    try {
      const result = await this.client.transfers.create({
        agentId: this.agentId,
        amount,
        recipient,
        reason: reason || 'LlamaIndex Autonomous Agent Transfer',
      });

      if (result.success) {
        return JSON.stringify({
          status: 'SUCCESS',
          amount,
          recipient,
          txHash: result.txHash,
          transactionId: result.transactionId,
          blockchain: result.blockchain,
          message: result.message,
        });
      } else {
        return JSON.stringify({
          status: 'REJECTED_BY_POLICY',
          amount,
          recipient,
          error: result.error,
          reason: result.reason,
        });
      }
    } catch (err: any) {
      return JSON.stringify({
        status: 'ERROR',
        message: err.message,
      });
    }
  }
}
