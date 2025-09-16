import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const router = Router();

router.get('/tokens', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: userTokens, error } = await supabase
      .from('user_tokens')
      .select('balance, total_used, created_at, updated_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'User tokens not found' });
      }
      throw error;
    }

    res.json({
      balance: userTokens.balance,
      totalUsed: userTokens.total_used,
      createdAt: userTokens.created_at,
      updatedAt: userTokens.updated_at
    });
  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({ error: 'Failed to get token balance' });
  }
});

router.post('/tokens/use', authMiddleware, rateLimitMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { amount, description } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const { data: result, error } = await supabase
      .rpc('use_tokens', {
        p_user_id: userId,
        p_amount: amount
      });

    if (error) {
      throw error;
    }

    if (!result) {
      return res.status(400).json({ error: 'Insufficient tokens' });
    }

    const { data: updatedTokens, error: fetchError } = await supabase
      .from('user_tokens')
      .select('balance, total_used')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    res.json({
      success: true,
      usedAmount: amount,
      remainingBalance: updatedTokens.balance,
      totalUsed: updatedTokens.total_used,
      description: description || 'Token usage'
    });
  } catch (error) {
    console.error('Use tokens error:', error);
    res.status(500).json({ error: 'Failed to use tokens' });
  }
});

router.get('/tokens/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { limit = 50, offset = 0 } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: transactions, error } = await supabase
      .from('token_transactions')
      .select('id, amount, type, description, reference_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      throw error;
    }

    res.json({
      transactions,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: transactions.length
      }
    });
  } catch (error) {
    console.error('Get token history error:', error);
    res.status(500).json({ error: 'Failed to get token history' });
  }
});

router.post('/tokens/initialize', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // First, ensure user exists in public.users table
    const user = (req as any).user;
    const { error: userInsertError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name || null
      });

    if (userInsertError) {
      console.error('Failed to create user record:', userInsertError);
      return res.status(500).json({ error: 'Failed to create user record' });
    }

    // Check if user already has tokens
    const { data: existingTokens, error: checkError } = await supabase
      .from('user_tokens')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!checkError && existingTokens) {
      return res.status(400).json({ error: 'User tokens already initialized' });
    }

    // Create initial token record
    const { data: newTokens, error: insertError } = await supabase
      .from('user_tokens')
      .insert({
        user_id: userId,
        balance: 100,
        total_used: 0
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Add transaction record
    const { error: transactionError } = await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        amount: 100,
        type: 'bonus',
        description: 'Initial signup bonus'
      });

    if (transactionError) {
      console.error('Failed to create transaction record:', transactionError);
    }

    res.json({
      success: true,
      message: 'Tokens initialized successfully',
      balance: newTokens.balance,
      initialAmount: 100
    });
  } catch (error) {
    console.error('Initialize tokens error:', error);
    res.status(500).json({ error: 'Failed to initialize tokens' });
  }
});

router.post('/tokens/add', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { amount, type, description, referenceId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!type || !['purchase', 'bonus', 'refund'].includes(type)) {
      return res.status(400).json({ error: 'Valid type is required (purchase, bonus, refund)' });
    }

    const { data: result, error } = await supabase
      .rpc('add_tokens', {
        p_user_id: userId,
        p_amount: amount,
        p_type: type,
        p_description: description || null,
        p_reference_id: referenceId || null
      });

    if (error) {
      throw error;
    }

    const { data: updatedTokens, error: fetchError } = await supabase
      .from('user_tokens')
      .select('balance, total_used')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    res.json({
      success: result,
      addedAmount: amount,
      newBalance: updatedTokens.balance,
      type,
      description: description || 'Token addition'
    });
  } catch (error) {
    console.error('Add tokens error:', error);
    res.status(500).json({ error: 'Failed to add tokens' });
  }
});

export default router;