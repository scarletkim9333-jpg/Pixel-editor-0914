import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 개발 환경을 위한 안전한 기본값
const DUMMY_URL = 'https://placeholder.supabase.co'
const DUMMY_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjM1NTIwMH0.J4Fzy5-ZKnOj2P5P9aAf34RqbcY9A3v5PKdF6jMtFqM'

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing Supabase environment variables - using dummy client for development')
}

// 환경 변수가 없어도 앱이 크래시되지 않도록 처리
export const supabase = createClient(
  supabaseUrl || DUMMY_URL,
  supabaseAnonKey || DUMMY_KEY
)

// 환경 변수 상태 확인용 함수
export const hasSupabaseConfig = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey)
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_tokens: {
        Row: {
          id: string
          user_id: string
          balance: number
          total_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          total_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          total_used?: number
          created_at?: string
          updated_at?: string
        }
      }
      token_transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'purchase' | 'usage' | 'refund' | 'bonus'
          description: string | null
          reference_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'purchase' | 'usage' | 'refund' | 'bonus'
          description?: string | null
          reference_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'purchase' | 'usage' | 'refund' | 'bonus'
          description?: string | null
          reference_id?: string | null
          created_at?: string
        }
      }
      generation_history: {
        Row: {
          id: string
          user_id: string
          prompt: string
          model: string
          images: any | null
          tokens_used: number
          settings: any | null
          status: 'pending' | 'processing' | 'completed' | 'failed'
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt: string
          model: string
          images?: any | null
          tokens_used?: number
          settings?: any | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt?: string
          model?: string
          images?: any | null
          tokens_used?: number
          settings?: any | null
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          error_message?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          payment_key: string | null
          order_id: string
          order_name: string
          amount: number
          status: 'pending' | 'confirmed' | 'cancelled' | 'failed'
          payment_method: string | null
          toss_data: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          payment_key?: string | null
          order_id: string
          order_name: string
          amount: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'failed'
          payment_method?: string | null
          toss_data?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          payment_key?: string | null
          order_id?: string
          order_name?: string
          amount?: number
          status?: 'pending' | 'confirmed' | 'cancelled' | 'failed'
          payment_method?: string | null
          toss_data?: any | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Functions: {
      use_tokens: {
        Args: {
          p_user_id: string
          p_amount: number
        }
        Returns: boolean
      }
      add_tokens: {
        Args: {
          p_user_id: string
          p_amount: number
          p_type: string
          p_description?: string
          p_reference_id?: string
        }
        Returns: boolean
      }
    }
  }
}