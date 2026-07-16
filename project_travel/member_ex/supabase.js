// =====================================================================
// supabase.js
// Supabase 클라이언트를 생성해서 다른 파일에서 재사용하도록 내보낸다.
// =====================================================================

// ⚠️ 아래 두 값은 본인의 Supabase 프로젝트 값으로 교체하세요.
//   - Supabase 대시보드 > Project Settings > API 에서 확인 가능
//   - anon key(공개 키)는 브라우저에 노출되어도 되는 값입니다.
//     (실제 보호는 테이블의 RLS 정책이 담당합니다.)
const SUPABASE_URL = "https://nhmukztrgcbqxclynvhp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qL1ft-G6zhxY4BhdpCfOsg_gfMPT0zZ";

// Supabase SDK 를 ES 모듈로 직접 가져온다.
//   - 기존처럼 <script>로 window.supabase 를 쓰는 방식은 로드 순서/추적방지에
//     영향을 받을 수 있어, import 방식이 더 안정적이다.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 프로필 이미지를 업로드할 Storage 버킷 이름
//   - Supabase 대시보드 > Storage 에서 'profiles' 버킷을 미리 만들어 두세요.
export const AVATAR_BUCKET = "profiles";
