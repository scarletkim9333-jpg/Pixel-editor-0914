import { useState, useEffect, useCallback } from 'react';
import { tokenApi } from '../services/api';

/**
 * 토큰 관련 훅
 * 새로운 백엔드 API와 연동하여 토큰 잔액, 사용, 구매 기능을 제공합니다.
 */
export const useTokens = () => {
  const [balance, setBalance] = useState<number | null>(null);
  const [totalUsed, setTotalUsed] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 토큰 잔액 새로고침
  const refreshBalance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('About to call tokenApi.getBalance()...');
      // 임시로 하드코딩된 값 사용
      console.log('Using hardcoded token values for testing...');
      setBalance(90);
      setTotalUsed(10);
    } catch (err) {
      console.error('Token balance fetch error:', err);
      console.error('Error details:', err);
      const errorMessage = err instanceof Error ? err.message : '토큰 정보를 가져오는데 실패했습니다';
      console.error('Setting error message:', errorMessage);
      setError(errorMessage);

      // 인증 오류가 아닌 경우에만 기본값 설정
      if (!errorMessage.includes('인증') && !errorMessage.includes('401')) {
        setBalance(0);
        setTotalUsed(0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  

  // 토큰 사용
  const useTokens = async (amount: number, description?: string) => {
    setLoading(true);
    setError(null);

    try {
      // 실제로는 백엔드에서 토큰 차감이 자동으로 처리됩니다
      // 이 함수는 프론트엔드 상태 동기화용으로만 사용

      // 잔액이 부족한 경우 에러 발생
      if (balance !== null && balance < amount) {
        throw new Error(`토큰이 부족합니다. 필요: ${amount}토큰, 현재: ${balance}토큰`);
      }

      // 토큰 사용 성공 시 로컬 상태 업데이트
      if (balance !== null) {
        setBalance(balance - amount);
        setTotalUsed(prev => prev + amount);
      }

      return {
        success: true,
        usedAmount: amount,
        remainingBalance: (balance || 0) - amount,
        totalUsed: totalUsed + amount,
        description: description || 'Token usage'
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '토큰 사용에 실패했습니다';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 토큰 패키지 목록 조회
  const getPackages = async () => {
    try {
      const data = await tokenApi.getPackages();
      return data.packages || [];
    } catch (err) {
      console.error('Token packages fetch error:', err);
      throw err;
    }
  };

  // 토큰 구매
  const purchaseTokens = async (packageId: string, paymentData: any) => {
    setLoading(true);
    setError(null);

    try {
      const data = await tokenApi.purchase(packageId, paymentData);

      // 구매 성공 시 잔액 새로고침
      await refreshBalance();

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '토큰 구매에 실패했습니다';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 토큰 사용 내역 조회
  const getTokenHistory = async () => {
    try {
      const data = await tokenApi.getHistory();
      return data.transactions || [];
    } catch (err) {
      console.error('Token history fetch error:', err);
      throw err;
    }
  };

  // 결제 승인 (TossPayments 콜백 처리)
  const confirmPayment = async (paymentData: { paymentKey: string; orderId: string; amount: number }) => {
    setLoading(true);
    setError(null);

    try {
      const data = await tokenApi.confirmPayment(paymentData);

      // 결제 승인 성공 시 잔액 새로고침
      await refreshBalance();

      return data;
    } catch (err) {
      console.error('Payment confirmation error:', err);

      let errorMessage = '결제 승인에 실패했습니다';

      if (err instanceof Error) {
        // 네트워크 에러 처리
        if (err.message.includes('Network Error') || err.message.includes('ERR_NETWORK')) {
          errorMessage = '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
        }
        // 404 에러 처리
        else if (err.message.includes('404')) {
          errorMessage = '결제 서비스가 일시적으로 이용할 수 없습니다. 잠시 후 다시 시도해주세요.';
        }
        // 401 인증 에러 처리
        else if (err.message.includes('401')) {
          errorMessage = '로그인이 만료되었습니다. 다시 로그인해주세요.';
        }
        // 기타 HTTP 에러
        else if (err.message.includes('status code')) {
          errorMessage = '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
        else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 개발 환경용 토큰 직접 추가 함수
  const addTokensLocally = (amount: number) => {
    if (balance !== null) {
      setBalance(balance + amount);
    }
  };

  return {
    balance,
    totalUsed,
    loading,
    error,
    refreshBalance,
    useTokens,
    getPackages,
    purchaseTokens,
    getTokenHistory,
    confirmPayment,
    addTokensLocally, // 개발용 함수 추가
  };
};