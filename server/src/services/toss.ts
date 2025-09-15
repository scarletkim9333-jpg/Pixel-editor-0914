import axios, { AxiosInstance } from 'axios';

interface PaymentRequest {
  amount: number;
  orderId: string;
  orderName: string;
  customerName?: string;
  customerEmail?: string;
}

interface PaymentConfirmation {
  paymentKey: string;
  orderId: string;
  amount: number;
}

class TossPaymentsService {
  private client: AxiosInstance;
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.TOSS_SECRET_KEY;

    if (!this.secretKey || this.secretKey.includes('your_')) {
      console.warn('⚠️  TossPayments not configured - using mock mode');
      this.secretKey = 'mock_key';
      this.client = null as any;
      return;
    }

    this.client = axios.create({
      baseURL: 'https://api.tosspayments.com/v1',
      headers: {
        'Authorization': `Basic ${Buffer.from(this.secretKey + ':').toString('base64')}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createPayment(paymentData: PaymentRequest): Promise<any> {
    try {
      const response = await this.client.post('/payments', {
        amount: paymentData.amount,
        orderId: paymentData.orderId,
        orderName: paymentData.orderName,
        customerName: paymentData.customerName,
        customerEmail: paymentData.customerEmail,
        successUrl: process.env.PAYMENT_SUCCESS_URL || 'http://localhost:3000/payment/success',
        failUrl: process.env.PAYMENT_FAIL_URL || 'http://localhost:3000/payment/fail'
      });

      return response.data;
    } catch (error: any) {
      console.error('TossPayments create payment error:', error.response?.data || error.message);
      throw new Error('Failed to create payment');
    }
  }

  async confirmPayment(confirmData: PaymentConfirmation): Promise<any> {
    try {
      const response = await this.client.post('/payments/confirm', {
        paymentKey: confirmData.paymentKey,
        orderId: confirmData.orderId,
        amount: confirmData.amount
      });

      return response.data;
    } catch (error: any) {
      console.error('TossPayments confirm payment error:', error.response?.data || error.message);
      throw new Error('Failed to confirm payment');
    }
  }

  async getPayment(paymentKey: string): Promise<any> {
    try {
      const response = await this.client.get(`/payments/${paymentKey}`);
      return response.data;
    } catch (error: any) {
      console.error('TossPayments get payment error:', error.response?.data || error.message);
      throw new Error('Failed to get payment details');
    }
  }

  async cancelPayment(paymentKey: string, cancelReason: string): Promise<any> {
    try {
      const response = await this.client.post(`/payments/${paymentKey}/cancel`, {
        cancelReason
      });

      return response.data;
    } catch (error: any) {
      console.error('TossPayments cancel payment error:', error.response?.data || error.message);
      throw new Error('Failed to cancel payment');
    }
  }

  async getOrderByOrderId(orderId: string): Promise<any> {
    try {
      const response = await this.client.get(`/payments/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      console.error('TossPayments get order error:', error.response?.data || error.message);
      throw new Error('Failed to get order details');
    }
  }

  async refundPayment(paymentKey: string, refundData: { cancelAmount?: number; refundReceiveAccount?: any; cancelReason: string }): Promise<any> {
    try {
      const response = await this.client.post(`/payments/${paymentKey}/cancel`, refundData);
      return response.data;
    } catch (error: any) {
      console.error('TossPayments refund payment error:', error.response?.data || error.message);
      throw new Error('Failed to refund payment');
    }
  }

  async getPaymentMethods(): Promise<any> {
    try {
      const response = await this.client.get('/payment-methods');
      return response.data;
    } catch (error: any) {
      console.error('TossPayments get payment methods error:', error.response?.data || error.message);
      throw new Error('Failed to get payment methods');
    }
  }
}

export const tossPaymentsService = new TossPaymentsService();