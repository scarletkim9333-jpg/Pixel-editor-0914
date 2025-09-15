import { createClient, SupabaseClient, AuthResponse, User } from '@supabase/supabase-js';

class SupabaseService {
  private client: SupabaseClient;
  private adminClient: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Supabase environment variables are not set.');
    }

    this.client = createClient(supabaseUrl, supabaseAnonKey);
    this.adminClient = createClient(supabaseUrl, supabaseServiceKey);
  }

  async signUp(email: string, password: string, metadata?: Record<string, any>): Promise<AuthResponse> {
    return await this.client.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    return await this.client.auth.signInWithPassword({
      email,
      password
    });
  }

  async signOut(): Promise<{ error: any }> {
    return await this.client.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.client.auth.getUser();
    return user;
  }

  async verifyToken(token: string): Promise<{ data: User | null; error: any }> {
    return await this.client.auth.getUser(token);
  }

  async refreshSession(refreshToken: string): Promise<AuthResponse> {
    return await this.client.auth.refreshSession({
      refresh_token: refreshToken
    });
  }

  async updateUser(attributes: Record<string, any>): Promise<{ data: User | null; error: any }> {
    return await this.client.auth.updateUser(attributes);
  }

  async resetPassword(email: string): Promise<{ data: {} | null; error: any }> {
    return await this.client.auth.resetPasswordForEmail(email);
  }

  // Methods using the admin client (service_role key)
  
  async saveGenerationHistory(userId: string, generationData: any): Promise<{ data: any; error: any }> {
    return await this.adminClient
      .from('generation_history')
      .insert({
        user_id: userId,
        ...generationData,
        created_at: new Date().toISOString()
      });
  }

  async getGenerationHistory(userId: string, limit: number = 20, offset: number = 0): Promise<{ data: any; error: any }> {
    return await this.adminClient
      .from('generation_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
  }

  async deleteGeneration(generationId: string, userId: string): Promise<{ data: any; error: any }> {
    // Note: Using admin client bypasses RLS. The userId check is still good practice.
    return await this.adminClient
      .from('generation_history')
      .delete()
      .eq('id', generationId)
      .eq('user_id', userId);
  }

  async savePaymentRecord(userId: string, paymentData: any): Promise<{ data: any; error: any }> {
    return await this.adminClient
      .from('payments')
      .insert({
        user_id: userId,
        ...paymentData,
        created_at: new Date().toISOString()
      });
  }

  async updatePaymentStatus(paymentId: string, status: string, details?: any): Promise<{ data: any; error: any }> {
    return await this.adminClient
      .from('payments')
      .update({
        status,
        ...details,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);
  }

  // Client getters
  
  getClient(): SupabaseClient {
    return this.client; // Returns the anon client
  }

  getAdminClient(): SupabaseClient {
    return this.adminClient; // Returns the service_role client
  }
}

export const supabaseService = new SupabaseService();
