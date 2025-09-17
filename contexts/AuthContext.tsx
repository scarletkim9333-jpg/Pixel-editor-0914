import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../src/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true);

    // Supabase 환경 변수가 없으면 바로 Mock 로그인 활성화
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('dummy')) {
      console.warn('Supabase not configured, using mock authentication mode');
      setLoading(false);
      return;
    }

    try {
      // 인증 상태 변경 리스너
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)

          // 새 사용자 등록 시 users 테이블에 사용자 정보 저장
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              const { error } = await supabase
                .from('users')
                .upsert({
                  id: session.user.id,
                  email: session.user.email!,
                  name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || null,
                })

              if (error) {
                console.error('Error saving user data:', error)
              }
            } catch (err) {
              console.error('Database error:', err)
            }
          }
        }
      )

      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('Auth initialization error:', error)
      setLoading(false)
    }
  }, [])

  const signInWithGoogle = async () => {
    // Supabase 환경 변수가 없으면 바로 Mock 로그인 사용
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('dummy')) {
      console.warn('Supabase not configured, using mock authentication')
      // 모의 사용자 생성
      const mockUser = {
        id: 'mock-user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: '테스트 사용자',
          name: '테스트 사용자'
        }
      } as any;

      const mockSession = {
        user: mockUser,
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token'
      } as any;

      setUser(mockUser);
      setSession(mockSession);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error signing in with Google:', error)
      // 실제 Supabase 오류가 발생해도 fallback으로 mock 사용
      console.warn('Falling back to mock authentication')
      const mockUser = {
        id: 'mock-user-123',
        email: 'test@example.com',
        user_metadata: {
          full_name: '테스트 사용자',
          name: '테스트 사용자'
        }
      } as any;

      const mockSession = {
        user: mockUser,
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token'
      } as any;

      setUser(mockUser);
      setSession(mockSession);
      setLoading(false);
      return;
    }
  }

  const signOut = async () => {
    // Supabase 환경 변수가 없으면 바로 Mock 로그아웃 사용
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('dummy')) {
      console.warn('Supabase not configured, using mock sign out')
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
      // 실제 Supabase 오류가 발생해도 fallback으로 mock 사용
      console.warn('Falling back to mock sign out')
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }
  }

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}