// =====================================================================
// member.js
// 관리자 회원 관리 페이지 (관리자 확인 → 목록 조회 → 검색/새로고침)
// =====================================================================

import { supabase } from "./supabase.js";

// ---------------------------------------------------------------------
// 자주 쓰는 요소 미리 찾아두기
// ---------------------------------------------------------------------
const tbody = document.getElementById("member-tbody");
const searchInput = document.getElementById("search");
const refreshBtn = document.getElementById("refresh-btn");
const logoutBtn = document.getElementById("logout-btn");
const messageEl = document.getElementById("message");

// 테이블 컬럼 수 (상태 안내 셀의 colspan 에 사용)
const COLUMN_COUNT = 6;

// ---------------------------------------------------------------------
// 메시지 표시 헬퍼 (주로 오류 표시에 사용)
// ---------------------------------------------------------------------
function showMessage(text, type = "") {
    messageEl.textContent = text;
    messageEl.className = "message";
    if (type === "error") messageEl.classList.add("message--error");
    if (type === "success") messageEl.classList.add("message--success");
}

// 값이 없으면 "-" 로 표시
function displayValue(value) {
    return value ? value : "-";
}

// 테이블 전체 폭을 차지하는 안내 행(로딩/빈 목록)을 그린다
function renderStateRow(text) {
    tbody.innerHTML = ""; // 기존 내용 비우기
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.className = "state-cell";
    td.colSpan = COLUMN_COUNT;
    td.textContent = text;
    tr.appendChild(td);
    tbody.appendChild(tr);
}

// ---------------------------------------------------------------------
// 회원 한 명(member)을 표 한 줄(<tr>)로 만들어 반환
//   - textContent 로 값을 넣어 HTML 삽입(XSS)을 방지한다.
// ---------------------------------------------------------------------
function createRow(member) {
    const tr = document.createElement("tr");

    // (1) 프로필: 이름 첫 글자가 들어간 원형 아이콘
    const profileTd = document.createElement("td");
    const avatar = document.createElement("div");
    avatar.className = "avatar";
    // 이름이 있으면 첫 글자, 없으면 "?"
    avatar.textContent = member.name ? member.name.charAt(0) : "?";
    profileTd.appendChild(avatar);
    tr.appendChild(profileTd);

    // (2) 이름 / (3) 이메일 / (4) 전화번호 / (5) 주소
    [member.name, member.email, member.phone, member.address].forEach((value) => {
        const td = document.createElement("td");
        td.textContent = displayValue(value);
        tr.appendChild(td);
    });

    // (6) 권한 배지 (관리자 / 일반)
    const roleTd = document.createElement("td");
    const badge = document.createElement("span");
    if (member.role === "admin") {
        badge.className = "badge badge--admin";
        badge.textContent = "관리자";
    } else {
        badge.className = "badge badge--user";
        badge.textContent = "일반";
    }
    roleTd.appendChild(badge);
    tr.appendChild(roleTd);

    return tr;
}

// ---------------------------------------------------------------------
// 회원 목록 조회 → 테이블에 그리기
//   keyword: 이름/이메일 검색어 (비어 있으면 전체 조회)
// ---------------------------------------------------------------------
async function loadMembers(keyword = "") {
    // 로딩 표시
    renderStateRow("불러오는 중...");
    showMessage("");

    // 기본 쿼리: 필요한 컬럼만, 최신 가입순
    let query = supabase
        .from("member")
        .select("name, email, phone, address, role")
        .order("created_at", { ascending: false });

    // 검색어가 있으면 이름 또는 이메일에 부분 일치(ilike, 대소문자 무시)
    const term = keyword.trim();
    if (term) {
        query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%`);
    }

    const { data, error } = await query;

    // (14) 오류 발생 시 화면에 표시
    if (error) {
        console.error(error);
        showMessage("회원 목록을 불러오는 중 오류가 발생했습니다: " + error.message, "error");
        renderStateRow("데이터를 불러오지 못했습니다.");
        return;
    }

    // (13) 결과가 없을 때
    if (!data || data.length === 0) {
        renderStateRow("등록된 회원이 없습니다.");
        return;
    }

    // 정상: 행 그리기
    tbody.innerHTML = "";
    data.forEach((member) => tbody.appendChild(createRow(member)));
}

// ---------------------------------------------------------------------
// 페이지 초기화: 로그인 + 관리자 권한 확인 후 목록 조회
// ---------------------------------------------------------------------
async function init() {
    // (1) 로그인 여부 확인
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // (2) 관리자 권한 확인: 본인 role 조회
    const { data: profile, error } = await supabase
        .from("member")
        .select("role")
        .eq("id", user.id)
        .single();

    // 관리자가 아니거나 조회 실패 시: 안내 후 로그인 페이지로 이동
    if (error || !profile || profile.role !== "admin") {
        showMessage("관리자만 접근할 수 있는 페이지입니다. 로그인 페이지로 이동합니다.", "error");
        renderStateRow("접근 권한이 없습니다.");
        setTimeout(() => {
            window.location.href = "login.html";
        }, 1500);
        return;
    }

    // 관리자 확인 완료 → 전체 회원 목록 조회
    loadMembers();
}

// ---------------------------------------------------------------------
// 검색: 입력할 때마다 자동 조회 (디바운스로 과도한 요청 방지)
//   - 타이핑이 멈춘 뒤 300ms 후에 한 번만 조회한다.
// ---------------------------------------------------------------------
let debounceTimer;
searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        loadMembers(searchInput.value);
    }, 300);
});

// ---------------------------------------------------------------------
// (7) 새로고침: 현재 검색어 기준으로 다시 조회
// ---------------------------------------------------------------------
refreshBtn.addEventListener("click", () => {
    loadMembers(searchInput.value);
});

// ---------------------------------------------------------------------
// (4) 로그아웃: 로그아웃 처리 후 로그인 페이지로 이동
// ---------------------------------------------------------------------
logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    logoutBtn.textContent = "로그아웃 중...";
    await supabase.auth.signOut();
    window.location.href = "login.html";
});

// 페이지 로드 시 초기화 실행
init();
