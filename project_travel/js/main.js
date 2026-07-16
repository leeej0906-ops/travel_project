/* =========================================================
   메인 페이지 인터랙션
   - 모바일 햄버거 메뉴 토글
   - 히어로 검색 → 여행지소개 페이지로 이동
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  /* ---------- 햄버거 메뉴 토글 ---------- */
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
    });

    // 메뉴 링크 클릭 시 메뉴 닫기
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- 히어로 검색 ---------- */
  const form = document.getElementById("search-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const region = document.getElementById("search-region").value.trim();
      const keyword = document.getElementById("search-input").value.trim();

      // 검색 조건을 쿼리스트링으로 담아 여행지소개 페이지로 이동
      const params = new URLSearchParams();
      if (region) params.set("region", region);
      if (keyword) params.set("q", keyword);

      const query = params.toString();
      window.location.href = "destinations.html" + (query ? "?" + query : "");
    });
  }
});
