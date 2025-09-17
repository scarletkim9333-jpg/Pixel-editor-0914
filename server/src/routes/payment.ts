import { Router, Request, Response } from 'express';
import { tossPaymentsService } from '../services/toss';
import { authMiddleware } from '../middleware/auth';
import { rateLimitMiddleware } from '../middleware/rateLimit';

const router = Router();

router.post('/create-payment', authMiddleware, rateLimitMiddleware, async (req: Request, res: Response) => {
  try {
    const { amount, orderId, orderName, customerName, customerEmail } = req.body;

    if (!amount || !orderId || !orderName) {
      return res.status(400).json({ error: 'Required payment fields are missing' });
    }

    const paymentData = await tossPaymentsService.createPayment({
      amount,
      orderId,
      orderName,
      customerName,
      customerEmail
    });

    res.json(paymentData);
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

router.post('/confirm-payment', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { paymentKey, orderId, amount } = req.body;

    if (!paymentKey || !orderId || !amount) {
      return res.status(400).json({ error: 'Payment confirmation data is incomplete' });
    }

    const confirmationResult = await tossPaymentsService.confirmPayment({
      paymentKey,
      orderId,
      amount
    });

    res.json(confirmationResult);
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

router.get('/payment/:paymentKey', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { paymentKey } = req.params;

    if (!paymentKey) {
      return res.status(400).json({ error: 'Payment key is required' });
    }

    const payment = await tossPaymentsService.getPayment(paymentKey);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Failed to get payment details' });
  }
});

router.post('/cancel-payment', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { paymentKey, cancelReason } = req.body;

    if (!paymentKey || !cancelReason) {
      return res.status(400).json({ error: 'Payment key and cancel reason are required' });
    }

    const cancelResult = await tossPaymentsService.cancelPayment(paymentKey, cancelReason);

    res.json(cancelResult);
  } catch (error) {
    console.error('Cancel payment error:', error);
    res.status(500).json({ error: 'Failed to cancel payment' });
  }
});

router.get('/orders/:orderId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = await tossPaymentsService.getOrderByOrderId(orderId);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to get order details' });
  }
});

// 토스페이먼츠 웹훅 처리 (인증 불필요)
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const { status, orderId, amount, paymentKey } = req.body;

    console.log('웹훅 수신:', {
      status,
      orderId,
      amount,
      paymentKey,
      timestamp: new Date().toISOString()
    });

    // 결제 상태에 따른 처리
    if (status === 'DONE') {
      // 결제 완료 시 토큰 충전 로직
      console.log(`결제 완료: 주문번호 ${orderId}, 금액 ${amount}원`);

      // TODO: 실제로는 orderId로 사용자 정보를 찾아서 토큰을 충전해야 함
      // 현재는 로그만 출력
      const tokensToAdd = Math.floor(amount / 10); // 10원당 1토큰
      console.log(`토큰 충전 예정: ${tokensToAdd}토큰`);

      res.status(200).json({
        success: true,
        message: '웹훅 처리 완료',
        tokensToAdd
      });
    } else if (status === 'CANCELED') {
      console.log(`결제 취소: 주문번호 ${orderId}`);
      res.status(200).json({
        success: true,
        message: '결제 취소 웹훅 처리 완료'
      });
    } else {
      console.log(`알 수 없는 상태: ${status}`);
      res.status(200).json({
        success: true,
        message: '웹훅 수신 완료'
      });
    }

  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    res.status(500).json({ error: '웹훅 처리 실패' });
  }
});

export default router;