import React, { useEffect, useState } from 'react';
import { useTokens } from '../lib/tokenApi';

interface PaymentCallbackProps {
  type: 'success' | 'fail';
  onClose: () => void;
}

export const PaymentCallback: React.FC<PaymentCallbackProps> = ({ type, onClose }) => {
  const { confirmPayment } = useTokens();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (type === 'success') {
      handlePaymentSuccess();
    } else {
      setMessage('결제가 취소되었거나 실패했습니다.');
    }
  }, [type]);

  const handlePaymentSuccess = async () => {
    setIsProcessing(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentKey = urlParams.get('paymentKey');
      const orderId = urlParams.get('orderId');
      const amount = urlParams.get('amount');

      if (!paymentKey || !orderId || !amount) {
        throw new Error('결제 정보가 없습니다.');
      }

      // 결제 승인 처리
      await confirmPayment({
        paymentKey,
        orderId,
        amount: parseInt(amount)
      });

      setMessage('결제가 성공적으로 완료되었습니다! 토큰이 충전되었습니다.');
    } catch (error) {
      console.error('Payment confirmation failed:', error);

      // 구체적인 에러 메시지 처리
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          setMessage('결제 서비스가 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해주세요.');
        } else if (error.message.includes('401') || error.message.includes('인증')) {
          setMessage('로그인이 필요합니다. 다시 로그인 후 시도해주세요.');
        } else if (error.message.includes('Network') || error.message.includes('네트워크')) {
          setMessage('네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.');
        } else {
          setMessage('결제 승인 처리 중 오류가 발생했습니다. 고객센터로 문의해주세요.');
        }
      } else {
        setMessage('결제 승인 처리 중 알 수 없는 오류가 발생했습니다.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#FDF6E3] border-2 border-black shadow-[8px_8px_0_0_#000] max-w-md w-full mx-4">
        <div className="p-6">
          <div className="text-center">
            {type === 'success' ? (
              <div className="text-4xl mb-4">✅</div>
            ) : (
              <div className="text-4xl mb-4">❌</div>
            )}

            <h2 className="text-xl font-bold mb-4">
              {type === 'success' ? '결제 처리 중' : '결제 실패'}
            </h2>

            {isProcessing ? (
              <div className="mb-4">
                <div className="inline-block animate-spin mr-2">⏳</div>
                결제를 승인하고 있습니다...
              </div>
            ) : (
              <p className="mb-6 text-gray-700">{message}</p>
            )}

            <button
              onClick={onClose}
              disabled={isProcessing}
              className="w-full py-2 px-4 bg-blue-500 text-white border-2 border-blue-600 hover:bg-blue-600 disabled:bg-gray-300 disabled:border-gray-400 disabled:text-gray-500 transition-colors"
            >
              {isProcessing ? '처리 중...' : '확인'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};