import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { agentStore } from '../services/store';

const router = Router();

const createAgentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  provider: z.enum(['circle', 'cdp']).default('circle'),
  dailyLimitUsd: z.number().positive().default(10.0),
  maxPerTxUsd: z.number().positive().default(1.0)
});

// GET /api/agents - List agents for logged in user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    const agents = await agentStore.getAgentsByUser(userId);
    res.json({
      success: true,
      agents
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve agents',
      message: error.message
    });
  }
});

// POST /api/agents - Create agent with linked wallet and policy
router.post('/', async (req: Request, res: Response) => {
  try {
    const parseResult = createAgentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: parseResult.error.flatten()
      });
      return;
    }

    const { name, provider, dailyLimitUsd, maxPerTxUsd } = parseResult.data;
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';

    const newAgent = await agentStore.createAgent(
      userId,
      name,
      provider,
      dailyLimitUsd,
      maxPerTxUsd
    );

    res.status(201).json({
      success: true,
      agent: newAgent
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to create agent',
      message: error.message
    });
  }
});

export default router;
