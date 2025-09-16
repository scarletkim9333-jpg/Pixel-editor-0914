import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No valid auth header');
      return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authHeader.substring(7);
    console.log('Token extracted:', token.substring(0, 50) + '...');

    if (!token) {
      console.log('No token extracted');
      return res.status(401).json({ error: 'Invalid authorization token' });
    }

    const { data, error } = await supabase.auth.getUser(token);
    console.log('Token verification result:', { data: !!data, error, userDetails: data });

    if (error || !data?.user) {
      console.log('Token verification failed:', error);
      return res.status(401).json({ error: 'User not authenticated' });
    }

    req.user = data.user;
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
        const { data, error } = await supabase.auth.getUser(token);

        if (!error && data?.user) {
          req.user = data.user;
        }
      }
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};