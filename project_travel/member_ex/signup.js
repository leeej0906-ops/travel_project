// =====================================================================
// signup.js
// 회원가입 페이지의 동작(유효성 검사, 이미지 업로드, 회원가입, DB 저장)
// =====================================================================

import { supabase, AVATAR_BUCKET } from "./supabase.js";

// ---------------------------------------------------------------------
// 1) 자주 쓰는 요소들을 미리 찾아둔다 (매번 찾지 않도록)
// ---------------------------------------------------------------------
const form = document.getElementById("signup-form");
const submitBtn = document.getElementById("submit-btn");
const messageEl = document.getElementById("message");
const fileInput = document.getElementById("profile-image");
const previewEl = document.getElementById("preview");

// ---------------------------------------------------------------------
// 2) 안내/오류 메시지를 화면에 표시하는 헬퍼 함수
//    type: "error"(빨강) | "success"(초록) | ""(기본)
// ---------------------------------------------------------------------
function showMessage(text, type = "") {
    messageEl.textContent = text;
    // 기존 색상 클래스를 지우고 새로 지정
    messageEl.className = "message";
    if (type === "error") messageEl.classList.add("message--error");
    if (type === "success") messageEl.classList.add("message--success");
}

// ---------------------------------------------------------------------
// 3) 로딩 상태 On/Off
//    회원가입 처리 중에는 버튼을 비활성화하고 문구를 바꿔 중복 클릭을 막는다.
// ---------------------------------------------------------------------
function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? "처리 중..." : "회원가입";
}

// ---------------------------------------------------------------------
// 4) 비밀번호 보기/숨기기 토글
//    각 토글 버튼(data-target)에 클릭 이벤트를 연결한다.
// ---------------------------------------------------------------------
document.querySelectorAll(".toggle-pw").forEach((btn) => {
    btn.addEventListener("click", () => {
        const targetId = btn.dataset.target; // 어떤 입력창을 제어할지
        const input = document.getElementById(targetId);
        // 현재 password면 text로, 아니면 다시 password로
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
// 5) 프로필 이미지 미리보기
//    파일을 선택하면 브라우저에서 임시 URL을 만들어 미리 보여준다.
// ---------------------------------------------------------------------
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) {
        previewEl.src = URL.createObjectURL(file);
        previewEl.hidden = false;
    } else {
        previewEl.hidden = true;
    }
});

// ---------------------------------------------------------------------
// 6) 입력값 유효성 검사
//    문제가 있으면 오류 메시지를 반환하고, 없으면 null을 반환한다.
// ---------------------------------------------------------------------
function validate(data) {
    // 이름 필수
    if (!data.name) return "이름을 입력해 주세요.";

    // 이메일 형식 검사 (간단한 정규식)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!data.email) return "이메일을 입력해 주세요.";
    if (!emailRegex.test(data.email)) return "이메일 형식이 올바르지 않습니다.";

    // 비밀번호: 필수 + 6자 이상 (Supabase 기본 최소 길이)
    if (!data.password) return "비밀번호를 입력해 주세요.";
    if (data.password.length < 6) return "비밀번호는 6자 이상이어야 합니다.";

    // 비밀번호 확인 일치
    if (data.password !== data.passwordConfirm)
        return "비밀번호가 일치하지 않습니다.";

    // 전화번호(선택): 입력했다면 형식 검사 (숫자/하이픈만)
    if (data.phone && !/^[0-9-]{9,15}$/.test(data.phone))
        return "전화번호 형식이 올바르지 않습니다.";

    return null; // 통과
}

// ---------------------------------------------------------------------
// 7) 프로필 이미지를 Supabase Storage에 업로드하고 public URL을 반환
//    이미지가 없으면 null을 반환한다.
// ---------------------------------------------------------------------
async function uploadProfileImage(userId, file) {
    if (!file) return null;

    // 파일 확장자 추출 (예: png, jpg)
    const ext = file.name.split(".").pop();
    // 사용자마다 고유한 경로로 저장 (덮어쓰기 허용)
    const filePath = `${userId}/profile.${ext}`;

    // Storage 버킷에 업로드
    const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 업로드된 파일의 공개 URL 가져오기
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(filePath);
    return data.publicUrl;
}

// ---------------------------------------------------------------------
// 8) 폼 제출 → 회원가입 전체 흐름
// ---------------------------------------------------------------------
form.addEventListener("submit", async (event) => {
    event.preventDefault(); // 페이지 새로고침 막기

    // 폼 값 모으기 (trim으로 앞뒤 공백 제거)
    const data = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        password: form.password.value,
        passwordConfirm: form["password-confirm"].value,
        phone: form.phone.value.trim(),
        address: form.address.value.trim(),
    };

    // (1) 유효성 검사
    const errorMessage = validate(data);
    if (errorMessage) {
        showMessage(errorMessage, "error");
        return;
    }

    setLoading(true);
    showMessage(""); // 이전 메시지 지우기

    try {
        // (2) Supabase Auth로 회원가입
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
        });
        if (authError) throw authError;

        const userId = authData.user.id; // 새로 생성된 사용자 UUID

        // (3) 프로필 이미지 업로드 (선택)
        //     업로드가 실패해도 회원가입 자체는 진행되도록 별도 try/catch로 감쌈
        let profileImageUrl = null;
        try {
            profileImageUrl = await uploadProfileImage(userId, fileInput.files[0]);
        } catch (imgError) {
            console.warn("이미지 업로드 실패(프로필 없이 계속 진행):", imgError.message);
        }

        // (4) member 테이블에 프로필 정보 저장
        //     비밀번호는 저장하지 않음 (인증은 auth.users가 전담)
        const { error: insertError } = await supabase.from("member").insert({
            id: userId,                       // auth.users(id) 참조
            email: data.email,
            name: data.name,
            phone: data.phone || null,        // 빈 문자열 대신 NULL 저장
            address: data.address || null,
            profile_image: profileImageUrl,
            // role, status, created_at, updated_at 은 DB 기본값 사용
        });
        if (insertError) throw insertError;

        // (5) 성공 → 안내 후 로그인 페이지로 이동
        showMessage("회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.", "success");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
    } catch (err) {
        // Supabase가 돌려주는 오류 메시지를 그대로 보여줌
        console.error(err);
        showMessage(err.message || "회원가입 중 오류가 발생했습니다.", "error");
        setLoading(false); // 실패 시 다시 시도할 수 있도록 버튼 복구
    }
});

// ---------------------------------------------------------------------
// 9) 초기화 버튼: 폼을 비운 뒤 미리보기/메시지도 함께 지운다.
// ---------------------------------------------------------------------
form.addEventListener("reset", () => {
    previewEl.hidden = true;
    previewEl.src = "";
    showMessage("");
});
