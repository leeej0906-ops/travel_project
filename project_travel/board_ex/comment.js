// ===== 댓글 기능 =====
// detail.html에서 detail.js 다음에 로드됩니다.

// ===== DOM 요소 가져오기 =====
const commentErrorEl = document.getElementById("comment-error");
const commentFormEl = document.getElementById("comment-form");
const commentWriterEl = document.getElementById("comment-writer");
const commentContentEl = document.getElementById("comment-content");
const commentListEl = document.getElementById("comment-list");

// ===== URL에서 게시글 id(post_id) 추출 =====
// 예: detail.html?id=3  ->  commentPostId = "3"
// (detail.js에도 postId가 있지만, 이 파일에서 독립적으로 다시 읽어옵니다.)
const commentParams = new URLSearchParams(window.location.search);
const commentPostId = commentParams.get("id");

// ===== 댓글 상태 =====
let allComments = []; // 현재 화면에 표시 중인 댓글 목록
let editingCommentId = null; // 지금 수정 중인 댓글의 id (없으면 null)

// ===== 댓글 오류 메시지 표시 / 숨김 =====
function showCommentError(message) {
    commentErrorEl.textContent = message;
    commentErrorEl.hidden = false;
}

function hideCommentError() {
    commentErrorEl.textContent = "";
    commentErrorEl.hidden = true;
}

// ===== 날짜 포맷 (YYYY-MM-DD HH:mm) =====
function formatCommentDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// ===== HTML 이스케이프 (XSS 방지) =====
// 사용자가 입력한 값을 화면에 안전하게 표시하기 위해 사용합니다.
function escapeCommentHtml(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
}

// ===== 댓글 목록 렌더링 =====
function renderComments(comments) {
    // 댓글이 없을 때 안내 문구를 표시합니다.
    if (!comments || comments.length === 0) {
        commentListEl.innerHTML = `
            <li class="comment-empty">첫 번째 댓글을 남겨보세요.</li>
        `;
        return;
    }

    // 각 댓글을 <li>로 만들어 화면에 그립니다.
    commentListEl.innerHTML = comments
        .map((comment) => {
            // 현재 수정 중인 댓글이면 "수정 폼"을, 아니면 "일반 보기"를 그립니다.
            if (comment.id === editingCommentId) {
                return `
            <li class="comment-item">
                <div class="comment-item-head">
                    <span class="comment-item-writer">${escapeCommentHtml(comment.writer)}</span>
                    <span class="comment-item-date">${formatCommentDate(comment.created_at)}</span>
                </div>
                <textarea class="form-textarea comment-textarea comment-edit-input" data-id="${comment.id}">${escapeCommentHtml(comment.content)}</textarea>
                <div class="comment-form-actions">
                    <button type="button" class="btn btn-primary comment-save-btn" data-id="${comment.id}">저장</button>
                    <button type="button" class="btn btn-secondary comment-cancel-btn">취소</button>
                </div>
            </li>
        `;
            }

            return `
            <li class="comment-item">
                <div class="comment-item-head">
                    <span class="comment-item-writer">${escapeCommentHtml(comment.writer)}</span>
                    <span class="comment-item-date">${formatCommentDate(comment.created_at)}</span>
                </div>
                <div class="comment-item-content">${escapeCommentHtml(comment.content)}</div>
                <div class="comment-form-actions">
                    <button type="button" class="btn btn-secondary comment-edit-btn" data-id="${comment.id}">수정</button>
                    <button type="button" class="btn btn-danger comment-delete-btn" data-id="${comment.id}">삭제</button>
                </div>
            </li>
        `;
        })
        .join("");
}

// ===== 댓글 목록 조회 =====
async function fetchComments() {
    hideCommentError();

    // 게시글 id가 없으면 댓글을 조회할 수 없습니다.
    if (!commentPostId) {
        return;
    }

    try {
        // select() : 댓글 컬럼 조회
        // eq()     : 현재 게시글(post_id)의 댓글만 조회
        // order()  : 등록일(created_at) 오름차순 → 오래된 댓글이 위, 최신 댓글이 아래
        const { data, error } = await supabaseClient
            .from("comments")
            .select("id, post_id, writer, content, created_at")
            .eq("post_id", commentPostId)
            .order("created_at", { ascending: true });

        if (error) {
            throw error;
        }

        // 다시 조회했으므로 수정 상태를 초기화하고 목록을 저장/렌더링합니다.
        allComments = data ?? [];
        renderComments(allComments);
    } catch (err) {
        console.error("댓글 조회 오류:", err);
        showCommentError(`댓글을 불러오지 못했습니다. (${err.message})`);
    }
}

