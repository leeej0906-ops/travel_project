-- gallery 테이블 생성 SQL (Supabase / PostgreSQL)
CREATE TABLE gallery (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    image_name  VARCHAR(255) NOT NULL,
    image_url   TEXT         NOT NULL,
    description TEXT,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- Supabase Storage: gallery-image 버킷 CRUD 접근 권한 (RLS 정책)
-- =====================================================================

-- 1) 버킷 생성 (이미 존재하면 무시). public = true 로 Public URL 접근 허용
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-image', 'gallery-image', true)
ON CONFLICT (id) DO NOTHING;

-- 2) storage.objects 에 RLS 활성화 (Supabase는 기본 활성 상태)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- CRUD 정책 : gallery-image 버킷 한정
--  ※ 아래는 anon/authenticated 모두 허용하는 "공개(public)" 설정입니다.
--    운영 환경에서는 write 계열을 authenticated 로 제한하는 것을 권장합니다.
-- =====================================================================

-- READ (SELECT) : 누구나 조회 가능
CREATE POLICY "gallery-image read"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'gallery-image' );

-- CREATE (INSERT) : 업로드 허용
CREATE POLICY "gallery-image insert"
ON storage.objects FOR INSERT
TO public
WITH CHECK ( bucket_id = 'gallery-image' );

-- UPDATE : 파일 수정/덮어쓰기 허용
CREATE POLICY "gallery-image update"
ON storage.objects FOR UPDATE
TO public
USING ( bucket_id = 'gallery-image' )
WITH CHECK ( bucket_id = 'gallery-image' );

-- DELETE : 삭제 허용
CREATE POLICY "gallery-image delete"
ON storage.objects FOR DELETE
TO public
USING ( bucket_id = 'gallery-image' );

-- =====================================================================
-- gallery 테이블 접근 권한 (등록 페이지용 RLS 정책)
--  ※ anon 키로 동작하므로 public 대상 정책이 필요합니다.
--    운영 환경에서는 authenticated 로 제한하는 것을 권장합니다.
-- =====================================================================

-- gallery 테이블 RLS 활성화
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- INSERT : 이미지 등록(행 추가) 허용 — 등록 페이지 필수 권한
CREATE POLICY "gallery insert"
ON gallery FOR INSERT
TO public
WITH CHECK ( true );

-- SELECT : 등록된 이미지 조회 허용 (목록/미리보기용)
CREATE POLICY "gallery read"
ON gallery FOR SELECT
TO public
USING ( true );

-- UPDATE : 등록된 정보 수정 허용
CREATE POLICY "gallery update"
ON gallery FOR UPDATE
TO public
USING ( true )
WITH CHECK ( true );

-- DELETE : 등록된 데이터 삭제 허용
CREATE POLICY "gallery delete"
ON gallery FOR DELETE
TO public
USING ( true );
