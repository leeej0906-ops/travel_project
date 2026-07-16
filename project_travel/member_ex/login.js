// =====================================================================
// login.js
// 로그인 페이지 동작 (유효성 검사, 로그인, role 조회, 페이지 이동)
// =====================================================================

import { supabase } from "./supabase.js";

// ---------------------------------------------------------------------
// 1) 자주 쓰는 요소 미리 찾아두기
// ---------------------------------------------------------------------
const form = document.getElementById("login-form");
const loginBtn = document.getElementById("login-btn");
const signupBtn = document.getElementById("signup-btn");
const messageEl = document.getElementById("message");

// ---------------------------------------------------------------------
// 2) 메시지 표시 헬퍼
//    type: "error"(빨강) | "success"(초록) | ""(기본)
// ---------------------------------------------------------------------
function showMessage(text, type = "") {
    messageEl.textContent = text;
    messageEl.className = "message";
    if (type === "error") messageEl.classList.add("message--error");
    if (type === "success") messageEl.classList.add("message--success");
}

// ---------------------------------------------------------------------
// 3) 로딩 상태 On/Off (처리 중 버튼 비활성화 + 문구 변경)
// ---------------------------------------------------------------------
function setLoading(isLoading) {
    loginBtn.disabled = isLoading;
    loginBtn.textContent = isLoading ? "로그인 중..." : "로그인";
}

// ---------------------------------------------------------------------
// 4) 비밀번호 보기/숨기기 토글
// ---------------------------------------------------------------------
document.querySelectorAll(".toggle-pw").forEach((btn) => {
    btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.target);
        if (input.type === "password") {
            input.type = "text";
            btn.textContent = "🙈";
        } else {
            input.type = "password";
            btn.textContent = "👁";
        }
    });
});

// ---------------------------------------------------------------------
// 5) 회원가입 버튼 → 회원가입 페이지로 이동
// ---------------------------------------------------------------------
signupBtn.addEventListener("click", () => {
    window.location.href = "signup.html";
});

// ---------------------------------------------------------------------
// 6) Supabase 영어 오류 메시지를 한국어로 변환
//    - 메시지에 특정 문구가 포함되어 있는지로 판별한다.
// ---------------------------------------------------------------------
function toKoreanError(message = "") {
    const msg = message.toLowerCase();

    // 이메일/비밀번호 불일치
    if (msg.includes("invalid login credentials")) {
        return "이메일 또는 비밀번호가 일치하지 않습니다.";
    }
    // 이메일 인증 미완료
    if (msg.includes("email not confirmed")) {
        return "이메일 인증이 완료되지 않았습니다. 메일함을 확인해 주세요.";
    }
    // 요청이 너무 잦을 때
    if (msg.includes("too many requests") || msg.includes("rate limit")) {
        return "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
    }
    // 그 외: 기본 안내
    return "로그인 중 오류가 발생했습니다. 다시 시도해 주세요.";
}

// ---------------------------------------------------------------------
// 7) 폼 제출 → 로그인 전체 흐름
// ---------------------------------------------------------------------
form.addEventListener("submit", async (event) => {
    event.preventDefault(); // 새로고침 막기

    const email = form.email.value.trim();
    const password = form.password.value;

    // (1) 입력값 검사: 하나라도 비어 있으면 중단
    if (!email || !password) {
        showMessage("이메일과 비밀번호를 모두 입력해 주세요.", "error");
        return;
    }

    setLoading(true);
    showMessage(""); // 이전 메시지 지우기

    try {
        // (2) Supabase Authentication 으로 로그인
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        // 로그인 실패 시: 영어 메시지를 한국어로 바꿔서 표시
        if (error) {
            showMessage(toKoreanError(error.message), "error");
            setLoading(false);
            return;
        }

        // (3) 로그인 성공 → member 테이블에서 role 조회
        const userId = data.user.id;
        const { data: profile, error: profileError } = await supabase
            .from("member")
            .select("role")
            .eq("id", userId)
            .single(); // 정확히 한 행만 가져옴

        if (profileError) throw profileError;

        // (4) role 에 따라 이동할 페이지 결정
        showMessage("로그인 성공! 페이지로 이동합니다.", "success");
        const target = profile.role === "admin" ? "member.html" : "mypage.html";
        setTimeout(() => {
            window.location.href = target;
        }, 800);
    } catch (err) {
        // 프로필 조회 실패 등 예상치 못한 오류
        console.error(err);
        showMessage("로그인 처리 중 문제가 발생했습니다. 다시 시도해 주세요.", "error");
        setLoading(false);
    }
});
