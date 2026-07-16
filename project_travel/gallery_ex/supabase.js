// =====================================================================
// Supabase 연결 설정
//   아래 두 값을 본인 프로젝트 값으로 교체하세요.
//   - Supabase 대시보드 > Project Settings > API 에서 확인
// =====================================================================
const SUPABASE_URL = "https://nhmukztrgcbqxclynvhp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qL1ft-G6zhxY4BhdpCfOsg_gfMPT0zZ";

// Supabase 클라이언트 생성 (CDN 로드 시 전역 supabase 객체 사용)
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
