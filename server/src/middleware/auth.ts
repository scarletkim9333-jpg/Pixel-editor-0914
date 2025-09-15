import { Request, Response, NextFunction } from 'express';
import { supabaseService } from '../services/supabase';

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({ error: 'Invalid authorization token' });
    }

    const { data: user, error } = await supabaseService.verifyToken(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

export const optionalAuthMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      if (token) {
        const { data: user, error } = await supabaseService.verifyToken(token);

        if (!error && user) {
          req.user = user;
        }
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};