// =====================================================================
// 이미지 등록 / 수정 페이지
//   Supabase 클라이언트(db)는 supabase.js 에서 생성됩니다.
//   URL에 ?id=<번호> 가 있으면 "수정 모드"로 동작합니다.
// =====================================================================
const BUCKET = "gallery-image";

// DOM 요소
const pageTitle = document.querySelector(".page-title");
const form = document.getElementById("upload-form");
const titleInput = document.getElementById("title");
const descInput = document.getElementById("description");
const imageInput = document.getElementById("image");
const previewWrap = document.getElementById("preview-wrap");
const preview = document.getElementById("preview");
const submitBtn = document.getElementById("submit-btn");
const messageEl = document.getElementById("message");

// 수정 모드 상태
const editId = new URLSearchParams(location.search).get("id");
const isEditMode = !!editId;
let currentImageName = null; // 수정 시 기존 파일명 (교체되면 이전 파일 삭제용)

// -------------------------------------------------------------
// 파일 선택 시 이미지 미리보기
// -------------------------------------------------------------
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (!file) {
    previewWrap.hidden = true;
    preview.removeAttribute("src");
    return;
  }
  preview.src = URL.createObjectURL(file);
  previewWrap.hidden = false;
});

// -------------------------------------------------------------
// 메시지 표시 유틸
// -------------------------------------------------------------
function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = "message" + (type ? " " + type : "");
}

// -------------------------------------------------------------
// Storage 업로드 → Public URL 반환
// -------------------------------------------------------------
async function uploadImage(file) {
  const ext = file.name.split(".").pop();
  const imageName = `${Date.now()}_${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await db.storage
    .from(BUCKET)
    .upload(imageName, file, { cacheControl: "3600", upsert: false });
  if (uploadError) throw uploadError;

  const { data } = db.storage.from(BUCKET).getPublicUrl(imageName);
  return { imageName, imageUrl: data.publicUrl };
}

// -------------------------------------------------------------
// 수정 모드 : 기존 데이터 불러오기
// -------------------------------------------------------------
async function loadForEdit() {
  // 화면 문구를 수정용으로 변경
  document.title = "이미지 수정";
  pageTitle.textContent = "이미지 수정";
  submitBtn.textContent = "수정";
  // 수정 시 이미지 파일은 선택하지 않으면 기존 이미지 유지
  imageInput.removeAttribute("required");

  try {
    const { data, error } = await db
      .from("gallery")
      .select("title, description, image_name, image_url")
      .eq("id", editId)
      .single();

    if (error) throw error;

    titleInput.value = data.title || "";
    descInput.value = data.description || "";
    currentImageName = data.image_name;

    // 기존 이미지 미리보기 표시
    preview.src = data.image_url;
    previewWrap.hidden = false;
  } catch (err) {
    console.error(err);
    showMessage("데이터를 불러오지 못했습니다: " + (err.message || err), "error");
  }
}

// -------------------------------------------------------------
// 폼 제출 : 등록(INSERT) 또는 수정(UPDATE)
// -------------------------------------------------------------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = titleInput.value.trim();
  const description = descInput.value.trim();
  const file = imageInput.files[0];

  // 등록 모드에서는 이미지 필수, 수정 모드에서는 선택
  if (!title || (!isEditMode && !file)) {
    showMessage("제목과 이미지 파일은 필수입니다.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = isEditMode ? "수정 중..." : "등록 중...";
  showMessage("처리 중입니다...", "");

  try {
    if (isEditMode) {
      // ---------- 수정 ----------
      const updateData = { title, description: description || null };
      let oldImageToRemove = null;

      // 새 파일을 선택한 경우에만 이미지 교체
      if (file) {
        const { imageName, imageUrl } = await uploadImage(file);
        updateData.image_name = imageName;
        updateData.image_url = imageUrl;
        oldImageToRemove = currentImageName;
      }

      const { error: updateError } = await db
        .from("gallery")
        .update(updateData)
        .eq("id", editId);
      if (updateError) throw updateError;

      // 이미지를 교체했다면 이전 Storage 파일 삭제
      if (oldImageToRemove) {
        await db.storage.from(BUCKET).remove([oldImageToRemove]);
      }

      showMessage("수정되었습니다. 목록 조회 버튼을 눌러 확인하세요.", "success");
    } else {
      // ---------- 등록 ----------
      const { imageName, imageUrl } = await uploadImage(file);

      const { error: insertError } = await db.from("gallery").insert({
        title,
        image_name: imageName,
        image_url: imageUrl,
        description: description || null,
      });
      if (insertError) throw insertError;

      showMessage("이미지가 성공적으로 등록되었습니다. 목록 조회 버튼을 눌러 확인하세요.", "success");
      form.reset();
      previewWrap.hidden = true;
      preview.removeAttribute("src");
    }
    // 목록 조회 버튼은 항상 화면에 표시되어 있으므로 별도 처리 불필요
  } catch (err) {
    console.error(err);
    showMessage((isEditMode ? "수정" : "등록") + " 실패: " + (err.message || err), "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = isEditMode ? "수정" : "등록";
  }
});

// 수정 모드면 기존 데이터 로드
if (isEditMode) {
  loadForEdit();
}
