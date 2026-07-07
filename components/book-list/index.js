export function init(element, options = {}) {
  const mode = element.dataset.mode || "currentLibrary";

  initBookList({
    mode,
    showBookCard: options.showBookCard
  });
}
// export function init(element) {
//   const mode = element.dataset.mode || "currentLibrary";

//   initBookList({
//     mode
//   });
// }

export async function initBookList({
  showBookCard,
  mode = "currentLibrary"
} = {}) {
  const bookList = document.getElementById("bookList");
  const CURRENT_LIBRARY = window.CURRENT_LIBRARY;
  const isAllMode = mode === "all";

  if (!bookList) return;

  bookList.classList.toggle("book-list-all", isAllMode);
  bookList.classList.toggle("book-list-filtered", !isAllMode);

  function getSideCount() {
    return Number(getComputedStyle(bookList).getPropertyValue("--side-count"));
  }

  function placeItems() {
    if (!isAllMode) return;

    const sideCount = getSideCount();
    const itemsPerRow = sideCount * 2;

    [...bookList.children].forEach((item, index) => {
      const positionInRow = index % itemsPerRow;

      item.style.gridColumn =
        positionInRow < sideCount
          ? positionInRow + 1
          : positionInRow + 2;
    });
  }

  function getVisibleBooks(books) {
    if (isAllMode) return books;

    return books.filter(book => {
      return Array.isArray(book.library) &&
        book.library.includes(CURRENT_LIBRARY);
    });
  }

  const renderers = {
    all(book) {
      const link = document.createElement("a");

      link.textContent = book.title;
      link.href = book.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.classList.add("book");

      link.addEventListener("mouseenter", () => {
        if (typeof showBookCard === "function") {
          showBookCard(book);
        }
      });
      
      return link;
    },

    currentLibrary(book) {
      const item = document.createElement("div");
      const handle = document.createElement("div");
      const title = document.createElement("div");

      let startX = 0;
      let startY = 0;
      let wasDragging = false;

      item.id = book.id;
      item.classList.add("book", "can-drag");
      item.setAttribute("can-mirror", "");

      handle.classList.add("drag-handle");

      title.classList.add("book-title");
      title.contentEditable = "true";
      title.spellcheck = false;
      title.textContent = book.title;

      item.append(handle, title);

      item.addEventListener("mousedown", (e) => {
        startX = e.clientX;
        startY = e.clientY;
        wasDragging = false;
      });

      item.addEventListener("mousemove", (e) => {
        const moved =
          Math.abs(e.clientX - startX) > 5 ||
          Math.abs(e.clientY - startY) > 5;

        if (moved) {
          wasDragging = true;
        }
      });

      item.addEventListener("click", (e) => {
        if (wasDragging) return;
        if (e.target === title) return;

        if (typeof showBookCard === "function") {
          showBookCard(book);
        }
      });

      // item.addEventListener("mouseover", () => {
      //   if (typeof showBookCard === "function") {
      //     showBookCard(book);
      //   }
      // });

      return item;
    }
  };

  async function loadBooks() {
    const res = await fetch("/books");
    const books = await res.json();

    const visibleBooks = getVisibleBooks(books);
    const renderer = renderers[mode] || renderers.currentLibrary;

    bookList.innerHTML = "";

    visibleBooks.forEach(book => {
      bookList.appendChild(renderer(book));
    });

    placeItems();
  }

  if (isAllMode) {
    window.addEventListener("resize", placeItems);
  }

  loadBooks();
}
