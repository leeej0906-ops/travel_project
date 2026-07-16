-- 게시판(posts) 테이블 생성 SQL
-- PostgreSQL / Supabase에서 바로 실행 가능

CREATE TABLE IF NOT EXISTS posts (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title       VARCHAR(50)  NOT NULL,
    writer      VARCHAR(50)  NOT NULL,
    content     TEXT         NOT NULL,
    view_count  INTEGER      NOT NULL DEFAULT 0 CHECK (view_count >= 0),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ============================================================
-- RLS (Row Level Security) 정책
-- ============================================================
-- Supabase는 기본적으로 anon 키로 접근 시 RLS가 적용됩니다.
-- SELECT(조회)를 허용하려면 아래 정책이 필요합니다.

-- 1) posts 테이블에 RLS 활성화
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- 2) 전체 조회(SELECT) 허용 정책
--    누구나(anon, authenticated) 게시글을 읽을 수 있도록 허용합니다.
CREATE POLICY "Allow public read access"
    ON posts
    FOR SELECT
    USING (true);

-- 3) 입력(INSERT) 허용 정책
--    누구나 게시글을 작성할 수 있도록 허용합니다.
CREATE POLICY "Allow public insert access"
    ON posts
    FOR INSERT
    WITH CHECK (true);

-- 4) 수정(UPDATE) 허용 정책
--    USING       : 어떤 행을 수정할 수 있는지 (조회 조건)
--    WITH CHECK  : 수정된 결과가 만족해야 하는 조건
CREATE POLICY "Allow public update access"
    ON posts
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 5) 삭제(DELETE) 허용 정책
--    누구나 게시글을 삭제할 수 있도록 허용합니다.
CREATE POLICY "Allow public delete access"
    ON posts
    FOR DELETE
    USING (true);


-- ============================================================
-- 댓글(comments) 테이블 생성 SQL
-- PostgreSQL / Supabase에서 바로 실행 가능
-- ============================================================

CREATE TABLE IF NOT EXISTS comments (
    id          BIGINT       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id     BIGINT       NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
    writer      VARCHAR(50)  NOT NULL,
    content     TEXT         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 컬럼 설명
-- ------------------------------------------------------------
-- id          : 댓글 고유 번호(자동 증가), 기본키(PK)
-- post_id     : 댓글이 달린 게시글 번호. posts.id를 참조하는 외래키(FK).
--               ON DELETE CASCADE → 게시글이 삭제되면 해당 댓글도 함께 삭제됨.
-- writer      : 댓글 작성자 이름 (최대 50자, 필수)
-- content     : 댓글 내용 (길이 제한 없는 텍스트, 필수)
-- created_at  : 댓글 등록 일시 (기본값: 현재 시각)
-- updated_at  : 댓글 수정 일시 (기본값: 현재 시각)

-- ------------------------------------------------------------
-- (선택) 조회 성능을 위한 인덱스
-- 특정 게시글의 댓글을 자주 조회하므로 post_id에 인덱스를 둡니다.
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments (post_id);

-- ------------------------------------------------------------
-- RLS (Row Level Security) 정책
-- posts 테이블과 동일하게 공개 접근을 허용합니다.
-- ------------------------------------------------------------

-- 1) comments 테이블에 RLS 활성화
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 2) 전체 조회(SELECT) 허용
CREATE POLICY "Allow public read access"
    ON comments
    FOR SELECT
    USING (true);

-- 3) 입력(INSERT) 허용
CREATE POLICY "Allow public insert access"
    ON comments
    FOR INSERT
    WITH CHECK (true);

-- 4) 수정(UPDATE) 허용
CREATE POLICY "Allow public update access"
    ON comments
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- 5) 삭제(DELETE) 허용
CREATE POLICY "Allow public delete access"
    ON comments
    FOR DELETE
    USING (true);

