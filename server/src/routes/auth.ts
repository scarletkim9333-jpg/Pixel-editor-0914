import { Router, Request, Response } from 'express';
import { supabaseService } from '../services/supabase';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const router = Router();

router.post('/login', rateLimitMiddleware, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await supabaseService.signIn(email, password);

    if (result.error) {
      return res.status(401).json({ error: result.error.message });
    }

    res.json({
      user: result.data.user,
      session: result.data.session
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/register', rateLimitMiddleware, async (req: Request, res: Response) => {
  try {
    const { email, password, metadata } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await supabaseService.signUp(email, password, metadata);

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({
      user: result.data.user,
      session: result.data.session
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await supabaseService.signOut();

    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await supabaseService.getCurrentUser();

    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const result = await supabaseService.refreshSession(refresh_token);

    if (result.error) {
      return res.status(401).json({ error: result.error.message });
    }

    res.json({
      user: result.data.user,
      session: result.data.session
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

export default router;