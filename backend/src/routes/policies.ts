import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { agentStore } from '../services/store';

const router = Router();

const updatePolicySchema = z.object({
  dailyLimitUsd: z.number().positive('Daily limit must be greater than 0'),
  maxPerTxUsd: z.number().positive('Max per transaction limit must be greater than 0'),
  allowedChains: z.array(z.string()).min(1).default(['base-sepolia'])
}).refine(data => data.maxPerTxUsd <= data.dailyLimitUsd, {
  message: 'Max per transaction cannot exceed daily limit',
  path: ['maxPerTxUsd']
});

// GET /api/policies/:agentId
router.get('/:agentId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    const agents = await agentStore.getAgentsByUser(userId);
    const agent = agents.find(a => a.id === req.params.agentId);

    if (!agent || !agent.policy) {
      res.status(404).json({
        success: false,
        error: 'Policy not found for agent'
      });
      return;
    }

    res.json({
      success: true,
      policy: agent.policy
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve policy',
      message: error.message
    });
  }
});

// PUT /api/policies/:agentId
router.put('/:agentId', async (req: Request, res: Response) => {
  try {
    const parseResult = updatePolicySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: parseResult.error.flatten()
      });
      return;
    }

    const { dailyLimitUsd, maxPerTxUsd, allowedChains } = parseResult.data;
    const updated = await agentStore.updatePolicy(
      req.params.agentId,
      dailyLimitUsd,
      maxPerTxUsd,
      allowedChains
    );

    if (!updated) {
      res.status(404).json({
        success: false,
        error: 'Agent or policy not found'
      });
      return;
    }

    res.json({
      success: true,
      policy: updated
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to update policy',
      message: error.message
    });
  }
});

export default router;
