// =====================================================================
// 갤러리 목록 : gallery 테이블 조회 → 표로 출력 + 수정/삭제
//   Supabase 클라이언트(db)는 supabase.js 에서 생성됩니다.
// =====================================================================

const BUCKET = "gallery-image";

const tbody = document.getElementById("gallery-body");
const messageEl = document.getElementById("message");

// -------------------------------------------------------------
// 등록일 포맷 : YYYY. MM. DD. 오전/오후 HH:MM:SS
// -------------------------------------------------------------
function formatDate(value) {
  const date = new Date(value);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

// -------------------------------------------------------------
// HTML 이스케이프 (제목에 특수문자가 있어도 안전하게 출력)
// -------------------------------------------------------------
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = "message" + (type ? " " + type : "");
}

// -------------------------------------------------------------
// 목록 조회 및 렌더링
// -------------------------------------------------------------
async function loadGallery() {
  try {
    const { data, error } = await db
      .from("gallery")
      .select("id, title, image_name, image_url, description, created_at")
      .order("created_at", { ascending: false }); // 최신순 정렬

    if (error) throw error;

    if (!data || data.length === 0) {
      tbody.innerHTML = "";
      showMessage("등록된 이미지가 없습니다.", "");
      return;
    }

    showMessage("", "");
    tbody.innerHTML = data
      .map(
        (item) => `
        <tr data-id="${item.id}"
            data-name="${escapeHtml(item.image_name)}"
            data-title="${escapeHtml(item.title)}"
            data-description="${escapeHtml(item.description)}">
          <td>${escapeHtml(item.title)}</td>
          <td><img class="thumb" src="${item.image_url}" alt="${escapeHtml(item.title)}" /></td>
          <td>${formatDate(item.created_at)}</td>
          <td class="actions">
            <button type="button" class="btn btn-edit" data-action="edit">수정</button>
            <button type="button" class="btn btn-delete" data-action="delete">삭제</button>
          </td>
        </tr>`
      )
      .join("");
  } catch (err) {
    console.error(err);
    showMessage("목록을 불러오지 못했습니다: " + (err.message || err), "error");
  }
}

// -------------------------------------------------------------
// 수정/삭제 버튼 이벤트 (이벤트 위임)
// -------------------------------------------------------------
tbody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const row = btn.closest("tr");
  const id = Number(row.dataset.id);

  if (btn.dataset.action === "edit") {
    // 업로드(수정) 화면으로 이동 — 이미지 파일까지 변경 가능
    window.location.href = `upload.html?id=${id}`;
  } else if (btn.dataset.action === "delete") {
    deleteItem(id, row.dataset.name);
  }
});

// -------------------------------------------------------------
// 삭제 : Storage 파일 + 테이블 행 함께 삭제
// -------------------------------------------------------------
async function deleteItem(id, imageName) {
  if (!confirm("정말 삭제하시겠습니까?")) return;

  try {
    // 1) Storage 파일 삭제
    if (imageName) {
      const { error: storageError } = await db.storage
        .from(BUCKET)
        .remove([imageName]);
      if (storageError) throw storageError;
    }

    // 2) 테이블 행 삭제
    const { error: dbError } = await db.from("gallery").delete().eq("id", id);
    if (dbError) throw dbError;

    alert("삭제되었습니다.");
    await loadGallery();
  } catch (err) {
    console.error(err);
    alert("삭제 실패: " + (err.message || err));
  }
}

loadGallery();
