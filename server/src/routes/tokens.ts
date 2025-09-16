import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const router = Router();

// 토큰 초기화 (신규 사용자)
router.post('/initialize', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // 이미 토큰이 있는지 확인
    const { data: existingTokens, error: checkError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing tokens:', checkError);
      return res.status(500).json({ error: 'Failed to check existing tokens' });
    }

    if (existingTokens) {
      return res.json({
        success: true,
        message: '이미 토큰이 초기화되어 있습니다',
        balance: existingTokens.balance
      });
    }

    // 신규 사용자에게 100토큰 지급
    const initialBalance = 100;

    const { data: newTokens, error: insertError } = await supabase
      .from('user_tokens')
      .insert({
        user_id: userId,
        balance: initialBalance,
        total_used: 0
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error initializing tokens:', insertError);
      return res.status(500).json({ error: 'Failed to initialize tokens' });
    }

    // 초기 토큰 지급 트랜잭션 기록
    const { error: transactionError } = await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        amount: initialBalance,
        type: 'bonus',
        description: '신규 가입 보너스'
      });

    if (transactionError) {
      console.error('Error recording initial transaction:', transactionError);
    }

    res.json({
      success: true,
      message: '토큰이 성공적으로 초기화되었습니다',
      balance: initialBalance
    });

  } catch (error) {
    console.error('Initialize tokens error:', error);
    res.status(500).json({ error: 'Failed to initialize tokens' });
  }
});

// 현재 토큰 잔액 조회
router.get('/user/tokens', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: tokens, error } = await supabase
      .from('user_tokens')
      .select('balance, total_used')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error getting token balance:', error);
      return res.status(500).json({ error: 'Failed to get token balance' });
    }

    res.json({
      success: true,
      balance: tokens.balance,
      totalUsed: tokens.total_used
    });

  } catch (error) {
    console.error('Get token balance error:', error);
    res.status(500).json({ error: 'Failed to get token balance' });
  }
});

// 토큰 사용 (차감)
router.post('/user/tokens', authMiddleware, rateLimitMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { usedAmount, description = '토큰 사용' } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!usedAmount || usedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid token amount' });
    }

    // Supabase 함수 호출로 토큰 사용 처리
    const { data, error } = await supabase.rpc('use_tokens', {
      p_user_id: userId,
      p_amount: usedAmount
    });

    if (error) {
      console.error('Error using tokens:', error);
      return res.status(500).json({ error: 'Failed to use tokens' });
    }

    if (!data) {
      return res.status(400).json({ error: 'Insufficient token balance' });
    }

    // 사용 내역 기록
    const { error: transactionError } = await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        amount: -usedAmount, // 음수로 기록 (차감)
        type: 'usage',
        description
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
    }

    // 업데이트된 잔액 조회
    const { data: updatedTokens, error: balanceError } = await supabase
      .from('user_tokens')
      .select('balance, total_used')
      .eq('user_id', userId)
      .single();

    if (balanceError) {
      console.error('Error getting updated balance:', balanceError);
      return res.status(500).json({ error: 'Failed to get updated balance' });
    }

    res.json({
      success: true,
      usedAmount,
      remainingBalance: updatedTokens.balance,
      totalUsed: updatedTokens.total_used,
      description
    });

  } catch (error) {
    console.error('Use tokens error:', error);
    res.status(500).json({ error: 'Failed to use tokens' });
  }
});

// 토큰 사용 내역 조회
router.get('/user/tokens/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { data: transactions, error } = await supabase
      .from('token_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error getting transaction history:', error);
      return res.status(500).json({ error: 'Failed to get transaction history' });
    }

    res.json({
      success: true,
      transactions: transactions.map(tx => ({
        id: tx.id,
        user_id: tx.user_id,
        tokens_used: Math.abs(tx.amount), // 절댓값으로 표시
        description: tx.description,
        created_at: tx.created_at
      }))
    });

  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({ error: 'Failed to get transaction history' });
  }
});

// 토큰 추가 (결제 완료 후)
router.post('/user/tokens/add', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { amount, type = 'purchase', description = '토큰 구매', referenceId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid token amount' });
    }

    // Supabase 함수 호출로 토큰 추가 처리
    const { data, error } = await supabase.rpc('add_tokens', {
      p_user_id: userId,
      p_amount: amount,
      p_type: type,
      p_description: description,
      p_reference_id: referenceId
    });

    if (error) {
      console.error('Error adding tokens:', error);
      return res.status(500).json({ error: 'Failed to add tokens' });
    }

    // 업데이트된 잔액 조회
    const { data: updatedTokens, error: balanceError } = await supabase
      .from('user_tokens')
      .select('balance, total_used')
      .eq('user_id', userId)
      .single();

    if (balanceError) {
      console.error('Error getting updated balance:', balanceError);
      return res.status(500).json({ error: 'Failed to get updated balance' });
    }

    res.json({
      success: true,
      addedAmount: amount,
      newBalance: updatedTokens.balance,
      totalUsed: updatedTokens.total_used
    });

  } catch (error) {
    console.error('Add tokens error:', error);
    res.status(500).json({ error: 'Failed to add tokens' });
  }
});

export default router;