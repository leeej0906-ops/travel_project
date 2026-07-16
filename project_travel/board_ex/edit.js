// ===== DOM 요소 가져오기 =====
const errorMessageEl = document.getElementById("error-message");
const editFormEl = document.getElementById("edit-form");
const titleEl = document.getElementById("title");
const writerEl = document.getElementById("writer");
const contentEl = document.getElementById("content");
const cancelBtnEl = document.getElementById("cancel-btn");

// ===== URL에서 게시글 id 추출 =====
// 예: edit.html?id=3  ->  postId = "3"
const params = new URLSearchParams(window.location.search);
const postId = params.get("id");

// ===== 오류 메시지 표시 / 숨김 =====
function showError(message) {
    errorMessageEl.textContent = message;
    errorMessageEl.hidden = false; // 오류 영역 보이기
}

function hideError() {
    errorMessageEl.textContent = "";
    errorMessageEl.hidden = true; // 오류 영역 숨기기
}

// ===== 기존 게시글 조회 =====
// URL의 id로 게시글을 불러와 입력창에 채워 넣습니다.
async function fetchPost() {
    hideError();

    // id가 없으면 수정할 대상이 없으므로 중단합니다.
    if (!postId) {
        showError("잘못된 접근입니다. 게시글 번호가 없습니다.");
        console.error("게시글 조회 오류: URL에 id 값이 없습니다.");
        return;
    }

    try {
        // select() : 필요한 컬럼만 조회
        // eq()     : id가 일치하는 행만 조회
        // single() : 결과를 배열이 아닌 하나의 객체로 받음
        const { data, error } = await supabaseClient
            .from("posts")
            .select("id, title, writer, content")
            .eq("id", postId)
            .single();

        // Supabase가 반환한 오류가 있으면 catch로 넘깁니다.
        if (error) {
            throw error;
        }

        // 조회한 값을 입력창에 채워 넣습니다.
        titleEl.value = data.title;
        writerEl.value = data.writer;
        contentEl.value = data.content;
    } catch (err) {
        console.error("게시글 조회 오류:", err);
        showError(`게시글을 불러오지 못했습니다. (${err.message})`);
    }
}

// ===== 게시글 수정 (저장) =====
async function updatePost(event) {
    // form의 기본 제출 동작(새로고침)을 막습니다.
    event.preventDefault();
    hideError();

    // 입력값의 앞뒤 공백을 제거합니다.
    const title = titleEl.value.trim();
    const writer = writerEl.value.trim();
    const content = contentEl.value.trim();

    // 빈 값이 있으면 저장하지 않고 안내합니다.
    if (title === "" || writer === "" || content === "") {
        showError("제목, 작성자, 내용을 모두 입력해 주세요.");
        return;
    }

    try {
        // update() : 전달한 값으로 데이터 수정
        // eq()     : id가 일치하는 행만 수정
        const { error } = await supabaseClient
            .from("posts")
            .update({ title, writer, content })
            .eq("id", postId);

        if (error) {
            throw error;
        }

        // 수정 완료 안내 후 목록 페이지로 이동합니다.
        alert("게시글이 수정되었습니다.");
        window.location.href = "list.html";
    } catch (err) {
        console.error("게시글 수정 오류:", err);
        showError(`게시글을 수정하지 못했습니다. (${err.message})`);
    }
}

// ===== 저장(폼 제출) 이벤트 연결 =====
editFormEl.addEventListener("submit", updatePost);

// ===== 취소 버튼 클릭 → 상세 페이지로 이동 =====
cancelBtnEl.addEventListener("click", () => {
    window.location.href = `detail.html?id=${postId}`;
});

// ===== 페이지가 열리면 기존 게시글을 불러옵니다. =====
fetchPost();
