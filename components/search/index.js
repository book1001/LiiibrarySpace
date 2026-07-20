import { initBookCard } from "../book-card/index.js";
const bookCardController = initBookCard();

const titleBtn = document.getElementById("titleBtn");
const authorBtn = document.getElementById("authorBtn");
const libraryBtn = document.getElementById("libraryBtn");

const titleDropdown = document.getElementById("titleDropdown");
const authorDropdown = document.getElementById("authorDropdown");
const allLibraryDropdown = document.getElementById("allLibraryDropdown");

const searchBar = document.getElementById("searchBar");
const searchBarContainer = document.getElementById("searchBar-container");
const searchDropdown = document.getElementById("searchDropdown");

let books = [];
let libraries = [];

let searchResults = [];
let selectedSearchIndex = -1;

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

  const sortedTitles = [...titleBooksMap.keys()]
    .sort((a, b) =>
      a.localeCompare(b, undefined, {
        sensitivity: "base"
      })
    );

  titleDropdown.innerHTML = "";

  sortedTitles.forEach(title => {
    const booksByTitle = titleBooksMap.get(title);

    booksByTitle.forEach(book => {
      const item = document.createElement("div");
      item.className = "dropdown-item";

      const authors = getBookAuthors(book).join(", ");

      item.textContent = booksByTitle.length > 1
        ? `${title} — ${authors}`
        : title;

      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        bookCardController.showBookCard(book);

        titleDropdown.classList.remove("open");
      });

      titleDropdown.appendChild(item);
    });
  });
}

// // ====================================
// // Title
// // ====================================
// function buildTitleDropdown() {
//   const sortedBooks = [...books]
//     .filter(book => book.title)
//     .sort((a, b) =>
//       a.title.localeCompare(b.title, undefined, {
//         sensitivity: "base"
//       })
//     );

//   titleDropdown.innerHTML = "";

//   sortedBooks.forEach(book => {
//     const item = document.createElement("div");
//     item.className = "dropdown-item";
//     item.textContent = book.title;

//     item.addEventListener("click", (e) => {
//       e.preventDefault();
//       e.stopPropagation();

//       bookCardController.showBookCard(book);

//       titleDropdown.classList.remove("open");
//     });

//     titleDropdown.appendChild(item);
//   });
// }


// // ====================================
// // Title
// // ====================================
// function buildTitleDropdown() {
//   const titles = [...new Set(
//     books
//       .map(book => book.title)
//       .filter(Boolean)
//   )];

//   titles.sort((a, b) => a.localeCompare(b));

//   titleDropdown.innerHTML = "";

//   titles.forEach(title => {
//     const item = document.createElement("div");
//     item.className = "dropdown-item";
//     item.textContent = title;

//     item.addEventListener("click", () => {
//       console.log(title);
//       titleDropdown.classList.remove("open");
//     });

//     titleDropdown.appendChild(item);
//   });
// }

// // ====================================
// // Author
// // ====================================
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

  const sortedAuthors = [...authorBooksMap.keys()]
    .sort((a, b) =>
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

      item.textContent = booksByAuthor.length > 1
        ? `${author} — ${book.title}`
        : author;

      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        bookCardController.showBookCard(book);

        authorDropdown.classList.remove("open");
      });

      authorDropdown.appendChild(item);
    });
  });
}

// // ====================================
// // Author
// // ====================================
// function buildAuthorDropdown() {

//   const authors = [];

//   books.forEach(book => {

//     if (!book.author) return;

//     if (Array.isArray(book.author)) {
//       authors.push(...book.author);
//     } else {
//       authors.push(book.author);
//     }

//   });

//   const uniqueAuthors = [...new Set(authors)]
//     .filter(Boolean)
//     .sort((a, b) => a.localeCompare(b));

//   authorDropdown.innerHTML = "";

//   uniqueAuthors.forEach(author => {

//     const item = document.createElement("div");
//     item.className = "dropdown-item";
//     item.textContent = author;

//     authorDropdown.appendChild(item);

//   });

