// ===== DOM 요소 가져오기 =====
// 폼과 입력창, 오류 메시지 영역을 미리 찾아둡니다.
const writeFormEl = document.getElementById("write-form");
const titleEl = document.getElementById("title");
const writerEl = document.getElementById("writer");
const contentEl = document.getElementById("content");
const errorMessageEl = document.getElementById("error-message");

// ===== 오류 메시지 표시 함수 =====
// 화면에 빨간 오류 박스를 보여줍니다.
function showError(message) {
    errorMessageEl.textContent = message;
    errorMessageEl.hidden = false;
}

// ===== 오류 메시지 숨김 함수 =====
function hideError() {
    errorMessageEl.textContent = "";
    errorMessageEl.hidden = true;
}

// ===== 폼 제출(저장 버튼 클릭) 이벤트 처리 =====
// async 함수로 만들어 await로 Supabase 응답을 기다립니다.
writeFormEl.addEventListener("submit", async (event) => {
    // 폼의 기본 동작(페이지 새로고침)을 막습니다.
    event.preventDefault();

    // 이전 오류 메시지를 지웁니다.
    hideError();

    // 입력값을 가져오고 앞뒤 공백을 제거합니다.
    const title = titleEl.value.trim();
    const writer = writerEl.value.trim();
    const content = contentEl.value.trim();

    // ===== 필수 입력값 검증 =====
    // 하나라도 비어 있으면 오류 메시지를 보여주고 중단합니다.
    if (title === "" || writer === "" || content === "") {
        showError("제목, 작성자, 내용을 모두 입력해주세요.");
        return;
    }

    try {
        // ===== Supabase에 게시글 저장(insert) =====
        // posts 테이블에 title, writer, content 값을 넣습니다.
        // id, view_count, created_at 등은 DB 기본값으로 자동 채워집니다.
        const { error } = await supabaseClient
            .from("posts")
            .insert([{ title, writer, content }]);

        // 오류가 있으면 catch로 넘깁니다.
        if (error) {
            throw error;
        }

        // ===== 등록 성공 =====
        alert("게시글이 등록되었습니다.");
        // 목록 페이지로 이동합니다.
        window.location.href = "list.html";
    } catch (err) {
        // ===== 오류 처리 =====
        // 콘솔(개발자 도구)과 화면에 모두 오류를 출력합니다.
        console.error("게시글 등록 오류:", err);
        showError(`게시글 등록에 실패했습니다. (${err.message})`);
    }
});
