# 게시판 관리 프로그램 PRD (Product Requirements Document)

## 1. 문서 정보

| 항목 | 내용 |
|------|------|
| 문서명 | 게시판 관리 프로그램 제품 요구사항 정의서 |
| 버전 | v1.0 |
| 작성일 | 2026-07-14 |
| 대상 | 개발자 / 기획자 / 학습자 |

---

## 2. 개요 (Overview)

### 2.1 목적
HTML, CSS, JavaScript와 Supabase(PostgreSQL 기반 BaaS)를 이용하여
게시글과 댓글을 등록·조회·수정·삭제(CRUD)할 수 있는 웹 게시판을 제공한다.
별도의 백엔드 서버 없이 프론트엔드에서 Supabase JS SDK로 직접 데이터베이스에 접근한다.

### 2.2 배경
- 서버 구축 없이 빠르게 게시판 기능을 구현하고 학습할 수 있는 예제가 필요하다.
- 초보자가 이해할 수 있도록 파일을 기능별로 분리하고 주석을 충실히 작성한다.

### 2.3 범위 (Scope)
- **포함**: 게시글 CRUD, 댓글 CRUD, 검색, 정렬, 페이지네이션, 조회수 증가
- **미포함**: 회원가입/로그인(인증), 파일 첨부, 대댓글, 좋아요, 관리자 권한 분리

---

## 3. 사용자 및 이용 시나리오
ㅓㅡ ㅓㅡㅡ
### 3.1 사용자 정의
- **일반 사용자**: 게시글과 댓글을 자유롭게 작성/조회/수정/삭제한다.
  (현재 버전은 로그인 없이 누구나 모든 기능을 사용할 수 있다.)

### 3.2 대표 시나리오
1. 사용자가 게시판 목록에서 원하는 글을 검색하거나 정렬하여 찾는다.
2. 글 제목을 클릭해 상세 내용을 확인한다. (조회 시 조회수 1 증가)
3. 새 글을 작성하거나, 기존 글을 수정/삭제한다.
4. 게시글 하단에서 댓글을 작성하고, 자신이 쓴 댓글을 수정/삭제한다.

---

## 4. 기능 요구사항 (Functional Requirements)

### 4.1 게시글 목록 (list.html / list.js)

| ID | 기능 | 상세 내용 |
|----|------|-----------|
| P-L-01 | 목록 조회 | posts 테이블의 게시글을 표(번호/제목/작성자/조회수/작성일)로 표시 |
| P-L-02 | 검색 | 제목 **또는** 작성자로 검색. 일부 문자만 입력해도 부분 일치(ilike) 조회 |
| P-L-03 | 정렬 | 최신순(기본값) / 오래된순 / 조회수순 선택 |
| P-L-04 | 페이지네이션 | 한 페이지 10건. 하단 footer에 이전/다음 버튼, `현재/전체` 페이지 표시 |
| P-L-05 | 전체보기 | 검색어를 비우고 1페이지부터 전체 목록 재조회 |
| P-L-06 | 글쓰기 이동 | 상단 "글쓰기" 버튼으로 write.html 이동 |
| P-L-07 | 상세 이동 | 제목 클릭 시 detail.html?id=... 이동 |

### 4.2 게시글 작성 (write.html / write.js)

| ID | 기능 | 상세 내용 |
|----|------|-----------|
| P-W-01 | 글 작성 | 제목, 작성자, 내용 입력 |
| P-W-02 | 필수 검증 | 제목·작성자·내용 미입력 시 오류 메시지 표시 |
| P-W-03 | 저장 | posts 테이블에 insert 후 "등록되었습니다" 안내 → 목록 이동 |

### 4.3 게시글 상세 (detail.html / detail.js)

| ID | 기능 | 상세 내용 |
|----|------|-----------|
| P-D-01 | 상세 조회 | URL의 id로 단일 게시글 조회 (제목/작성자/내용/조회수/등록일) |
| P-D-02 | 조회수 증가 | 조회 시 view_count 1 증가 |
| P-D-03 | 수정 이동 | "수정" 버튼 → edit.html?id=... 이동 |
| P-D-04 | 삭제 | "삭제" 버튼 → 확인 후 삭제 → 목록 이동 |
| P-D-05 | 목록 이동 | "목록" 버튼 → list.html 이동 |

### 4.4 게시글 수정 (edit.html / edit.js)