// }

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
    // item.textContent = library.libraryName;
    item.textContent = library.libraryName + (library.bookSharing === "private" ? " ❋" : "");

    item.addEventListener("click", (e) => {
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

  const libraryURL =
    `/${encodeURIComponent(library.libraryName)}/`;

  window.open(
    libraryURL,
    "_blank",
    "width=1280,height=900,left=200,top=100,resizable=yes,scrollbars=yes"
  );
}


// ====================================
// Search
// ====================================
function normalizeSearchText(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase();
}

function createSearchResults(query) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return [];
  }

  const results = [];

  // ------------------------------------
  // Title 검색
  // ------------------------------------
  const titleBooksMap = new Map();

  books.forEach(book => {
    if (!book.title) return;

    const normalizedTitle = normalizeSearchText(book.title);

    if (!normalizedTitle.includes(normalizedQuery)) {
      return;
    }

    if (!titleBooksMap.has(book.title)) {
      titleBooksMap.set(book.title, []);
    }

    titleBooksMap.get(book.title).push(book);
  });

  titleBooksMap.forEach((booksByTitle, title) => {
    booksByTitle.forEach(book => {
      const authors = getBookAuthors(book).join(", ");

      const label = booksByTitle.length > 1 && authors
        ? `${title} — ${authors}`
        : title;

      results.push({
        type: "Title",
        label,
        sortText: title,
        action: () => {
          bookCardController.showBookCard(book);
        }
      });
    });
  });

  // ------------------------------------
  // Author 검색
  // ------------------------------------
  const authorBooksMap = new Map();

  books.forEach(book => {
    getBookAuthors(book).forEach(author => {
      const normalizedAuthor = normalizeSearchText(author);

      if (!normalizedAuthor.includes(normalizedQuery)) {
        return;
      }

      if (!authorBooksMap.has(author)) {
        authorBooksMap.set(author, []);
      }

      authorBooksMap.get(author).push(book);
    });
  });

  authorBooksMap.forEach((booksByAuthor, author) => {
    booksByAuthor.forEach(book => {
      const label = booksByAuthor.length > 1
        ? `${author} — ${book.title}`
        : author;

      results.push({
        type: "Author",
        label,
        sortText: author,
        action: () => {
          bookCardController.showBookCard(book);
        }
      });
    });
  });

  // ------------------------------------
  // Library 검색
  // ------------------------------------
  libraries.forEach(library => {
    const libraryName = library.libraryName;

    if (!libraryName) return;

    const normalizedName =
      normalizeSearchText(libraryName);

    if (!normalizedName.includes(normalizedQuery)) {
      return;
    }

    results.push({
      type: "Liiibrary",
      label:
        libraryName +
        (library.bookSharing === "private" ? " ❋" : ""),
      sortText: libraryName,
      action: () => {
        openLibrary(library);
      }
    });

    // results.push({
    //   type: "Liiibrary",
    //   label: libraryName,
    //   sortText: libraryName,
    //   action: () => {
    //     openLibrary(library);
    //   }
    // });
  });

  return results.sort((a, b) => {
    const aText = normalizeSearchText(a.sortText);
    const bText = normalizeSearchText(b.sortText);

    const aStarts = aText.startsWith(normalizedQuery);
    const bStarts = bText.startsWith(normalizedQuery);

    // 검색어로 시작하는 결과를 먼저 표시
    if (aStarts !== bStarts) {
      return aStarts ? -1 : 1;
    }

    // 같은 종류끼리 정렬
    if (a.type !== b.type) {
      const typeOrder = {
        Title: 0,
        Author: 1,
        Liiibrary: 2
      };

      return typeOrder[a.type] - typeOrder[b.type];
    }

    return a.sortText.localeCompare(
      b.sortText,
      undefined,
      {
        sensitivity: "base"
      }
    );
  });
}

