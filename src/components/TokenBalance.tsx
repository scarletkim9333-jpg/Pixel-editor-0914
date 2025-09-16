import React, { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTokens } from '../lib/tokenApi'

interface TokenBalanceProps {
  showUsage?: boolean
  className?: string
}

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
    refreshBalance,
    initializeTokens
  } = useTokens()

  // 사용자 로그인 시 토큰 정보 가져오기
  useEffect(() => {
    if (user && !authLoading) {
      refreshBalance().catch(async (err) => {
        // 토큰 정보가 없으면 초기화 시도
        if (err.message.includes('토큰 정보를 찾을 수 없습니다')) {
          try {
            await initializeTokens()
          } catch (initError) {
            console.error('토큰 초기화 실패:', initError)
          }
        }
      })
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
        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="text-gray-600">토큰 정보 로딩 중...</span>
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
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* 현재 잔액 */}
      <div className="flex items-center space-x-2">
        <span className="text-2xl">🪙</span>
        <div>
          <span className="text-sm text-gray-600">토큰 잔액</span>
          <div className="font-bold text-lg">
            <span className={balance && balance < 10 ? 'text-red-600' : 'text-green-600'}>
              {balance?.toLocaleString() ?? 0}
            </span>
            <span className="text-gray-500 text-sm ml-1">토큰</span>
          </div>
        </div>
      </div>

      {/* 총 사용량 (옵션) */}
      {showUsage && (
        <div className="flex items-center space-x-2 border-l pl-4">
          <span className="text-lg">📊</span>
          <div>
            <span className="text-sm text-gray-600">총 사용량</span>
            <div className="font-medium text-gray-700">
              {totalUsed.toLocaleString()} 토큰
            </div>
          </div>
        </div>
      )}

      {/* 새로고침 버튼 */}
      <button
        onClick={refreshBalance}
        disabled={loading}
        className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
        title="토큰 정보 새로고침"
      >
        <svg
          className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>

      {/* 잔액 부족 경고 */}
      {balance !== null && balance < 10 && (
        <div className="text-red-600 text-sm">
          ⚠️ 토큰이 부족합니다
        </div>
      )}
    </div>
  )
}

export default TokenBalance