| ID | 기능 | 상세 내용 |
|----|------|-----------|
| P-E-01 | 기존 값 조회 | URL의 id로 게시글을 불러와 입력창에 채움 |
| P-E-02 | 수정 저장 | 제목·작성자·내용 수정 후 update → "수정되었습니다" 안내 → 목록 이동 |
| P-E-03 | 취소 | 상세 페이지(detail.html)로 이동 |

### 4.5 댓글 (detail.html / comment.js)

| ID | 기능 | 상세 내용 |
|----|------|-----------|
| C-01 | 댓글 목록 | 해당 게시글(post_id)의 댓글을 등록일 오름차순으로 조회 |
| C-02 | 댓글 등록 | 작성자·내용 입력 후 insert → 목록 재조회 (필수값 검증) |
| C-03 | 댓글 수정 | "수정" 버튼 → 인라인 편집(내용) → update → 목록 재조회 |
| C-04 | 댓글 삭제 | "삭제" 버튼 → 확인 후 delete → 목록 재조회 |

---

## 5. 비기능 요구사항 (Non-Functional Requirements)

| 구분 | 요구사항 |
|------|----------|
| 오류 처리 | 모든 DB 작업 실패 시 화면(빨간 박스)과 콘솔에 오류 메시지 출력 |
| 보안(XSS) | 사용자 입력값은 textContent / escape 처리 후 렌더링 |
| 코드 구조 | HTML / CSS / JavaScript 파일 분리, 기능별 JS 파일 분리 |
| 가독성 | 초보자가 이해할 수 있도록 단계별 한글 주석 작성 |
| 비동기 처리 | 모든 Supabase 호출은 async/await 사용 |
| 반응형 | 640px 이하 모바일 화면 대응(일부 컬럼 숨김 등) |

---

## 6. 데이터 모델 (Database)

### 6.1 posts 테이블

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, IDENTITY | 게시글 번호(자동 증가) |
| title | VARCHAR(50) | NOT NULL | 제목 |
| writer | VARCHAR(50) | NOT NULL | 작성자 |
| content | TEXT | NOT NULL | 내용 |
| view_count | INTEGER | NOT NULL, DEFAULT 0 | 조회수 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 등록일 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 수정일 |

### 6.2 comments 테이블

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | BIGINT | PK, IDENTITY | 댓글 번호(자동 증가) |
| post_id | BIGINT | NOT NULL, FK → posts(id) ON DELETE CASCADE | 게시글 번호(게시글 삭제 시 댓글 자동 삭제) |
| writer | VARCHAR(50) | NOT NULL | 작성자 |
| content | TEXT | NOT NULL | 댓글 내용 |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 등록일 |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 수정일 |

> RLS(Row Level Security): 두 테이블 모두 공개 SELECT/INSERT/UPDATE/DELETE 정책 적용
> (인증 없이 사용하는 학습용 구성)

---

## 7. 기술 스택 (Tech Stack)

| 구분 | 기술 |
|------|------|
| 프론트엔드 | HTML5, CSS3, Vanilla JavaScript (프레임워크 미사용) |
| 백엔드/DB | Supabase (PostgreSQL) |
| 연동 | Supabase JS SDK v2 (CDN) |
| API 사용 | select(), insert(), update(), delete(), eq(), or(), ilike(), order(), range(), single() |

---

## 8. 파일 구성 (File Structure)

| 파일 | 역할 |
|------|------|
| list.html | 게시글 목록 화면 |
| list.js | 목록 조회 / 검색 / 정렬 / 페이지네이션 |
| write.html / write.js | 게시글 작성 |
| detail.html / detail.js | 게시글 상세 / 조회수 / 삭제 |
| edit.html / edit.js | 게시글 수정 |
| comment.js | 댓글 등록 / 조회 / 수정 / 삭제 |
| supabase.js | Supabase 클라이언트 설정(공용) |
| style.css | 전체 공통 스타일 |
| posts.sql | posts / comments 테이블 생성 SQL |

---

## 9. 향후 개선 과제 (Future Work)

- 로그인/회원 인증 및 본인 글/댓글만 수정·삭제 권한 제한
- 조회수 동시성 처리(RPC increment 함수로 정확한 카운트)
- 파일/이미지 첨부 (Supabase Storage)
- 대댓글, 좋아요, 신고 기능
- 관리자 페이지 및 게시글 카테고리 분류
