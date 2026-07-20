// ==============================================
// 1. Component HTML 먼저 불러오기
// ==============================================
// const components = document.querySelectorAll("[data-component]");

// for (const element of components) {
//   const componentName = element.dataset.component;

//   const html = await fetch(`/components/${componentName}/index.html`)
//     .then(res => res.text());

//   element.innerHTML = html;
// }
// // ==============================================
// // innerHTML/JS Fetch
// // ==============================================
const components = document.querySelectorAll("[data-component]");

for (const element of components) {
  const componentName = element.dataset.component;

  const html = await fetch(`/components/${componentName}/index.html`)
    .then(res => res.text());

  element.innerHTML = html;

  const module = await import(`/components/${componentName}/index.js`);

  if (module.init) {
    module.init(element);
  }
}


// ==============================================
// 2. Book Card 초기화
// ==============================================
import { initBookCard } from "/components/book-card/index.js";
import { initBookList } from "/components/book-list/index.js";

const bookCard = initBookCard();


// ==============================================
// 3. Book List 초기화
// ==============================================
const bookListComponent = document.querySelector('[data-component="book-list"]');

if (bookListComponent) {
  const mode = bookListComponent.dataset.mode || "currentLibrary";

  initBookList({
    mode,
    showBookCard: bookCard.showBookCard
  });
}

// ==============================================
// Book List + Book Card
// ==============================================
// import { initBookCard } from "/components/book-card/index.js";
// // import { initBookList } from "/components/book-list/index.js";

// const bookCard = initBookCard();

// // initBookList({
// //   showBookCard: bookCard.showBookCard
// // });



// ======================================================
// Addbook
// ======================================================
const addBookBtn = document.getElementById("addbook");
const submitField = document.getElementById("addbook-submitField");

const currentLibrary = window.CURRENT_LIBRARY;
const isLibraryPage = Boolean(currentLibrary);

const storageKey = isLibraryPage
  ? `submitFieldOpen:${currentLibrary}`
  : null;

// 요소가 없는 페이지에서는 실행 중단
if (addBookBtn && submitField) {
  // ----------------------------------------------------
  // 초기 상태
  // ----------------------------------------------------
  let isOpen;

  if (isLibraryPage) {
    // 저장된 상태가 없으면 기본값은 열림
    const saved = localStorage.getItem(storageKey);

    isOpen =
      saved === null
        ? true
        : saved === "true";
  } else {
    // index.html 기본값은 닫힘
    isOpen = false;
  }

  submitField.classList.toggle("is-open", isOpen);
  addBookBtn.textContent = isOpen ? "close" : "add";

  // ----------------------------------------------------
  // 버튼 클릭
  // ----------------------------------------------------
  addBookBtn.addEventListener("click", () => {
    isOpen = submitField.classList.toggle("is-open");

    addBookBtn.textContent =
      isOpen ? "close" : "add";

    // 각 라이브러리에서만 상태 저장
    if (isLibraryPage) {
      localStorage.setItem(
        storageKey,
        String(isOpen)
      );
    }
  });
}

// const addBookBtn = document.getElementById("addbook");
// const submitField = document.getElementById("addbook-submitField");

// const isLibraryPage = typeof CURRENT_LIBRARY !== "undefined";
// const storageKey = `submitFieldOpen:${CURRENT_LIBRARY || "index"}`;

// // ----------------------------------------------------
// // 초기 상태
// // ----------------------------------------------------
// let isOpen;

// if (isLibraryPage) {
//   // 저장된 상태가 있으면 사용, 없으면 기본값 = 열림
//   const saved = localStorage.getItem(storageKey);
//   isOpen = saved === null ? true : saved === "true";
// } else {
//   // index.html은 항상 기본값 = 닫힘
//   isOpen = false;
// }

// submitField.classList.toggle("is-open", isOpen);
// addBookBtn.textContent = isOpen ? "close" : "add";

// // ----------------------------------------------------
// // 버튼 클릭
// // ----------------------------------------------------
// addBookBtn.addEventListener("click", () => {
//   isOpen = submitField.classList.toggle("is-open");
//   addBookBtn.textContent = isOpen ? "close" : "add";

//   // 라이브러리 페이지에서만 상태 저장
//   if (isLibraryPage) {
//     localStorage.setItem(storageKey, isOpen);
//   }
// });