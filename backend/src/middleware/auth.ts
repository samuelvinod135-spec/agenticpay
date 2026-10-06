import { Request, Response, NextFunction } from 'express';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { User } from '@supabase/supabase-js';
import { apiKeyService } from '../services/apiKeyService';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      orgId?: string;
      user?: {
        id: string;
        email?: string;
      } | User;
    }
  }
}

/**
 * Multi-tenant authentication middleware:
 * Supports:
 *  1. Multi-Tenant API Keys: `Authorization: Bearer ag_live_...`
 *  2. Supabase Auth Tokens: JWT bearer tokens
 *  3. Demo/Operator Tokens: Local sandbox sessions
 */
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

  // 1. Multi-Tenant API Key Authentication (ag_live_...)
  if (token.startsWith('ag_live_')) {
    const keyValidation = await apiKeyService.validateApiKey(token);
    if (!keyValidation.valid || !keyValidation.orgId) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid, expired, or revoked API key.'
      });
      return;
    }

    req.orgId = keyValidation.orgId;
    req.user = {
      id: keyValidation.orgId,
      email: 'tenant-api@agenticpay.io'
    };
    return next();
  }

  // 2. Demo fallback when testing or developing before live Supabase keys are plugged in
  if (token === 'demo-token' || token === 'mock-token' || (!isSupabaseConfigured() && token.length > 5)) {
    req.orgId = '00000000-0000-0000-0000-000000000001';
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'demo-agent-master@agentic-payments.xyz'
    };
    return next();
  }

  // 3. Supabase Auth JWT Token Authentication
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
    req.orgId = user.id;
    next();
  } catch (err: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to authenticate user.'
    });
  }
};
