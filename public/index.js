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