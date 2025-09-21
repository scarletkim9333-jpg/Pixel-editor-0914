import React, { useState, useEffect } from 'react';
import { XMarkIcon, CurrencyDollarIcon, ExclamationTriangleIcon, SparklesIcon, ShieldCheckIcon, CreditCardIcon, ArrowPathIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import { useTokens } from '../lib/tokenApi';
import { TOKEN_PRICING } from '../constants/pricing';

interface TokenPackage {
  id: string;
  name: string;
  tokens: number;
  price: number;
  pricePerToken: number;
  popular?: boolean;
  discount?: number;
}

interface TokenPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredTokens?: number;
  currentBalance?: number; // 현재 balance를 외부에서 전달받음
  onPurchaseSuccess?: (newBalance?: number) => void;
}

// TossPayments 클라이언트 키 (환경변수에서 가져오기)
const TOSS_CLIENT_KEY = import.meta.env.VITE_TOSS_CLIENT_KEY || 'test_ck_docs_Ovk5rk1EwkEbP0W43n07xlzm';

export const TokenPurchaseModal: React.FC<TokenPurchaseModalProps> = ({
  isOpen,
  onClose,
  requiredTokens = 0,
  currentBalance = 0,
  onPurchaseSuccess,
}) => {
  const { getPackages, purchaseTokens, addTokensLocally, loading } = useTokens();
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPackages();
    }
  }, [isOpen]);

  const loadPackages = () => {
    try {
      const packageList = TOKEN_PRICING.PACKAGES;
      setPackages(packageList);

      // 필요한 토큰 수에 따라 기본 패키지 선택
      if (requiredTokens > 0) {
        const suitablePackage = packageList.find(pkg => pkg.tokens >= requiredTokens);
        if (suitablePackage) {
          setSelectedPackage(suitablePackage.id);
        }
      }
    } catch (error) {
      console.error('Failed to load token packages:', error);
    }
  };

  const generateOrderId = () => {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    const packageInfo = packages.find(pkg => pkg.id === selectedPackage);
    if (!packageInfo) return;

    setIsProcessing(true);

    // 개발 환경에서는 시뮬레이션 모드 제공
    const isDevelopment = import.meta.env.MODE === 'development';

    if (isDevelopment) {
      // 개발 모드: 가짜 결제 성공 시뮬레이션
      const shouldSimulate = confirm(
        `개발 환경 감지!\n\n` +
        `토스페이먼츠 인증 이슈로 인해 결제 시뮬레이션을 제공합니다.\n\n` +
        `패키지: ${packageInfo.name}\n` +
        `토큰: ${packageInfo.tokens.toLocaleString()}개\n` +
        `가격: ${packageInfo.price.toLocaleString()}원\n\n` +
        `"확인"을 누르면 결제 성공을 시뮬레이션합니다.\n` +
        `(실제 돈은 빠지지 않습니다)`
      );

      if (shouldSimulate) {
        try {
          // 백엔드 API를 직접 호출하여 토큰 추가
          const orderId = generateOrderId();
          const mockPaymentData = {
            paymentKey: `mock_payment_${Date.now()}`,
            orderId: orderId,
            amount: packageInfo.price
          };

          // 개발 환경에서는 로컬 상태만 업데이트 (백엔드 호출 없이)
          // await purchaseTokens(packageInfo.id, mockPaymentData);

          // 실제로 토큰 잔액 증가
          addTokensLocally(packageInfo.tokens);

          // 업데이트된 balance 계산 (prop으로 받은 currentBalance 사용)
          const newBalance = currentBalance + packageInfo.tokens;

          alert(`✅ 결제 시뮬레이션 성공!\n${packageInfo.tokens.toLocaleString()}토큰이 충전되었습니다.`);

          // 모달 닫기 전에 구매 성공 콜백 호출 (새 balance 전달)
          onPurchaseSuccess?.(newBalance);
          onClose();

        } catch (error) {
          console.error('Mock payment failed:', error);
          alert('❌ 시뮬레이션 중 오류가 발생했습니다.');
        }
      }

      setIsProcessing(false);
      return;
    }

    try {
      // 프로덕션 환경: 실제 TossPayments 사용
      const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);

      const orderId = generateOrderId();

      // TossPayments 결제 요청
      await tossPayments.requestPayment('카드', {
        amount: packageInfo.price,
        orderId: orderId,
        orderName: `토큰 ${packageInfo.tokens.toLocaleString()}개`,
        customerName: '사용자',
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        metadata: {
          packageId: packageInfo.id,
          tokens: packageInfo.tokens.toString(),
        }
      });

      // 결제창이 열리면 처리 상태 해제 (결제 완료는 success URL에서 처리)
      setIsProcessing(false);

    } catch (error) {
      console.error('Payment initialization failed:', error);
      alert('결제를 시작할 수 없습니다. 다시 시도해주세요.');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="border-3 border-black shadow-[4px_4px_0_0_#000] max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-dark)' }}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black font-neodgm flex items-center space-x-2">
              <CurrencyDollarIcon className="w-6 h-6 text-yellow-500" />
              <span>토큰 구매</span>
            </h2>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 text-black hover:text-gray-600 transition-colors"
              aria-label="닫기"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {requiredTokens > 0 && (
            <div className="mb-6 p-4 bg-orange-100 border-2 border-orange-300">
              <p className="text-orange-800 font-semibold font-neodgm flex items-center space-x-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
                <span>{requiredTokens}토큰이 필요합니다</span>
              </p>
              <p className="text-orange-700 text-sm mt-1 font-neodgm">
                현재 작업을 완료하려면 추가 토큰이 필요합니다.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`relative p-4 border-2 cursor-pointer transition-all ${
                  selectedPackage === pkg.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                } ${pkg.popular ? 'ring-2 ring-green-400' : ''}`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                {pkg.popular && (
                  <div className="absolute -top-2 left-4 bg-green-500 text-white px-2 py-1 text-xs font-bold font-neodgm">
                    인기
                  </div>
                )}
                {pkg.discount && (
                  <div className="absolute -top-2 right-4 bg-red-500 text-white px-2 py-1 text-xs font-bold font-neodgm">
                    -{pkg.discount}%
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold font-neodgm">{pkg.name}</h3>
                    <p className="text-gray-600 font-neodgm">
                      {pkg.tokens.toLocaleString()}토큰
                    </p>
                    <p className="text-sm text-gray-500 font-neodgm">
                      토큰당 {pkg.pricePerToken.toFixed(1)}원
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-black font-neodgm">
                      ₩{pkg.price.toLocaleString()}
                    </div>
                    {pkg.discount && (
                      <div className="text-xs text-gray-500 line-through font-neodgm">
                        ₩{Math.round(pkg.price / (1 - pkg.discount / 100)).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className={`mt-2 w-2 h-2 rounded-full ${
                  selectedPackage === pkg.id ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-4 bg-gray-200 text-black border-2 border-black shadow-[3px_3px_0_0_#000] hover:bg-gray-300 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-100 ease-in-out font-neodgm"
              disabled={isProcessing}
            >
              취소
            </button>
            <button
              onClick={handlePurchase}
              disabled={!selectedPackage || isProcessing || loading}
              className="flex-1 py-2 px-4 bg-[#E57A77] text-white border-2 border-black shadow-[3px_3px_0_0_#000] hover:bg-[#d46a68] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:bg-gray-300 disabled:border-gray-400 disabled:text-gray-500 disabled:shadow-[3px_3px_0_0_#666] disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0_0_#666] transition-all duration-100 ease-in-out font-neodgm"
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                  <span>구매 중...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <CreditCardIcon className="w-4 h-4" />
                  <span>구매하기</span>
                </div>
              )}
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-600 text-center font-neodgm">
            <p className="flex items-center justify-center space-x-1">
              <LockClosedIcon className="w-4 h-4" />
              <span>안전한 결제가 보장됩니다</span>
            </p>
            <p>토큰은 구매 즉시 계정에 추가됩니다</p>
          </div>
        </div>
      </div>
    </div>
  );
};