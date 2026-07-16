// ===== DOM 요소 =====
const postListEl = document.getElementById("post-list");
const searchFormEl = document.getElementById("search-form");
const searchInputEl = document.getElementById("search-input");
const showAllBtnEl = document.getElementById("show-all-btn");
const errorMessageEl = document.getElementById("error-message");
const paginationEl = document.getElementById("pagination");
const prevBtnEl = document.getElementById("prev-btn");
const nextBtnEl = document.getElementById("next-btn");
const pageInfoEl = document.getElementById("page-info");
const sortSelectEl = document.getElementById("sort-select");

// ===== 페이지네이션 상태 =====
const PAGE_SIZE = 10; // 한 페이지에 보여줄 게시글 수
let currentPage = 1; // 현재 페이지 번호 (1부터 시작)
let currentKeyword = ""; // 현재 검색어 (페이지 이동 시 유지)
let currentSort = "latest"; // 현재 정렬 방식 (기본값: 최신순)

// ===== 정렬 방식 정의 =====
// 각 정렬 값에 대해 정렬할 컬럼(column)과 오름차순 여부(ascending)를 지정합니다.
const SORT_OPTIONS = {
    latest: { column: "created_at", ascending: false }, // 최신 등록순 (기본값)
    oldest: { column: "created_at", ascending: true }, // 오래된 등록순
    views: { column: "view_count", ascending: false }, // 조회수 높은순
};

// ===== 오류 메시지 표시 / 숨김 =====
function showError(message) {
    errorMessageEl.textContent = message;
    errorMessageEl.hidden = false;
}

function hideError() {
    errorMessageEl.textContent = "";
    errorMessageEl.hidden = true;
}

// ===== 날짜 포맷 (YYYY-MM-DD) =====
function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// ===== HTML 이스케이프 (XSS 방지) =====
function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}

// ===== 게시글 목록 렌더링 =====
function renderPosts(posts) {
    // 결과가 없을 때
    if (!posts || posts.length === 0) {
        postListEl.innerHTML = `
            <tr class="empty-row">
                <td colspan="5">게시글이 없습니다.</td>
            </tr>
        `;
        return;
    }

    postListEl.innerHTML = posts
        .map(
            (post) => `
            <tr>
                <td class="col-id">${post.id}</td>
                <td class="col-title">
                    <a class="post-link" href="detail.html?id=${post.id}">
                        ${escapeHtml(post.title)}
                    </a>
                </td>
                <td class="col-writer">${escapeHtml(post.writer)}</td>
                <td class="col-views">${post.view_count}</td>
                <td class="col-date">${formatDate(post.created_at)}</td>
            </tr>
        `
        )
        .join("");
}

// ===== 페이지네이션 UI 갱신 =====
// totalCount: 검색 조건에 맞는 전체 게시글 수
function renderPagination(totalCount) {
    // 전체 게시글 수로 마지막 페이지 번호를 계산합니다.
    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    // 게시글이 한 페이지 이하이면 페이지네이션을 숨깁니다.
    if (totalPages <= 1) {
        paginationEl.hidden = true;
        return;
    }

    paginationEl.hidden = false;

    // 현재 페이지 / 전체 페이지 표시
    pageInfoEl.textContent = `${currentPage} / ${totalPages}`;

    // 첫 페이지에서는 "이전", 마지막 페이지에서는 "다음"을 비활성화합니다.
    prevBtnEl.disabled = currentPage <= 1;
    nextBtnEl.disabled = currentPage >= totalPages;
}

// ===== 게시글 조회 (검색 + 최신순 정렬 + 페이지 조회) =====
async function fetchPosts() {
    hideError();

    try {
        // range()에 사용할 시작/끝 인덱스를 계산합니다. (0부터 시작)
        // 예) 1페이지 -> 0~9, 2페이지 -> 10~19
        const from = (currentPage - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // select()에 { count: "exact" }를 주면 전체 개수도 함께 받아옵니다.
        let query = supabaseClient
            .from("posts")
            .select("id, title, writer, view_count, created_at", {
                count: "exact",
            });

        // or() + ilike() : 제목 또는 작성자 검색 (대소문자 구분 없음, 부분 일치)
        if (currentKeyword.trim() !== "") {
            const kw = currentKeyword.trim();
            query = query.or(`title.ilike.%${kw}%,writer.ilike.%${kw}%`);
        }

        // 선택한 정렬 방식을 가져옵니다. (없으면 기본값 최신순)
        const sort = SORT_OPTIONS[currentSort] ?? SORT_OPTIONS.latest;

        // order() : 선택한 컬럼/방향으로 정렬
        // range() : 현재 페이지에 해당하는 구간만 조회
        query = query
            .order(sort.column, { ascending: sort.ascending })
            .range(from, to);

        const { data, error, count } = await query;

        if (error) {
            throw error;
        }

        renderPosts(data);
        renderPagination(count ?? 0);
    } catch (err) {
        console.error("게시글 조회 오류:", err);
        showError(`게시글을 불러오지 못했습니다. (${err.message})`);
        // 오류 시 목록 영역 비우고 페이지네이션 숨기기
        postListEl.innerHTML = "";
        paginationEl.hidden = true;
    }
}

// ===== 검색 폼 제출 이벤트 =====
// 새로 검색할 때는 항상 1페이지부터 조회합니다.
searchFormEl.addEventListener("submit", (event) => {
    event.preventDefault();
    currentKeyword = searchInputEl.value;
    currentPage = 1;
    fetchPosts();
});

// ===== 전체보기 버튼 클릭 이벤트 =====
// 검색어를 비우고 1페이지부터 전체 게시글을 다시 조회합니다.
// (정렬 방식은 사용자가 선택한 값을 그대로 유지합니다.)
showAllBtnEl.addEventListener("click", () => {
    searchInputEl.value = "";
    currentKeyword = "";
    currentPage = 1;
    fetchPosts();
});

// ===== 정렬 방식 변경 이벤트 =====
// 정렬을 바꾸면 1페이지부터 다시 조회합니다. (검색어는 유지)
sortSelectEl.addEventListener("change", () => {
    currentSort = sortSelectEl.value;
    currentPage = 1;
    fetchPosts();
});

// ===== 이전 버튼 클릭 이벤트 =====
prevBtnEl.addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage -= 1;
        fetchPosts();
    }
});

// ===== 다음 버튼 클릭 이벤트 =====
nextBtnEl.addEventListener("click", () => {
    currentPage += 1;
    fetchPosts();
});

// ===== 페이지 로드 시 전체 게시글 조회 =====
fetchPosts();
