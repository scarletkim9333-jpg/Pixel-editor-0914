-- Gallery Items 테이블 생성
-- 사용자가 저장한 이미지들을 관리합니다.

CREATE TABLE IF NOT EXISTS gallery_items (
    id text PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    name text NOT NULL,
    prompt text NOT NULL,
    model text NOT NULL,
    settings jsonb DEFAULT '{}',
    file_path text NOT NULL,
    thumbnail_path text,
    size bigint NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at timestamp with time zone
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS gallery_items_user_id_idx ON gallery_items(user_id);
CREATE INDEX IF NOT EXISTS gallery_items_created_at_idx ON gallery_items(created_at DESC);
CREATE INDEX IF NOT EXISTS gallery_items_expires_at_idx ON gallery_items(expires_at) WHERE expires_at IS NOT NULL;

-- RLS (Row Level Security) 활성화
ALTER TABLE gallery_items ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- 사용자는 자신의 갤러리 아이템만 볼 수 있음
CREATE POLICY "Users can view own gallery items" ON gallery_items
    FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 갤러리 아이템만 삽입할 수 있음
CREATE POLICY "Users can insert own gallery items" ON gallery_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 갤러리 아이템만 업데이트할 수 있음
CREATE POLICY "Users can update own gallery items" ON gallery_items
    FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 갤러리 아이템만 삭제할 수 있음
CREATE POLICY "Users can delete own gallery items" ON gallery_items
    FOR DELETE USING (auth.uid() = user_id);

-- Storage 버킷 생성 (이미 있다면 에러 무시)
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-gallery', 'user-gallery', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS 정책 생성
-- 사용자는 자신의 폴더에만 업로드 가능
CREATE POLICY "Users can upload own files" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'user-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 사용자는 자신의 파일만 조회 가능
CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT USING (bucket_id = 'user-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 사용자는 자신의 파일만 삭제 가능
CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (bucket_id = 'user-gallery' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 자동 만료 아이템 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_gallery_items()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 만료된 아이템 삭제
    DELETE FROM gallery_items
    WHERE expires_at IS NOT NULL
    AND expires_at < NOW();

    -- 로그 출력 (선택사항)
    RAISE NOTICE 'Cleaned up expired gallery items at %', NOW();
END;
$$;

-- 자동 정리 스케줄러 (선택사항 - pg_cron 확장이 필요)
-- SELECT cron.schedule('cleanup-gallery', '0 2 * * *', 'SELECT cleanup_expired_gallery_items();');

-- 업데이트 트리거 함수 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_gallery_items_updated_at
    BEFORE UPDATE ON gallery_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();