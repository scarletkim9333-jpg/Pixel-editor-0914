import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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