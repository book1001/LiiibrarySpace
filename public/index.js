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


// ======================================================
// Input Border Underline
// ======================================================
function fillInputBorder(el) {
  const width = el.getBoundingClientRect().width;

  if (width <= 0) {
    requestAnimationFrame(() => fillInputBorder(el));
    return;
  }

  const style = getComputedStyle(el);
  const test = document.createElement("span");

  test.style.position = "fixed";
  test.style.left = "-99999px";
  test.style.top = "-99999px";
  test.style.visibility = "hidden";
  test.style.pointerEvents = "none";
  test.style.whiteSpace = "nowrap";

  test.style.fontFamily = style.fontFamily;
  test.style.fontSize = style.fontSize;
  test.style.fontWeight = style.fontWeight;
  test.style.fontStyle = style.fontStyle;
  test.style.fontStretch = style.fontStretch;
  test.style.letterSpacing = style.letterSpacing;

  document.body.appendChild(test);

  let text = "_";
  test.textContent = text;

  while (test.getBoundingClientRect().width <= width) {
    text += "_";
    test.textContent = text;
  }

  el.textContent = text.slice(0, -1);

  test.remove();
}

const inputBorderObserver = new ResizeObserver(entries => {
  entries.forEach(entry => {
    fillInputBorder(entry.target);
  });
});

function initInputBorders() {
  document.querySelectorAll(".input-border").forEach(el => {
    if (el.dataset.borderObserved) return;

    el.dataset.borderObserved = "true";

    inputBorderObserver.observe(el);

    requestAnimationFrame(() => {
      fillInputBorder(el);
    });
  });
}

document.fonts.ready.then(() => {
  initInputBorders();

  requestAnimationFrame(() => {
    initInputBorders();
  });
});

window.addEventListener("load", initInputBorders);
window.addEventListener("resize", initInputBorders);

const mutationObserver = new MutationObserver(() => {
  initInputBorders();
});

mutationObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// function fillInputBorder(el) {
//   const width = el.clientWidth;

//   if (!width) return;

//   const test = document.createElement("span");
//   const style = getComputedStyle(el);

//   test.style.position = "absolute";
//   test.style.visibility = "hidden";
//   test.style.whiteSpace = "nowrap";
//   test.style.fontFamily = style.fontFamily;
//   test.style.fontSize = style.fontSize;
//   test.style.fontWeight = style.fontWeight;
//   test.style.letterSpacing = style.letterSpacing;

//   document.body.appendChild(test);

//   let text = "_";
//   test.textContent = text;

//   while (test.getBoundingClientRect().width <= width) {
//     text += "_";
//     test.textContent = text;
//   }

//   el.textContent = text.slice(0, -1);

//   test.remove();
// }

// document.fonts.ready.then(() => {
//   const observer = new ResizeObserver(entries => {
//     entries.forEach(entry => {
//       fillInputBorder(entry.target);
//     });
//   });

//   document.querySelectorAll(".input-border").forEach(el => {
//     fillInputBorder(el);
//     observer.observe(el);
//   });
// });
