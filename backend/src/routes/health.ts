import { Router, Request, Response } from 'express';
import { isSupabaseConfigured } from '../config/supabase';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'agentic-payments-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    supabaseConfigured: isSupabaseConfigured(),
    features: {
      authMiddleware: true,
      programmableWallets: true,
      autonomousPolicyEngine: true,
      supportedChains: ['base-sepolia']
    }
  });
});

export default router;
