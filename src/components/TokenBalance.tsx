import React, { useEffect, useState, useRef } from 'react'
import { CurrencyDollarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { useTokens } from '../lib/tokenApi'
import { TokenPurchaseModal } from './TokenPurchaseModal'

interface TokenBalanceProps {
  showUsage?: boolean
  className?: string
}

// 숫자 카운팅 애니메이션을 위한 커스텀 훅
const useCountUp = (end: number, duration: number = 1000) => {
  const [count, setCount] = useState(0);
  const frameRate = 1000 / 60;
  const totalFrames = Math.round(duration / frameRate);
  const prevBalanceRef = useRef<number | null>(null);

  useEffect(() => {
    // 최초 로드 시에는 애니메이션 없이 즉시 값 설정
    if (prevBalanceRef.current === null) {
      setCount(end);
      prevBalanceRef.current = end;
      return;
    }

    // 잔액이 변경되었을 때만 애니메이션 실행
    if (prevBalanceRef.current !== end) {
      const start = prevBalanceRef.current;
      let frame = 0;

      const counter = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const currentCount = Math.round(start + (end - start) * progress);
        setCount(currentCount);

        if (frame === totalFrames) {
          clearInterval(counter);
          setCount(end); // 정확한 최종값 설정
        }
      }, frameRate);

      prevBalanceRef.current = end;

      return () => clearInterval(counter);
    }
  }, [end, duration, totalFrames]);

  return count;
};

export const TokenBalance: React.FC<TokenBalanceProps> = ({
  showUsage = false,
  className = ''
}) => {
  const { user, loading: authLoading } = useAuth()
  const {
    balance,
    totalUsed,
    loading,
    error,
    refreshBalance
  } = useTokens()
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false)
  const [forceBalance, setForceBalance] = useState<number | null>(null)

  // forceBalance가 설정되면 그것을 사용, 아니면 balance 사용
  const displayBalance = forceBalance !== null ? forceBalance : (balance ?? 0)
  const animatedBalance = useCountUp(displayBalance)

  // balance 변화 감지 및 UI 업데이트
  useEffect(() => {
    // balance가 변경되면 forceBalance를 리셋하여 실제 balance 사용
    if (balance !== null && forceBalance !== null) {
      setForceBalance(null);
    }
  }, [balance]);

  // 사용자 로그인 시 토큰 정보 가져오기 (refreshBalance 의존성 제거)
  useEffect(() => {
    if (user && !authLoading) {
      refreshBalance().catch((err) => {
        console.error('픽셀 토큰 잔액 조회 실패:', err);
      });
    }
  }, [user, authLoading])

  // 로그인하지 않은 경우
  if (!user) {
    return null
  }

  // 로딩 중
  if (loading || authLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
        <span className="text-gray-600">토큰 정보 로딩 중...</span>
      </div>
    )
  }

  // 에러 발생
  if (error) {
    return (
      <div className={`text-red-600 ${className}`}>
        <span className="flex items-center space-x-1">
          <ExclamationTriangleIcon className="w-4 h-4" />
          <span>{error}</span>
        </span>
        <button
          onClick={refreshBalance}
          className="ml-2 text-blue-600 hover:underline"
        >
          다시 시도
        </button>
      </div>
    )
  }

  // 토큰 정보 표시
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* 현재 잔액 */}
      <div className="flex items-center space-x-1">
        <span className={`font-bold text-2xl font-neodgm ${balance && balance < 10 ? 'text-red-600' : 'text-black'}`}>
          {animatedBalance.toLocaleString()}
        </span>
      </div>

      {/* 토큰 구매 버튼 (Heroicon 버전) */}
      <button
        onClick={() => setIsPurchaseModalOpen(true)}
        className="flex items-center justify-center w-10 h-10 bg-transparent hover:bg-gray-100 hover:bg-opacity-20 rounded-full transition-all duration-300 transform hover:scale-110"
        title="픽셀 토큰 충전"
      >
        <CurrencyDollarIcon className="w-6 h-6 text-yellow-500 animate-token-spin" />
      </button>

      {/* 토큰 구매 모달 */}
      <TokenPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        currentBalance={displayBalance} // 현재 표시 중인 balance 전달
        onPurchaseSuccess={(newBalance) => {
          // 새 balance를 강제로 설정해서 애니메이션 트리거
          if (newBalance !== undefined) {
            setForceBalance(newBalance);
          }
          setIsPurchaseModalOpen(false);
        }}
      />
    </div>
  )
}

export default TokenBalance