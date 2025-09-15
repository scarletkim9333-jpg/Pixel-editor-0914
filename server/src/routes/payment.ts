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

export default router;