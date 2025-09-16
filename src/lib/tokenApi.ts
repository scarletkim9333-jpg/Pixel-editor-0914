import { useState } from 'react'
import { supabase } from './supabase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// JWT 토큰 가져오기 함수
const getAuthToken = async (): Promise<string | null> => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token || null
}

// API 요청 헬퍼 함수
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken()

  if (!token) {
    throw new Error('인증 토큰이 없습니다. 로그인이 필요합니다.')
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `API 요청 실패: ${response.status}`)
  }

  return response.json()
}

// 토큰 API 서비스
export const tokenApi = {
  // 토큰 초기화 (신규 사용자)
  initialize: async (): Promise<{
    success: boolean
    message: string
    balance: number
  }> => {
    return apiRequest('/tokens/initialize', {
      method: 'POST',
    })
  },

  // 현재 토큰 잔액 조회
  getBalance: async (): Promise<{
    success: boolean
    balance: number
    totalUsed: number
  }> => {
    return apiRequest('/user/tokens', {
      method: 'GET',
    })
  },

  // 토큰 사용 (차감)
  useTokens: async (usedAmount: number, description?: string): Promise<{
    success: boolean
    usedAmount: number
    remainingBalance: number
    totalUsed: number
    description: string
  }> => {
    return apiRequest('/user/tokens', {
      method: 'POST',
      body: JSON.stringify({ usedAmount, description }),
    })
  },

  // 토큰 사용 내역 조회
  getHistory: async (): Promise<{
    success: boolean
    transactions: Array<{
      id: string
      user_id: string
      tokens_used: number
      description: string
      created_at: string
    }>
  }> => {
    return apiRequest('/user/tokens/history', {
      method: 'GET',
    })
  },
}

// 토큰 관련 훅
export const useTokens = () => {
  const [balance, setBalance] = useState<number | null>(null)
  const [totalUsed, setTotalUsed] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // 토큰 잔액 새로고침
  const refreshBalance = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await tokenApi.getBalance()
      setBalance(data.balance)
      setTotalUsed(data.totalUsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : '토큰 정보를 가져오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 토큰 사용
  const useTokens = async (amount: number, description?: string) => {
    setLoading(true)
    setError(null)

    try {
      const data = await tokenApi.useTokens(amount, description)
      setBalance(data.remainingBalance)
      setTotalUsed(data.totalUsed)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '토큰 사용에 실패했습니다'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 토큰 초기화 (신규 사용자)
  const initializeTokens = async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await tokenApi.initialize()
      setBalance(data.balance)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '토큰 초기화에 실패했습니다'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    balance,
    totalUsed,
    loading,
    error,
    refreshBalance,
    useTokens,
    initializeTokens,
  }
}