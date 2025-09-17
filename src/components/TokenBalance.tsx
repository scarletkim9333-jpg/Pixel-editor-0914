import React, { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useTokens } from '../lib/tokenApi'
import { TokenPurchaseModal } from './TokenPurchaseModal'
import { PixelCoinIcon } from '../../components/Icons'

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

  // balance 변화 감지 (디버깅용 로그 제거)
  useEffect(() => {
    // console.log('TokenBalance balance changed:', balance);
  }, [balance]);

  // 사용자 로그인 시 토큰 정보 가져오기
  useEffect(() => {
    console.log('TokenBalance useEffect:', { user: !!user, authLoading, loading });
    if (user && !authLoading) {
      console.log('Calling refreshBalance...');
      refreshBalance().catch((err) => {
        console.error('픽셀 코인 잔액 조회 실패:', err);
      });
    }
  }, [user, authLoading, refreshBalance])

  // 로그인하지 않은 경우
  if (!user) {
    return null
  }

  // 로딩 중
  if (loading || authLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
        <span className="text-gray-600">코인 정보 로딩 중...</span>
      </div>
    )
  }

  // 에러 발생
  if (error) {
    return (
      <div className={`text-red-600 ${className}`}>
        <span>⚠️ {error}</span>
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

      {/* 코인 구매 버튼 (심플한 + 버튼) */}
      <button
        onClick={() => setIsPurchaseModalOpen(true)}
        className="flex items-center justify-center w-8 h-8 bg-yellow-400 hover:bg-yellow-500 rounded-full border-2 border-black transition-colors font-bold text-black text-lg font-neodgm"
        title="픽셀 코인 충전"
      >
        +
      </button>

      {/* 코인 구매 모달 */}
      <TokenPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        currentBalance={displayBalance} // 현재 표시 중인 balance 전달
        onPurchaseSuccess={(newBalance) => {
          console.log('TokenBalance received new balance:', newBalance);
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