// ===== Supabase 클라이언트 설정 =====
// 아래 값을 본인의 Supabase 프로젝트 정보로 교체하세요.
// (Supabase 대시보드 > Project Settings > API 에서 확인)

const SUPABASE_URL = "https://nhmukztrgcbqxclynvhp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qL1ft-G6zhxY4BhdpCfOsg_gfMPT0zZ";

// CDN으로 불러온 supabase 전역 객체에서 클라이언트 생성
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
