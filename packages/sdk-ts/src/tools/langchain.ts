import { StructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { AgenticPayClient } from '../client';

export interface AgenticPayToolOptions {
  agentId?: string;
}

export class AgenticPayLangChainTool extends StructuredTool {
  name = 'agentic_pay_transfer';
  description =
    'Allows an AI agent to send USDC payments on Base Sepolia. Automatically checks and enforces spending policies before sending.';

  schema = z.object({
    amount: z
      .number()
      .positive('Amount must be greater than 0')
      .describe('The amount in USDC to transfer (e.g. 0.50, 2.00)'),
    recipient: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid 42-character EVM address (0x...)')
      .describe('The 42-character EVM recipient address (0x...) on Base Sepolia'),
    reason: z
      .string()
      .describe('The business purpose or justification for this payment'),
  });

  private client: AgenticPayClient;
  private agentId: string;

  constructor(
    clientOrConfig: AgenticPayClient | { client: AgenticPayClient; agentId?: string },
    options?: AgenticPayToolOptions
  ) {
    super();

    if ('client' in clientOrConfig && clientOrConfig.client) {
      this.client = clientOrConfig.client;
      this.agentId = clientOrConfig.agentId || 'AutoPay-Agent-01';
    } else if (clientOrConfig instanceof AgenticPayClient) {
      this.client = clientOrConfig;
      this.agentId = options?.agentId || 'AutoPay-Agent-01';
    } else {
      throw new Error('AgenticPayLangChainTool requires a valid AgenticPayClient instance.');
    }
  }

  async _call(input: { amount: number; recipient: string; reason: string }): Promise<string> {
    const { amount, recipient, reason } = input;

    try {
      const result = await this.client.transfers.create({
        agentId: this.agentId,
        amount,
        recipient,
        reason,
      });

      if (result.success) {
        const txHashStr = result.txHash
          ? ` Transaction Hash: ${result.txHash} (Explorer: https://sepolia.basescan.org/tx/${result.txHash})`
          : result.transactionId
          ? ` Circle Tx ID: ${result.transactionId}`
          : '';

        return `✅ Payment Successful: Transferred $${amount.toFixed(2)} USDC to ${recipient} for "${reason}".${txHashStr} Status: ${result.state || 'INITIATED'}.`;
      } else {
        const failureReason = result.reason || result.error || 'Spending limit policy violated.';
        return `❌ Payment Rejected: The proposed transfer of $${amount.toFixed(2)} USDC to ${recipient} was blocked by the AgenticPay firewall. Reason: ${failureReason}. Please adjust the payment amount within approved spending caps.`;
      }
    } catch (err: any) {
      return `❌ Payment Failed: Unable to execute transfer of $${amount.toFixed(2)} USDC to ${recipient}. Error: ${err.message}`;
    }
  }

  async call(input: { amount: number; recipient: string; reason: string }): Promise<string> {
    return this._call(input);
  }
}

/**
 * Backward compatibility alias
 */
export const AgenticPayTool = AgenticPayLangChainTool;
