-- Supabase 테이블 생성 및 RLS 정책 설정

-- 1. users 테이블 생성
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. user_tokens 테이블 생성 (사용자 토큰 잔액 관리)
CREATE TABLE IF NOT EXISTS public.user_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0 CHECK (balance >= 0),
    total_used INTEGER DEFAULT 0 CHECK (total_used >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. token_transactions 테이블 생성 (토큰 거래 내역)
CREATE TABLE IF NOT EXISTS public.token_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
    description TEXT,
    reference_id VARCHAR(255), -- 결제 ID 또는 생성 ID 참조
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. generation_history 테이블 생성 (이미지 생성 히스토리)
CREATE TABLE IF NOT EXISTS public.generation_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    model VARCHAR(100) NOT NULL,
    images JSONB, -- 생성된 이미지 URL 및 메타데이터
    tokens_used INTEGER DEFAULT 0,
    settings JSONB, -- 생성 설정 (creativity, preset, etc.)
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. payments 테이블 생성 (결제 내역)
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    payment_key VARCHAR(255) UNIQUE,
    order_id VARCHAR(255) NOT NULL,
    order_name VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'failed')),
    payment_method VARCHAR(100),
    toss_data JSONB, -- TossPayments 응답 데이터
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON public.user_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON public.token_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_generation_history_user_id ON public.generation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_history_created_at ON public.generation_history(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_key ON public.payments(payment_key);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성

-- users 테이블 정책
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- user_tokens 테이블 정책
CREATE POLICY "Users can view own tokens" ON public.user_tokens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens" ON public.user_tokens
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service can insert user tokens" ON public.user_tokens
    FOR INSERT WITH CHECK (true);

-- token_transactions 테이블 정책
CREATE POLICY "Users can view own transactions" ON public.token_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert transactions" ON public.token_transactions
    FOR INSERT WITH CHECK (true);

-- generation_history 테이블 정책
CREATE POLICY "Users can view own generation history" ON public.generation_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own generations" ON public.generation_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own generations" ON public.generation_history
    FOR DELETE USING (auth.uid() = user_id);

-- payments 테이블 정책
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service can insert payments" ON public.payments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service can update payments" ON public.payments
    FOR UPDATE WITH CHECK (true);

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 생성
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tokens_updated_at
    BEFORE UPDATE ON public.user_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 트리거 함수: 사용자 가입 시 토큰 잔액 초기화
CREATE OR REPLACE FUNCTION initialize_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_tokens (user_id, balance, total_used)
    VALUES (NEW.id, 100, 0); -- 신규 사용자에게 100 토큰 제공
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 사용자 생성 시 토큰 초기화 트리거
CREATE TRIGGER initialize_user_tokens_trigger
    AFTER INSERT ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_user_tokens();

-- 토큰 사용 함수 (원자적 작업 보장)
CREATE OR REPLACE FUNCTION use_tokens(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- 현재 잔액 확인 및 업데이트 (락 걸기)
    SELECT balance INTO current_balance
    FROM public.user_tokens
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- 잔액 부족 체크
    IF current_balance < p_amount THEN
        RETURN FALSE;
    END IF;

    -- 토큰 차감
    UPDATE public.user_tokens
    SET balance = balance - p_amount,
        total_used = total_used + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- 거래 내역 기록
    INSERT INTO public.token_transactions (user_id, amount, type, description)
    VALUES (p_user_id, -p_amount, 'usage', 'Image generation');

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 토큰 충전 함수
CREATE OR REPLACE FUNCTION add_tokens(p_user_id UUID, p_amount INTEGER, p_type VARCHAR(50), p_description TEXT DEFAULT NULL, p_reference_id VARCHAR(255) DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    -- 토큰 추가
    UPDATE public.user_tokens
    SET balance = balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- 거래 내역 기록
    INSERT INTO public.token_transactions (user_id, amount, type, description, reference_id)
    VALUES (p_user_id, p_amount, p_type, p_description, p_reference_id);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;