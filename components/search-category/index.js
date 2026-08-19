import { initBookCard } from "../book-card/index.js";

const bookCardController = initBookCard();
const titleBtn = document.getElementById("titleBtn"), authorBtn = document.getElementById("authorBtn"), libraryBtn = document.getElementById("libraryBtn");
const titleDropdown = document.getElementById("titleDropdown"), authorDropdown = document.getElementById("authorDropdown"), allLibraryDropdown = document.getElementById("allLibraryDropdown");

let books = [], libraries = [];

async function loadIndexes() {
  const [bookRes, libraryRes] = await Promise.all([
    fetch("/books"),
    fetch("/libraries")
  ]);

  books = await bookRes.json();
  libraries = await libraryRes.json();

  buildTitleDropdown();
  buildAuthorDropdown();
  buildLibraryDropdown();
}

loadIndexes();

// ====================================
// Title
// ====================================

function buildTitleDropdown() {
  const titleBooksMap = new Map();

  books.forEach(book => {
    if (!book.title) return;

    if (!titleBooksMap.has(book.title)) {
      titleBooksMap.set(book.title, []);
    }

    titleBooksMap.get(book.title).push(book);
  });

  const sortedTitles = [...titleBooksMap.keys()].sort((a, b) =>
    a.localeCompare(b, undefined, {
      sensitivity: "base"
    })
  );

  titleDropdown.innerHTML = "";

  sortedTitles.forEach(title => {
    const booksByTitle = titleBooksMap.get(title);

    booksByTitle.forEach(book => {
      const item = document.createElement("div");
      const authors = getBookAuthors(book).join(", ");

      item.className = "dropdown-item";

      item.innerHTML = booksByTitle.length > 1
        ? `${title}<span class="searchSub">${authors}</span>`
        : title;

      item.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();

        bookCardController.showBookCard(book);

        titleDropdown.classList.remove("open");
      });

      titleDropdown.appendChild(item);
    });
  });
}

// ====================================
// Author
// ====================================

function getBookAuthors(book) {
  if (!book.author) return [];

  if (Array.isArray(book.author)) {
    return book.author
      .map(author => String(author).trim())
      .filter(Boolean);
  }

  if (typeof book.author === "string") {
    return book.author
      .split("+")
      .map(author => author.trim())
      .filter(Boolean);
  }

  return [];
}

function buildAuthorDropdown() {
  const authorBooksMap = new Map();

  books.forEach(book => {
    const authors = getBookAuthors(book);

    authors.forEach(author => {
      if (!authorBooksMap.has(author)) {
        authorBooksMap.set(author, []);
      }

      authorBooksMap.get(author).push(book);
    });
  });

  const sortedAuthors = [...authorBooksMap.keys()].sort((a, b) =>
    a.localeCompare(b, undefined, {
      sensitivity: "base"
    })
  );

  authorDropdown.innerHTML = "";

  sortedAuthors.forEach(author => {
    const booksByAuthor = authorBooksMap.get(author);

    booksByAuthor.forEach(book => {
      const item = document.createElement("div");

      item.className = "dropdown-item";

      item.innerHTML = booksByAuthor.length > 1
        ? `${author}<span class="searchSub">${book.title}</span>`
        : author;

      item.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();

        bookCardController.showBookCard(book);

        authorDropdown.classList.remove("open");
      });

      authorDropdown.appendChild(item);
    });
  });
}

// ====================================
// Library
// ====================================

function buildLibraryDropdown() {
  const sortedLibraries = libraries
    .filter(library => library.libraryName)
    .sort((a, b) =>
      a.libraryName.localeCompare(b.libraryName)
    );

  allLibraryDropdown.innerHTML = "";

  sortedLibraries.forEach(library => {
    const item = document.createElement("div");

    item.className = "dropdown-item";

    item.textContent =
      library.libraryName +
      (library.bookSharing === "private" ? " ❋" : "");

    item.addEventListener("click", e => {
      e.preventDefault();
      e.stopPropagation();

      openLibrary(library);

      allLibraryDropdown.classList.remove("open");
    });

    allLibraryDropdown.appendChild(item);
  });
}

// ====================================
// Library: Open URL
// ====================================

function openLibrary(library) {
  if (!library?.libraryName) return;

  const libraryURL = `/${encodeURIComponent(library.libraryName)}/`;

  window.open(
    libraryURL,
    "_blank",
    "width=1280,height=900,left=200,top=100,resizable=yes,scrollbars=yes"
  );
}

// ====================================
// 드롭다운 열고 닫기
// ====================================

function closeAll(exceptMenu = null) {
  document.querySelectorAll(".dropdown-menu").forEach(menu => {
    if (menu !== exceptMenu) {
      menu.classList.remove("open");
    }
  });
}

titleBtn.addEventListener("click", e => {
  e.stopPropagation();

  const open = titleDropdown.classList.contains("open");

  closeAll();

  if (!open) {
    titleDropdown.classList.add("open");
  }
});

authorBtn.addEventListener("click", e => {
  e.stopPropagation();

  const open = authorDropdown.classList.contains("open");

  closeAll();

  if (!open) {
    authorDropdown.classList.add("open");
  }
});

libraryBtn.addEventListener("click", e => {
  e.stopPropagation();

  const open = allLibraryDropdown.classList.contains("open");

  closeAll();

  if (!open) {
    allLibraryDropdown.classList.add("open");
  }
});

document.addEventListener("click", closeAll);