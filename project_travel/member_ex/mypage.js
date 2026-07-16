// =====================================================================
// mypage.js
// 내 정보 페이지 (로그인 확인 → 회원정보 조회 → 화면 표시 → 로그아웃)
// =====================================================================

import { supabase } from "./supabase.js";

// ---------------------------------------------------------------------
// 기본 프로필 이미지 (등록된 이미지가 없을 때 사용)
//   - 외부 파일 없이 동작하도록 SVG 를 data URI 로 직접 넣음 (회색 사람 실루엣)
// ---------------------------------------------------------------------
const DEFAULT_AVATAR =
    "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='110' height='110' viewBox='0 0 120 120'>" +
    "<rect width='120' height='120' fill='%23e5e7eb'/>" +
    "<circle cx='60' cy='46' r='23' fill='%239ca3af'/>" +
    "<path d='M18 110 a42 42 0 0 1 84 0 Z' fill='%239ca3af'/></svg>";

// ---------------------------------------------------------------------
// 자주 쓰는 요소 미리 찾아두기
// ---------------------------------------------------------------------
const profileImageEl = document.getElementById("profile-image");
const roleBadgeEl = document.getElementById("role-badge");
const messageEl = document.getElementById("message");
const logoutBtn = document.getElementById("logout-btn");

// ---------------------------------------------------------------------
// 메시지 표시 헬퍼
// ---------------------------------------------------------------------
function showMessage(text, type = "") {
    messageEl.textContent = text;
    messageEl.className = "message";
    if (type === "error") messageEl.classList.add("message--error");
    if (type === "success") messageEl.classList.add("message--success");
}

// 값이 없으면(빈 문자열/null/undefined) "-" 로 표시하는 헬퍼
function displayValue(value) {
    return value ? value : "-";
}

// ---------------------------------------------------------------------
// 페이지 초기화: 로그인 확인 → 회원정보 조회 → 화면 표시
// ---------------------------------------------------------------------
async function init() {
    // (1) 로그인 여부 확인
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // 로그인하지 않았으면 로그인 페이지로 이동
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // (2) 본인 회원 정보(member) 조회
    const { data: profile, error } = await supabase
        .from("member")
        .select("name, email, phone, address, profile_image, role")
        .eq("id", user.id)
        .single(); // 정확히 한 행만 가져옴

    // (3) 조회 실패 시: 안내 후 로그인 페이지로 이동
    if (error || !profile) {
        showMessage("회원 정보를 불러오지 못했습니다. 로그인 페이지로 이동합니다.", "error");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return;
    }

    // (4) 프로필 이미지: 등록된 값이 있으면 사용, 없으면 기본 이미지
    profileImageEl.src = profile.profile_image || DEFAULT_AVATAR;
    // 깨진 이미지 URL 대비: 로드 실패 시 기본 이미지로 대체
    profileImageEl.onerror = () => {
        profileImageEl.src = DEFAULT_AVATAR;
    };

    // (5) 권한 배지: admin 이면 '관리자', 그 외 '일반'
    if (profile.role === "admin") {
        roleBadgeEl.textContent = "관리자";
        roleBadgeEl.classList.add("badge--admin");
    } else {
        roleBadgeEl.textContent = "일반";
        roleBadgeEl.classList.add("badge--user");
    }

    // (6) 정보 목록 채우기 (값 없으면 "-")
    document.getElementById("info-name").textContent = displayValue(profile.name);
    document.getElementById("info-email").textContent = displayValue(profile.email);
    document.getElementById("info-phone").textContent = displayValue(profile.phone);
    document.getElementById("info-address").textContent = displayValue(profile.address);
}

// ---------------------------------------------------------------------
// 로그아웃 버튼: 로그아웃 처리 후 로그인 페이지로 이동
// ---------------------------------------------------------------------
logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    logoutBtn.textContent = "로그아웃 중...";

    await supabase.auth.signOut(); // 세션 종료
    window.location.href = "login.html";
});

// 페이지 로드 시 초기화 실행
init();
