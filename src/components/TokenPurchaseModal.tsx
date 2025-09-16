import React, { useState, useEffect } from 'react';
import { useTokens } from '../lib/tokenApi';

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
  onPurchaseSuccess?: () => void;
}

export const TokenPurchaseModal: React.FC<TokenPurchaseModalProps> = ({
  isOpen,
  onClose,
  requiredTokens = 0,
  onPurchaseSuccess,
}) => {
  const { getPackages, purchaseTokens, loading } = useTokens();
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPackages();
    }
  }, [isOpen]);

  const loadPackages = async () => {
    try {
      const packageList = await getPackages();
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

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    setIsProcessing(true);
    try {
      // 실제 결제 시스템 연동이 필요합니다 (TossPayments 등)
      // 현재는 테스트용으로 바로 성공 처리

      // TODO: 실제 결제 처리 로직
      // const paymentData = {
      //   orderId: `order_${Date.now()}`,
      //   amount: selectedPackage.price,
      //   // ... 기타 결제 정보
      // };

      const mockPaymentData = {
        orderId: `test_order_${Date.now()}`,
        paymentKey: `test_payment_${Date.now()}`,
        status: 'success'
      };

      await purchaseTokens(selectedPackage, mockPaymentData);

      // 구매 성공 시 콜백 호출
      if (onPurchaseSuccess) {
        onPurchaseSuccess();
      }

      onClose();
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('토큰 구매에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#FDF6E3] border-2 border-black shadow-[8px_8px_0_0_#000] max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-black">🪙 토큰 구매</h2>
            <button
              onClick={onClose}
              className="text-2xl font-bold text-black hover:text-gray-600 transition-colors"
              aria-label="닫기"
            >
              ×
            </button>
          </div>

          {requiredTokens > 0 && (
            <div className="mb-6 p-4 bg-orange-100 border-2 border-orange-300">
              <p className="text-orange-800 font-semibold">
                ⚠️ {requiredTokens}토큰이 필요합니다
              </p>
              <p className="text-orange-700 text-sm mt-1">
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
                  <div className="absolute -top-2 left-4 bg-green-500 text-white px-2 py-1 text-xs font-bold">
                    인기
                  </div>
                )}
                {pkg.discount && (
                  <div className="absolute -top-2 right-4 bg-red-500 text-white px-2 py-1 text-xs font-bold">
                    -{pkg.discount}%
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{pkg.name}</h3>
                    <p className="text-gray-600">
                      {pkg.tokens.toLocaleString()}토큰
                    </p>
                    <p className="text-sm text-gray-500">
                      토큰당 {pkg.pricePerToken.toFixed(1)}원
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-black">
                      ₩{pkg.price.toLocaleString()}
                    </div>
                    {pkg.discount && (
                      <div className="text-xs text-gray-500 line-through">
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
              className="flex-1 py-2 px-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={isProcessing}
            >
              취소
            </button>
            <button
              onClick={handlePurchase}
              disabled={!selectedPackage || isProcessing || loading}
              className="flex-1 py-2 px-4 bg-blue-500 text-white border-2 border-blue-600 hover:bg-blue-600 disabled:bg-gray-300 disabled:border-gray-400 disabled:text-gray-500 transition-colors"
            >
              {isProcessing ? (
                <>
                  <span className="inline-block animate-spin mr-2">⏳</span>
                  구매 중...
                </>
              ) : (
                '구매하기'
              )}
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-600 text-center">
            <p>🔒 안전한 결제가 보장됩니다</p>
            <p>토큰은 구매 즉시 계정에 추가됩니다</p>
          </div>
        </div>
      </div>
    </div>
  );
};