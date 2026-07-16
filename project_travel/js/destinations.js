/* =========================================================
   여행지소개 페이지
   - 전체 여행지 목록 렌더링
   - 테마 필터 + 히어로에서 넘어온 검색어(region / q) 반영
   ========================================================= */

// 여행지 데이터 (이미지 대신 그라디언트 썸네일 클래스 사용)
const DESTINATIONS = [
  {
    name: "제주도", region: "제주", themes: ["sea", "nature"], thumb: "thumb-jeju",
    desc: "에메랄드빛 바다와 오름, 사계절 내내 아름다운 힐링 섬.",
    tags: ["바다", "드라이브", "힐링"],
  },
  {
    name: "부산", region: "경상", themes: ["sea", "food"], thumb: "thumb-busan",
    desc: "해운대와 광안리, 낭만 가득한 대한민국 대표 바다 도시.",
    tags: ["바다", "야경", "먹방"],
  },
  {
    name: "경주", region: "경상", themes: ["history"], thumb: "thumb-gyeongju",
    desc: "천년 신라의 숨결이 살아있는 노천 역사 박물관.",
    tags: ["역사", "문화", "야경"],
  },
  {
    name: "강릉", region: "강원", themes: ["sea", "food"], thumb: "thumb-gangneung",
    desc: "푸른 동해와 커피 향 가득한 감성 바다 여행지.",
    tags: ["바다", "카페", "기차여행"],
  },
  {
    name: "여수", region: "전라", themes: ["sea", "food"], thumb: "thumb-yeosu",
    desc: "밤바다의 낭만과 케이블카, 반짝이는 남해의 보석.",
    tags: ["바다", "야경", "해산물"],
  },
  {
    name: "전주", region: "전라", themes: ["history", "food"], thumb: "thumb-jeonju",
    desc: "한옥마을과 비빔밥, 전통과 맛이 어우러진 미식 도시.",
    tags: ["한옥", "맛집", "전통"],
  },
  {
    name: "서울", region: "수도권", themes: ["history", "food"], thumb: "thumb-seoul",
    desc: "고궁부터 트렌디한 거리까지, 과거와 현재가 공존하는 수도.",
    tags: ["도심", "쇼핑", "고궁"],
  },
  {
    name: "안동", region: "경상", themes: ["history"], thumb: "thumb-andong",
    desc: "하회마을과 전통 유교 문화가 살아 숨 쉬는 정신문화의 수도.",
    tags: ["전통", "한옥", "역사"],
  },
  {
    name: "통영", region: "경상", themes: ["sea", "food"], thumb: "thumb-tongyeong",
    desc: "한려수도의 절경과 싱싱한 해산물이 가득한 남해의 나폴리.",
    tags: ["바다", "케이블카", "해산물"],
  },
  {
    name: "속초", region: "강원", themes: ["sea", "nature"], thumb: "thumb-sokcho",
    desc: "설악산과 동해가 어우러진 산과 바다를 함께 즐기는 여행지.",
    tags: ["바다", "설악산", "먹거리"],
  },
  {
    name: "포항", region: "경상", themes: ["sea", "food"], thumb: "thumb-pohang",
    desc: "호미곶 일출과 영일대 해변, 과메기의 고장.",
    tags: ["일출", "바다", "해산물"],
  },
  {
    name: "담양", region: "전라", themes: ["nature"], thumb: "thumb-damyang",
    desc: "죽녹원 대나무 숲과 메타세쿼이아 길, 초록빛 힐링 명소.",
    tags: ["자연", "숲길", "힐링"],
  },
];

const listEl = document.getElementById("dest-list");
const infoEl = document.getElementById("result-info");
const filterBar = document.getElementById("filter-bar");

let currentTheme = "all";
let searchRegion = "";
let searchKeyword = "";

/* ---------- 카드 HTML 생성 ---------- */
function cardHTML(d) {
  const tags = d.tags.map((t) => `<span class="tag">#${t}</span>`).join("");
  return `
    <div class="dest-card">
      <div class="dest-thumb ${d.thumb}">${d.name}</div>
      <div class="dest-body">
        <h3>${d.name} <span style="font-size:.8rem;font-weight:600;color:var(--color-text-sub)">· ${d.region}</span></h3>
        <p class="desc">${d.desc}</p>
        <div class="tags">${tags}</div>
      </div>
    </div>`;
}

/* ---------- 목록 렌더링 (필터 + 검색 적용) ---------- */
function render() {
  const kw = searchKeyword.toLowerCase();

  const filtered = DESTINATIONS.filter((d) => {
    // 테마 필터
    if (currentTheme !== "all" && !d.themes.includes(currentTheme)) return false;
    // 지역 필터
    if (searchRegion && d.region !== searchRegion) return false;
    // 키워드 검색 (이름 / 설명 / 태그)
    if (kw) {
      const haystack = (d.name + " " + d.desc + " " + d.tags.join(" ")).toLowerCase();
      if (!haystack.includes(kw)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    listEl.innerHTML = `<p class="empty-msg">조건에 맞는 여행지가 없습니다. 다른 조건으로 검색해 보세요.</p>`;
  } else {
    listEl.innerHTML = filtered.map(cardHTML).join("");
  }

  // 결과 안내 문구
  const parts = [];
  if (searchRegion) parts.push(`지역: ${searchRegion}`);
  if (searchKeyword) parts.push(`검색어: "${searchKeyword}"`);
  const cond = parts.length ? ` (${parts.join(", ")})` : "";
  infoEl.textContent = `총 ${filtered.length}곳의 여행지${cond}`;
}

/* ---------- 테마 필터 버튼 ---------- */
filterBar.addEventListener("click", (e) => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  currentTheme = btn.dataset.theme;
  filterBar.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("is-active"));
  btn.classList.add("is-active");
  render();
});

/* ---------- 초기화: URL 쿼리 반영 ---------- */
(function init() {
  const params = new URLSearchParams(window.location.search);
  searchRegion = params.get("region") || "";
  searchKeyword = params.get("q") || "";

  const theme = params.get("theme");
  if (theme) {
    const btn = filterBar.querySelector(`.filter-btn[data-theme="${theme}"]`);
    if (btn) {
      currentTheme = theme;
      filterBar.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
    }
  }

  render();
})();

/* ---------- 햄버거 메뉴 토글 ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("nav-toggle");
  const menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }
});
