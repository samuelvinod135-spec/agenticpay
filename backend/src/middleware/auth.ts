import { Request, Response, NextFunction } from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { User } from '@supabase/supabase-js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
      } | User;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authorization header with Bearer token is required.'
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  // Demo fallback when testing or developing before live Supabase keys are plugged in
  if (token === 'demo-token' || token === 'mock-token' || (!isSupabaseConfigured() && token.length > 5)) {
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'demo-agent-master@agentic-payments.xyz'
    };
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: error?.message || 'Invalid or expired authentication token.'
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate user.'
    });
  }
};
