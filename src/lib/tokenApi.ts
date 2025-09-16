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
      const data = await tokenApi.getBalance();
      setBalance(data.balance || 0);
      setTotalUsed(data.totalUsed || 0);
    } catch (err) {
      console.error('Token balance fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : '토큰 정보를 가져오는데 실패했습니다';
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
  };
};