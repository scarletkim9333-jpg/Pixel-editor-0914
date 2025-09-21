-- 공유 기능을 위한 shared_items 테이블 생성
-- Session 6: 공유 기능 구현

-- shared_items 테이블
CREATE TABLE IF NOT EXISTS shared_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id text NOT NULL,           -- 갤러리 아이템 ID (storageService의 아이템 ID)
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  share_code text UNIQUE NOT NULL, -- 6자리 고유 공유 코드 (예: abc123)
  title text,                      -- 공유 시 표시될 제목
  description text,                -- 공유 시 표시될 설명
  is_public boolean DEFAULT true,  -- 공개/비공개 설정
  allow_download boolean DEFAULT true, -- 다운로드 허용 여부
  expires_at timestamp with time zone, -- 만료 시간 (NULL이면 무제한)
  view_count integer DEFAULT 0,   -- 조회수
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),

  -- 인덱스를 위한 제약조건
  CONSTRAINT shared_items_share_code_length CHECK (char_length(share_code) = 6)
);

-- Row Level Security (RLS) 설정
ALTER TABLE shared_items ENABLE ROW LEVEL SECURITY;

-- 정책 1: 사용자는 자신의 공유 아이템만 관리할 수 있음
CREATE POLICY "Users can manage their own shared items" ON shared_items
  FOR ALL USING (auth.uid() = user_id);

-- 정책 2: 공개된 아이템은 누구나 읽을 수 있음 (만료되지 않은 것만)
CREATE POLICY "Public shared items are viewable by anyone" ON shared_items
  FOR SELECT USING (
    is_public = true
    AND (expires_at IS NULL OR expires_at > now())
  );

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_shared_items_share_code ON shared_items(share_code);
CREATE INDEX IF NOT EXISTS idx_shared_items_user_id ON shared_items(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_items_item_id ON shared_items(item_id);
CREATE INDEX IF NOT EXISTS idx_shared_items_expires_at ON shared_items(expires_at);
CREATE INDEX IF NOT EXISTS idx_shared_items_created_at ON shared_items(created_at);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_shared_items_updated_at
    BEFORE UPDATE ON shared_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 만료된 공유 아이템 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_shared_items()
RETURNS void AS $$
BEGIN
  DELETE FROM shared_items
  WHERE expires_at IS NOT NULL
    AND expires_at < now() - interval '7 days'; -- 만료 후 7일 유예
END;
$$ LANGUAGE plpgsql;

-- 공유 코드 생성 함수 (6자리 랜덤 영숫자)
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS text AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i integer := 0;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;

  -- 중복 확인
  WHILE EXISTS(SELECT 1 FROM shared_items WHERE share_code = result) LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 조회수 증가 함수
CREATE OR REPLACE FUNCTION increment_share_view(p_share_code text)
RETURNS boolean AS $$
BEGIN
  UPDATE shared_items
  SET view_count = view_count + 1
  WHERE share_code = p_share_code
    AND is_public = true
    AND (expires_at IS NULL OR expires_at > now());

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Storage Bucket 생성 (이미지 공유용)
INSERT INTO storage.buckets (id, name, public)
VALUES ('shared-images', 'shared-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 정책: 공유된 이미지는 누구나 읽을 수 있음
CREATE POLICY "Shared images are publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'shared-images');

-- Storage 정책: 사용자는 자신의 이미지만 업로드/삭제 가능
CREATE POLICY "Users can upload their own shared images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'shared-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own shared images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'shared-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 예시 데이터 (개발용)
-- INSERT INTO shared_items (item_id, user_id, share_code, title, description) VALUES
-- ('example-item-1', auth.uid(), 'abc123', 'Beautiful AI Art', 'Generated with Pixel Editor AI'),
-- ('example-item-2', auth.uid(), 'def456', 'Fantasy Landscape', 'Epic fantasy scene created with AI');

COMMENT ON TABLE shared_items IS '사용자가 생성한 이미지의 공유 정보를 저장';
COMMENT ON COLUMN shared_items.share_code IS '6자리 고유 공유 코드 (URL에 사용)';
COMMENT ON COLUMN shared_items.view_count IS '공유 링크 조회수';
COMMENT ON COLUMN shared_items.expires_at IS '만료 시간 (NULL이면 무제한)';