// ====================================
// Search: Results
// ====================================
function renderSearchResults(query) {
  searchResults = createSearchResults(query);
  selectedSearchIndex = -1;

  searchDropdown.innerHTML = "";

  if (!query.trim() || searchResults.length === 0) {
    searchDropdown.classList.remove("open");
    return;
  }

  searchResults.forEach((result, index) => {
    const item = document.createElement("div");
    item.className = "dropdown-item";
    item.dataset.searchIndex = String(index);

    const type = document.createElement("span");
    type.className = "search-result-type";
    type.textContent = result.type;

    const text = document.createElement("span");
    text.className = "search-result-text";
    text.textContent = result.label;

    item.append(type, text);

    item.addEventListener("mousedown", (e) => {
      // input의 blur보다 먼저 실행되도록 click 대신 mousedown 사용
      e.preventDefault();
    });

    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      selectSearchResult(index);
    });

    item.addEventListener("mouseenter", () => {
      selectedSearchIndex = index;
      updateSelectedSearchResult();
    });

    searchDropdown.appendChild(item);
  });

  // closeAll();
  closeAll(searchDropdown);
  searchDropdown.classList.add("open");
}

// ====================================
// Search: selectSearchResult
// ====================================
function selectSearchResult(index) {
  const result = searchResults[index];

  if (!result) return;

  result.action();

  searchBar.value = result.label;
  searchDropdown.classList.remove("open");

  searchResults = [];
  selectedSearchIndex = -1;
}

function updateSelectedSearchResult() {
  const items = searchDropdown.querySelectorAll(
    ".dropdown-item"
  );

  items.forEach((item, index) => {
    item.classList.toggle(
      "is-selected",
      index === selectedSearchIndex
    );
  });

  if (selectedSearchIndex >= 0) {
    items[selectedSearchIndex]?.scrollIntoView({
      block: "nearest"
    });
  }
}

// ====================================
// Search: Input / Enter Events
// ====================================
const searchBtn = document.getElementById("searchBtn");

function openSelectedSearchResult() {
  if (searchResults.length === 0) {
    return;
  }

  const indexToOpen =
    selectedSearchIndex >= 0
      ? selectedSearchIndex
      : 0;

  selectSearchResult(indexToOpen);
}

searchBar.addEventListener("input", () => {
  renderSearchResults(searchBar.value);
});

searchBar.addEventListener("keydown", (e) => {
  if (
    e.key === "ArrowDown" &&
    searchResults.length > 0
  ) {
    e.preventDefault();

    selectedSearchIndex =
      selectedSearchIndex < searchResults.length - 1
        ? selectedSearchIndex + 1
        : 0;

    updateSelectedSearchResult();
    return;
  }

  if (
    e.key === "ArrowUp" &&
    searchResults.length > 0
  ) {
    e.preventDefault();

    selectedSearchIndex =
      selectedSearchIndex > 0
        ? selectedSearchIndex - 1
        : searchResults.length - 1;

    updateSelectedSearchResult();
    return;
  }

  if (e.key === "Enter") {
    e.preventDefault();
    openSelectedSearchResult();
    return;
  }

  if (e.key === "Escape") {
    searchDropdown.classList.remove("open");
    selectedSearchIndex = -1;
  }
});

searchBtn.addEventListener("click", (e) => {
  e.preventDefault();
  openSelectedSearchResult();
});

searchBar.addEventListener("focus", () => {
  if (searchBar.value.trim()) {
    renderSearchResults(searchBar.value);
  }
});

searchBarContainer.addEventListener("click", (e) => {
  e.stopPropagation();
});

// ====================================
// 드롭다운 열고 닫기
// ====================================
function closeAll(exceptMenu = null) {
  document.querySelectorAll(".dropdown-menu")
    .forEach(menu => {
      if (menu !== exceptMenu) {
        menu.classList.remove("open");
      }
    });
}
// function closeAll() {
//   document.querySelectorAll(".dropdown-menu")
//     .forEach(menu => menu.classList.remove("open"));
// }

titleBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = titleDropdown.classList.contains("open");
  closeAll();
  if (!open) titleDropdown.classList.add("open");
});

authorBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = authorDropdown.classList.contains("open");
  closeAll();
  if (!open) authorDropdown.classList.add("open");
});

libraryBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = allLibraryDropdown.classList.contains("open");
  closeAll();
  if (!open) allLibraryDropdown.classList.add("open");
});

document.addEventListener("click", closeAll);