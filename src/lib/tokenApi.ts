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

  // 토큰 잔액 새로고침 (완전 더미 모드)
  const refreshBalance = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 더미 지연 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 500));

      // 로컬스토리지에서 토큰 잔액 확인
      const savedBalance = localStorage.getItem('mock-token-balance');
      const savedUsed = localStorage.getItem('mock-token-used');

      if (savedBalance !== null) {
        const newBalance = parseInt(savedBalance);
        const newTotalUsed = parseInt(savedUsed || '0');
        setBalance(newBalance);
        setTotalUsed(newTotalUsed);

        // 커스텀 이벤트 발생
        const event = new CustomEvent('tokenBalanceChanged', {
          detail: { balance: newBalance, totalUsed: newTotalUsed }
        });
        window.dispatchEvent(event);
      } else {
        // 처음 실행 시 기본값 설정
        console.log('초기 토큰 설정: 100 tokens');
        setBalance(100);
        setTotalUsed(0);
        localStorage.setItem('mock-token-balance', '100');
        localStorage.setItem('mock-token-used', '0');

        // 초기값도 이벤트 발생
        const event = new CustomEvent('tokenBalanceChanged', {
          detail: { balance: 100, totalUsed: 0 }
        });
        window.dispatchEvent(event);
      }
    } catch (err) {
      console.error('토큰 로드 실패:', err);
      setBalance(100);
      setTotalUsed(0);
    } finally {
      setLoading(false);
    }
  }, []);

  

  // 토큰 사용 (완전 더미 모드)
  const useTokens = async (amount: number, description?: string) => {
    setLoading(true);
    setError(null);

    try {
      // 잔액이 부족한 경우 에러 발생
      if (balance !== null && balance < amount) {
        throw new Error(`토큰이 부족합니다. 필요: ${amount}토큰, 현재: ${balance}토큰`);
      }

      console.log(`토큰 사용 - ${amount}토큰, 설명: ${description}`);

      // 더미 지연 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 300));

      // 로컬에서 토큰 차감
      const newBalance = (balance || 0) - amount;
      const newTotalUsed = totalUsed + amount;

      setBalance(newBalance);
      setTotalUsed(newTotalUsed);

      // 로컬스토리지에 저장
      localStorage.setItem('mock-token-balance', newBalance.toString());
      localStorage.setItem('mock-token-used', newTotalUsed.toString());

      // 커스텀 이벤트 발생 (같은 탭 내 다른 컴포넌트에 알림)
      const event = new CustomEvent('tokenBalanceChanged', {
        detail: { balance: newBalance, totalUsed: newTotalUsed }
      });
      window.dispatchEvent(event);

      console.log(`토큰 차감 완료 - 남은 토큰: ${newBalance}`);

      return {
        success: true,
        usedAmount: amount,
        remainingBalance: newBalance,
        totalUsed: newTotalUsed,
        description: description || 'Token usage (mock)'
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '토큰 사용에 실패했습니다';
      console.error('토큰 사용 실패:', errorMessage);
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

  // localStorage 변경 감지를 위한 useEffect 추가
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mock-token-balance' && e.newValue !== null) {
        setBalance(parseInt(e.newValue));
      }
      if (e.key === 'mock-token-used' && e.newValue !== null) {
        setTotalUsed(parseInt(e.newValue));
      }
    };

    // storage 이벤트 리스너 등록
    window.addEventListener('storage', handleStorageChange);

    // 커스텀 이벤트 리스너도 추가 (같은 탭 내에서의 변경 감지)
    const handleCustomTokenChange = ((e: CustomEvent) => {
      if (e.detail.balance !== undefined) {
        setBalance(e.detail.balance);
      }
      if (e.detail.totalUsed !== undefined) {
        setTotalUsed(e.detail.totalUsed);
      }
    }) as EventListener;

    window.addEventListener('tokenBalanceChanged', handleCustomTokenChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tokenBalanceChanged', handleCustomTokenChange);
    };
  }, []);

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
    // balance가 null이면 0으로 시작
    const currentBalance = balance || 0;
    const newBalance = currentBalance + amount;
    setBalance(newBalance);

    // 로컬스토리지에 저장
    localStorage.setItem('mock-token-balance', newBalance.toString());

    // 커스텀 이벤트 발생 (같은 탭 내 다른 컴포넌트에 알림)
    const event = new CustomEvent('tokenBalanceChanged', {
      detail: { balance: newBalance, totalUsed }
    });
    window.dispatchEvent(event);
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