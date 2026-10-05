import { Router, Request, Response } from 'express';
import { agentStore } from '../services/store';

const router = Router();

// GET /api/wallets - List wallets belonging to user's agents
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    const agents = await agentStore.getAgentsByUser(userId);
    const wallets = agents.map(a => a.wallet).filter(Boolean);

    res.json({
      success: true,
      wallets
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve wallets',
      message: error.message
    });
  }
});

// GET /api/wallets/:agentId - Get wallet for specific agent
router.get('/:agentId', async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id || '00000000-0000-0000-0000-000000000001';
    const agents = await agentStore.getAgentsByUser(userId);
    const agent = agents.find(a => a.id === req.params.agentId);

    if (!agent || !agent.wallet) {
      res.status(404).json({
        success: false,
        error: 'Wallet not found for specified agent'
      });
      return;
    }

    res.json({
      success: true,
      wallet: agent.wallet
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve wallet',
      message: error.message
    });
  }
});

export default router;