// ===== 댓글 등록 =====
async function createComment(event) {
    // form 제출 시 새로고침되는 기본 동작을 막습니다.
    event.preventDefault();
    hideCommentError();

    // 입력값의 앞뒤 공백을 제거합니다.
    const writer = commentWriterEl.value.trim();
    const content = commentContentEl.value.trim();

    // 작성자와 댓글 내용은 필수 입력입니다.
    if (writer === "" || content === "") {
        showCommentError("작성자와 댓글 내용을 모두 입력해 주세요.");
        return;
    }

    // 게시글 id가 없으면 어느 글의 댓글인지 알 수 없어 등록할 수 없습니다.
    if (!commentPostId) {
        showCommentError("잘못된 접근입니다. 게시글 번호가 없습니다.");
        console.error("댓글 등록 오류: URL에 id 값이 없습니다.");
        return;
    }

    try {
        // insert() : 새 댓글 추가
        // post_id에 현재 게시글 번호를 넣어 어느 글의 댓글인지 연결합니다.
        const { error } = await supabaseClient
            .from("comments")
            .insert({
                post_id: commentPostId,
                writer: writer,
                content: content,
            });

        if (error) {
            throw error;
        }

        // 입력창을 비웁니다.
        commentWriterEl.value = "";
        commentContentEl.value = "";

        // 등록 후 댓글 목록을 다시 조회하여 방금 쓴 댓글을 보여줍니다.
        await fetchComments();
    } catch (err) {
        console.error("댓글 등록 오류:", err);
        showCommentError(`댓글을 등록하지 못했습니다. (${err.message})`);
    }
}

// ===== 수정 모드 진입 (댓글 id로 조회) =====
async function enterEditMode(commentId) {
    hideCommentError();

    try {
        // select() + eq() : 수정할 댓글을 id로 조회
        // single()        : 결과를 하나의 객체로 받음
        const { data, error } = await supabaseClient
            .from("comments")
            .select("id, post_id, writer, content, created_at")
            .eq("id", commentId)
            .single();

        if (error) {
            throw error;
        }

        // 목록에 있는 해당 댓글을 최신 내용으로 갱신합니다.
        allComments = allComments.map((comment) =>
            comment.id === data.id ? data : comment
        );

        // 이 댓글을 "수정 중" 상태로 표시하고 다시 그립니다.
        editingCommentId = data.id;
        renderComments(allComments);
    } catch (err) {
        console.error("댓글 조회 오류:", err);
        showCommentError(`댓글을 불러오지 못했습니다. (${err.message})`);
    }
}

// ===== 수정 취소 =====
// 수정 상태를 해제하고 원래 목록 화면으로 되돌립니다.
function cancelEdit() {
    editingCommentId = null;
    renderComments(allComments);
}

// ===== 댓글 수정 저장 =====
async function saveEdit(commentId, newContent) {
    hideCommentError();

    // 수정할 내용의 앞뒤 공백을 제거합니다.
    const content = newContent.trim();

    // 내용이 비어 있으면 저장하지 않습니다.
    if (content === "") {
        showCommentError("댓글 내용을 입력해 주세요.");
        return;
    }

    try {
        // update() + eq() : id가 일치하는 댓글의 content를 수정
        const { error } = await supabaseClient
            .from("comments")
            .update({ content: content })
            .eq("id", commentId);

        if (error) {
            throw error;
        }

        // 수정 상태를 해제한 뒤, 목록을 다시 조회하여 최신 내용을 보여줍니다.
        editingCommentId = null;
        await fetchComments();
    } catch (err) {
        console.error("댓글 수정 오류:", err);
        showCommentError(`댓글을 수정하지 못했습니다. (${err.message})`);
    }
}

// ===== 댓글 삭제 =====
async function deleteComment(commentId) {
    // confirm() : "확인/취소" 창을 띄웁니다.
    // 사용자가 "취소"를 누르면 false가 되어 함수를 즉시 종료합니다.
    if (!confirm("댓글을 삭제하시겠습니까?")) {
        return;
    }

    hideCommentError();

    try {
        // delete() : 데이터를 삭제하는 명령
        // eq()     : id가 일치하는 댓글만 삭제
        const { error } = await supabaseClient
            .from("comments")
            .delete()
            .eq("id", commentId);

        if (error) {
            throw error;
        }

        // 삭제 후 목록을 다시 조회하여 화면을 최신 상태로 갱신합니다.
        await fetchComments();
    } catch (err) {
        // 오류 내용을 콘솔과 화면에 함께 표시합니다.
        console.error("댓글 삭제 오류:", err);
        showCommentError(`댓글을 삭제하지 못했습니다. (${err.message})`);
    }
}

// ===== 댓글 목록 영역의 버튼 클릭 처리 (이벤트 위임) =====
// 수정/저장/취소 버튼은 목록을 다시 그릴 때마다 새로 만들어지므로,
// 부모(commentListEl)에 이벤트를 한 번만 걸어 처리합니다.
commentListEl.addEventListener("click", (event) => {
    const target = event.target;

    // "수정" 버튼 클릭 → 해당 댓글을 수정 모드로 전환
    if (target.classList.contains("comment-edit-btn")) {
        const id = Number(target.dataset.id);
        enterEditMode(id);
        return;
    }

    // "저장" 버튼 클릭 → 같은 댓글의 textarea 값을 읽어 저장
    if (target.classList.contains("comment-save-btn")) {
        const id = Number(target.dataset.id);
        const textarea = commentListEl.querySelector(
            `.comment-edit-input[data-id="${id}"]`
        );
        saveEdit(id, textarea.value);
        return;
    }

    // "취소" 버튼 클릭 → 수정 모드 해제
    if (target.classList.contains("comment-cancel-btn")) {
        cancelEdit();
        return;
    }

    // "삭제" 버튼 클릭 → 확인 후 해당 댓글 삭제
    if (target.classList.contains("comment-delete-btn")) {
        const id = Number(target.dataset.id);
        deleteComment(id);
    }
});

// ===== 댓글 폼 제출 이벤트 연결 =====
commentFormEl.addEventListener("submit", createComment);

// ===== 페이지가 열리면 댓글 목록을 조회합니다. =====
fetchComments();
