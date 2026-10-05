import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { agentStore } from '../services/store';

const router = Router();

const simulatePaymentSchema = z.object({
  agentId: z.string().uuid().or(z.string().min(5)),
  amountUsd: z.number().positive('Amount must be positive')
});

// GET /api/transactions
router.get('/', async (req: Request, res: Response) => {
  try {
    const agentId = req.query.agentId as string | undefined;
    const transactions = await agentStore.getTransactions(agentId);

    res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve transactions',
      message: error.message
    });
  }
});

// POST /api/transactions/simulate - Agent triggers payment against policy
router.post('/simulate', async (req: Request, res: Response) => {
  try {
    const parseResult = simulatePaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: parseResult.error.flatten()
      });
      return;
    }

    const { agentId, amountUsd } = parseResult.data;
    const result = await agentStore.executeSimulatedPayment(agentId, amountUsd);

    if (!result.success) {
      res.status(422).json({
        success: false,
        error: 'Policy Violation',
        reason: result.reason,
        transaction: result.transaction
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Transaction successfully approved and submitted to Base Sepolia',
      transaction: result.transaction
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Transaction simulation failed',
      message: error.message
    });
  }
});

export default router;
