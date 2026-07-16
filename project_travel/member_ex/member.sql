-- =====================================================================
-- 테이블: member
-- 설명 : 웹사이트 회원 프로필/부가정보 테이블
--        인증(로그인/비밀번호)은 Supabase Authentication(auth.users)이 전담하며,
--        본 테이블은 프로필 및 부가정보만 관리한다.
-- =====================================================================

CREATE TABLE public.member (
    -- 기본 키: auth.users(id)를 참조하는 UUID
    -- 회원(auth.users) 삭제 시 프로필도 함께 삭제 (ON DELETE CASCADE)
    id              UUID PRIMARY KEY
                    REFERENCES auth.users (id) ON DELETE CASCADE,

    -- 로그인 계정으로 사용하는 이메일 (필수, 중복 불가)
    email           TEXT NOT NULL UNIQUE,

    -- 회원 이름 (필수)
    name            TEXT NOT NULL,

    -- 전화번호 (선택 입력이지만 중복 불가)
    phone           TEXT UNIQUE,

    -- 주소 (선택)
    address         TEXT,

    -- 프로필 이미지 URL (선택)
    profile_image   TEXT,

    -- 회원 권한: user, admin 만 허용 (기본값 user)
    role            TEXT NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'admin')),

    -- 회원 상태: active, inactive, blocked 만 허용 (기본값 active)
    status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'inactive', 'blocked')),

    -- 마지막 로그인 시간 (NULL 허용)
    last_login      TIMESTAMPTZ,

    -- 가입일 / 수정일 (기본값 NOW())
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- updated_at 자동 갱신 트리거
-- (행이 UPDATE 될 때마다 수정일을 현재 시각으로 자동 반영)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_member_updated_at
    BEFORE UPDATE ON public.member
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();


-- =====================================================================
-- RLS (Row Level Security) 정책
-- 회원가입 및 프로필 관리를 위한 접근 제어
-- =====================================================================

-- RLS 활성화 (활성화하면 정책에 명시된 접근만 허용됨)
ALTER TABLE public.member ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- [INSERT] 회원가입: 로그인한 사용자가 '본인' 프로필만 생성 가능
--   - auth.uid() = id 조건으로 남의 id로 프로필을 만드는 것을 차단
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "회원 본인 프로필 생성" ON public.member;
CREATE POLICY "회원 본인 프로필 생성"
    ON public.member
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------
-- [SELECT] 조회: 본인 프로필 조회 가능
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "회원 본인 프로필 조회" ON public.member;
CREATE POLICY "회원 본인 프로필 조회"
    ON public.member
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- ---------------------------------------------------------------------
-- [UPDATE] 수정: 본인 프로필만 수정 가능
--   - USING: 수정 대상 행이 본인 소유인지 확인
--   - WITH CHECK: 수정 후에도 id를 남의 것으로 바꿀 수 없도록 차단
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "회원 본인 프로필 수정" ON public.member;
CREATE POLICY "회원 본인 프로필 수정"
    ON public.member
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------
-- [DELETE] 삭제: 본인 프로필만 삭제 가능
--   (참고: auth.users 삭제 시에는 ON DELETE CASCADE로 자동 삭제됨)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "회원 본인 프로필 삭제" ON public.member;
CREATE POLICY "회원 본인 프로필 삭제"
    ON public.member
    FOR DELETE
    TO authenticated
    USING (auth.uid() = id);

-- ---------------------------------------------------------------------
-- 관리자 판별 함수 (순환 참조 방지의 핵심)
--   - member 정책 안에서 member 를 다시 SELECT 하면 정책이 또 실행되어
--     "infinite recursion detected in policy for relation member" 오류 발생.
--   - SECURITY DEFINER 함수는 '함수 소유자(postgres)' 권한으로 실행되고,
--     소유자는 RLS 를 우회하므로 member 를 조회해도 정책이 다시 돌지 않는다.
--   - STABLE: 같은 쿼리 안에서 결과가 변하지 않음을 알려 최적화에 도움.
--   - SET search_path: 함수가 항상 public 스키마를 바라보도록 고정(보안 권장).
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.member
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- ---------------------------------------------------------------------
-- [ALL] 관리자(admin) 전체 접근
--   - role 이 admin 인 회원은 모든 회원 데이터에 대해 조회/수정/삭제 가능
--   - is_admin() 함수로 판별하여 정책 재귀를 피한다.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "관리자 전체 접근" ON public.member;
CREATE POLICY "관리자 전체 접근"
    ON public.member
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- =====================================================================
-- Storage(프로필 이미지) 버킷 CRUD 정책
-- 버킷명: profiles  (supabase.js 의 AVATAR_BUCKET 값과 동일해야 함)
--
-- [경로 규칙] signup.js 는 파일을  "{userId}/profile.확장자"  경로로 업로드한다.
--   따라서 폴더의 첫 번째 세그먼트가 곧 소유자(user)의 id 이다.
--   storage.foldername(name) 은 경로를 배열로 반환하며,
--   PostgreSQL 배열은 1부터 시작하므로 [1] 이 첫 번째 폴더( = userId )이다.
--
-- ※ 파일 업로드/이미지 정보는 storage.objects 테이블에 저장되며,
--   이 테이블의 RLS 는 Supabase 에서 기본으로 켜져 있다.
-- =====================================================================

-- ---------------------------------------------------------------------
-- [SELECT] 조회: 프로필 이미지는 누구나 볼 수 있도록 공개 읽기 허용
--   (getPublicUrl 로 이미지를 화면에 표시하기 위함)
--   anon(비로그인) + authenticated 모두 허용
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "프로필 이미지 공개 조회" ON storage.objects;
CREATE POLICY "프로필 이미지 공개 조회"
    ON storage.objects
    FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'profiles');

-- ---------------------------------------------------------------------
-- [INSERT] 업로드: 로그인 사용자가 '본인 폴더'에만 업로드 가능
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "프로필 이미지 본인 업로드" ON storage.objects;
CREATE POLICY "프로필 이미지 본인 업로드"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'profiles'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ---------------------------------------------------------------------
-- [UPDATE] 수정: 본인 폴더의 파일만 교체 가능
--   (signup.js 의 upload 옵션 upsert:true 로 덮어쓸 때 필요)
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "프로필 이미지 본인 수정" ON storage.objects;
CREATE POLICY "프로필 이미지 본인 수정"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'profiles'
        AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'profiles'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ---------------------------------------------------------------------
-- [DELETE] 삭제: 본인 폴더의 파일만 삭제 가능
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "프로필 이미지 본인 삭제" ON storage.objects;
CREATE POLICY "프로필 이미지 본인 삭제"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'profiles'
        AND auth.uid()::text = (storage.foldername(name))[1]
    );


-- =====================================================================
-- 관리자 계정 지정 (수동 실행용)
--   - 회원가입은 항상 role='user'(기본값)로 생성되므로,
--     특정 회원을 관리자로 승격하려면 아래 UPDATE 를 직접 실행한다.
--   - 'admin@example.com' 부분을 관리자로 만들 실제 이메일로 바꿔서 실행.
-- =====================================================================

UPDATE public.member
SET role = 'admin'
WHERE email = 'admin1@naver.com';

-- (확인) 관리자로 지정된 회원 목록 조회
-- SELECT id, email, name, role FROM public.member WHERE role = 'admin';


