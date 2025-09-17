import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';

// 토큰 패키지 정의
const TOKEN_PACKAGES = [
  {
    id: 'basic',
    name: '기본',
    tokens: 100,
    price: 1000,
    pricePerToken: 10,
    popular: false,
  },
  {
    id: 'popular',
    name: '인기',
    tokens: 550,
    price: 5000,
    pricePerToken: 9.1,
    popular: true,
    discount: 9,
  },
  {
    id: 'recommended',
    name: '추천',
    tokens: 1200,
    price: 10000,
    pricePerToken: 8.3,
    popular: false,
    discount: 17,
  },
  {
    id: 'premium',
    name: '프리미엄',
    tokens: 3000,
    price: 20000,
    pricePerToken: 6.7,
    popular: false,
    discount: 33,
  },
];

/**
 * 안전한 토큰 차감 로직 (트랜잭션 기반)
 */
async function safeTokenDeduction(
  userId: string,
  amount: number,
  description: string,
  apiCall: () => Promise<any>
): Promise<{ success: boolean; result?: any; error?: string; tokensRefunded?: boolean }> {
  try {
    // 1. 잔액 확인
    const { data: currentTokens, error: balanceError } = await supabase
      .from('user_tokens')
      .select('balance')
      .eq('user_id', userId)
      .single();

    if (balanceError || !currentTokens) {
      throw new Error('Failed to check token balance');
    }

    if (currentTokens.balance < amount) {
      return {
        success: false,
        error: `Insufficient tokens. Required: ${amount}, Available: ${currentTokens.balance}`
      };
    }

    // 2. 토큰 차감 (트랜잭션)
    const { data: deductionResult, error: deductionError } = await supabase
      .rpc('use_tokens', {
        p_user_id: userId,
        p_amount: amount
      });

    if (deductionError || !deductionResult) {
      throw new Error('Failed to deduct tokens');
    }

    // 3. 사용 내역 기록
    const { error: transactionError } = await supabase
      .from('token_transactions')
      .insert({
        user_id: userId,
        amount: -amount,
        type: 'usage',
        description
      });

    if (transactionError) {
      console.error('Failed to record transaction:', transactionError);
    }

    try {
      // 4. API 호출 실행
      const result = await apiCall();

      return {
        success: true,
        result
      };

    } catch (apiError) {
      console.error('API call failed, attempting token refund:', apiError);

      // 5. API 실패시 토큰 환불 시도
      try {
        const { data: refundResult, error: refundError } = await supabase
          .rpc('add_tokens', {
            p_user_id: userId,
            p_amount: amount,
            p_type: 'refund',
            p_description: `환불: ${description} (API 실패)`,
            p_reference_id: null
          });

        if (!refundError && refundResult) {
          return {
            success: false,
            error: apiError instanceof Error ? apiError.message : 'API call failed',
            tokensRefunded: true
          };
        }
      } catch (refundError) {
        console.error('Token refund failed:', refundError);
      }

      return {
        success: false,
        error: apiError instanceof Error ? apiError.message : 'API call failed, refund failed',
        tokensRefunded: false
      };
    }

  } catch (error) {
    console.error('Safe token deduction error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

const router = Router();

// 토큰 가격표 조회
router.get('/pricing', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      packages: TOKEN_PACKAGES,
      freeTokens: {
        signupBonus: 100,
        description: '신규 가입시 무료 제공'
      }
    });
  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({ error: 'Failed to get pricing information' });
  }
});

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

// 토큰 잔액 조회
router.get('/balance', authMiddleware, async (req: Request, res: Response) => {
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
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
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

// 토큰 구매 처리
router.post('/purchase', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { packageId, paymentKey, orderId } = req.body;

    // 패키지 정보 확인
    const selectedPackage = TOKEN_PACKAGES.find(pkg => pkg.id === packageId);
    if (!selectedPackage) {
      return res.status(400).json({ error: 'Invalid package ID' });
    }

    // 결제 검증 로직 추가 가능 (토스페이먼츠 결제 확인)

    const amount = selectedPackage.tokens;
    const description = `토큰 구매 - ${selectedPackage.name} 패키지`;

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
      p_type: 'purchase',
      p_description: description,
      p_reference_id: paymentKey
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
      totalUsed: updatedTokens.total_used,
      package: selectedPackage,
      paymentKey,
      orderId
    });

  } catch (error) {
    console.error('Add tokens error:', error);
    res.status(500).json({ error: 'Failed to add tokens' });
  }
});

// 결제 승인 (TossPayments 콜백 처리)
router.post('/confirm-payment', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { paymentKey, orderId, amount } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({ error: 'Missing payment information' });
    }

    // TODO: 실제 TossPayments API로 결제 검증
    // const tossResponse = await verifyPaymentWithToss(paymentKey, orderId, amount);

    // 임시로 성공으로 처리 (실제로는 TossPayments 검증 결과에 따라)
    const isPaymentValid = true;

    if (!isPaymentValid) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    // 결제 금액에 따른 토큰 계산 (1000원 = 100토큰)
    const tokensToAdd = Math.floor(amount / 10);
    const description = `결제 승인 - ${tokensToAdd}토큰 충전`;

    // Supabase 함수 호출로 토큰 추가 처리
    const { data, error } = await supabase.rpc('add_tokens', {
      p_user_id: userId,
      p_amount: tokensToAdd,
      p_type: 'purchase',
      p_description: description,
      p_reference_id: paymentKey
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
      message: '결제가 성공적으로 처리되었습니다',
      addedTokens: tokensToAdd,
      newBalance: updatedTokens.balance,
      paymentKey,
      orderId,
      amount
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

// 토큰 패키지 목록 조회 (인증 불필요)
router.get('/packages', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      packages: TOKEN_PACKAGES
    });
  } catch (error) {
    console.error('Get packages error:', error);
    res.status(500).json({ error: 'Failed to get token packages' });
  }
});

// 테스트용 엔드포인트 (인증 없이 잔액 조회)
router.get('/test-balance', async (req: Request, res: Response) => {
  try {
    // 테스트 사용자 ID (실제로는 인증에서 가져옴)
    const testUserId = '00000000-0000-0000-0000-000000000001';

    // 테스트 사용자가 없으면 생성
    const { data: existingUser, error: selectError } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', testUserId)
      .single();

    if (selectError && selectError.code === 'PGRST116') {
      // 사용자가 없으면 생성
      const { data: newUser, error: insertError } = await supabase
        .from('user_tokens')
        .insert({
          user_id: testUserId,
          balance: 100 // 초기 잔액 100 토큰
        })
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create test user:', insertError);
        return res.status(500).json({ error: 'Failed to create test user' });
      }

      return res.json({
        success: true,
        balance: newUser.balance,
        message: 'Test user created with 100 tokens'
      });
    }

    if (selectError) {
      console.error('Database error:', selectError);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      success: true,
      balance: existingUser.balance,
      message: 'Test balance retrieved'
    });

  } catch (error) {
    console.error('Test balance error:', error);
    res.status(500).json({ error: 'Failed to get test balance' });
  }
});

// safeTokenDeduction 함수를 다른 서비스에서 사용할 수 있도록 export
export { safeTokenDeduction };

export default router;