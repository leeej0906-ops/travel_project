// ===== DOM 요소 =====
const errorMessageEl = document.getElementById("error-message");
const postDetailEl = document.getElementById("post-detail");
const postTitleEl = document.getElementById("post-title");
const postWriterEl = document.getElementById("post-writer");
const postViewsEl = document.getElementById("post-views");
const postDateEl = document.getElementById("post-date");
const postContentEl = document.getElementById("post-content");
const editBtnEl = document.getElementById("edit-btn");
const deleteBtnEl = document.getElementById("delete-btn");

// ===== URL에서 게시글 id 추출 =====
const params = new URLSearchParams(window.location.search);
const postId = params.get("id");

// ===== 오류 메시지 표시 / 숨김 =====
function showError(message) {
    errorMessageEl.textContent = message;
    errorMessageEl.hidden = false;
}

function hideError() {
    errorMessageEl.textContent = "";
    errorMessageEl.hidden = true;
}

// ===== 날짜 포맷 (YYYY-MM-DD HH:mm) =====
function formatDateTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// ===== 게시글 렌더링 =====
function renderPost(post) {
    postTitleEl.textContent = post.title;
    postWriterEl.textContent = post.writer;
    postViewsEl.textContent = post.view_count;
    postDateEl.textContent = formatDateTime(post.created_at);
    // 내용의 줄바꿈을 화면에 그대로 반영 (textContent + CSS white-space)
    postContentEl.textContent = post.content;

    postDetailEl.hidden = false;
}

// ===== 조회수 1 증가 =====
async function increaseViewCount(currentCount) {
    const { error } = await supabaseClient
        .from("posts")
        .update({ view_count: currentCount + 1 })
        .eq("id", postId);

    if (error) {
        // 조회수 증가 실패는 상세 조회를 막지 않고 콘솔에만 기록
        console.error("조회수 증가 오류:", error);
    }
}

// ===== 게시글 상세 조회 + 조회수 증가 =====
async function fetchPost() {
    hideError();

    // id가 없으면 조회 불가
    if (!postId) {
        showError("잘못된 접근입니다. 게시글 번호가 없습니다.");
        console.error("게시글 조회 오류: URL에 id 값이 없습니다.");
        return;
    }

    try {
        // select() + eq() : id로 단일 게시글 조회
        const { data, error } = await supabaseClient
            .from("posts")
            .select("id, title, writer, content, view_count, created_at")
            .eq("id", postId)
            .single();

        if (error) {
            throw error;
        }

        // 조회수 1 증가 후 증가된 값을 화면에 반영
        await increaseViewCount(data.view_count);
        data.view_count = data.view_count + 1;

        renderPost(data);
    } catch (err) {
        console.error("게시글 조회 오류:", err);
        showError(`게시글을 불러오지 못했습니다. (${err.message})`);
        postDetailEl.hidden = true;
    }
}

// ===== 게시글 삭제 =====
async function deletePost() {
    // confirm() : "확인/취소" 창을 띄웁니다.
    // 사용자가 "취소"를 누르면 false가 되어 함수를 즉시 종료합니다.
    if (!confirm("정말 삭제하시겠습니까?")) {
        return;
    }

    hideError();

    try {
        // delete() : 데이터를 삭제하는 명령
        // eq()     : URL에서 가져온 id와 일치하는 게시글만 삭제
        const { error } = await supabaseClient
            .from("posts")
            .delete()
            .eq("id", postId);

        // Supabase가 오류를 반환하면 아래 catch로 넘깁니다.
        if (error) {
            throw error;
        }

        // 삭제 성공 안내 후 목록 페이지(list.html)로 이동합니다.
        alert("삭제되었습니다.");
        window.location.href = "list.html";
    } catch (err) {
        // 오류 내용을 콘솔과 화면에 함께 표시합니다.
        console.error("게시글 삭제 오류:", err);
        showError(`게시글을 삭제하지 못했습니다. (${err.message})`);
    }
}

// ===== 수정 버튼 클릭 → edit.html로 이동 =====
editBtnEl.addEventListener("click", () => {
    window.location.href = `edit.html?id=${postId}`;
});

// ===== 삭제 버튼 클릭 → 게시글 삭제 =====
deleteBtnEl.addEventListener("click", deletePost);

// ===== 페이지 로드 시 게시글 상세 조회 =====
fetchPost();
