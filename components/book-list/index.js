export function init(element, options = {}) {
  const mode = element.dataset.mode || "currentLibrary";

  initBookList({
    mode,
    showBookCard: options.showBookCard
  });
}

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
    return Number(
      getComputedStyle(bookList)
        .getPropertyValue("--side-count")
    );
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
    if (isAllMode) {
      return books;
    }

    return books.filter(book => {
      if (!Array.isArray(book.library)) {
        return false;
      }

      return book.library.includes(CURRENT_LIBRARY);
    });
  }

  const renderers = {
    all(book) {
      const item = document.createElement("div");

      item.textContent = book.title;
      item.classList.add("book");

      item.addEventListener("click", () => {
        if (typeof showBookCard === "function") {
          showBookCard(book);
        }
      });

      return item;
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
      // title.contentEditable = "true";
      // title.spellcheck = false;
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

      title.addEventListener("click", e => {
        e.stopPropagation();

        if (wasDragging) return;

        if (typeof showBookCard === "function") {
          showBookCard(book);
        }
      });

      return item;
    }
  };

  let previousVisibleBookIds = null;

  function placeNewBookNextToCenter(newItem) {
    if (isAllMode) return;

    const floor = document.getElementById("floor");
    if (!floor) return;

    const floorLeft =
      parseFloat(getComputedStyle(floor).left) || 0;

    const floorTop =
      parseFloat(getComputedStyle(floor).top) || 0;

    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;

    const centerX =
      -floorLeft + viewportCenterX;

    const centerY =
      -floorTop + viewportCenterY;

    const otherBooks = [
      ...bookList.querySelectorAll(".book")
    ].filter(book => book !== newItem);

    const gap = 5;

    /*
      화면 중앙을 덮고 있는 책을 찾습니다.
    */
    const centerBook = otherBooks.find(book => {
      const rect = book.getBoundingClientRect();

      return (
        viewportCenterX >= rect.left &&
        viewportCenterX <= rect.right &&
        viewportCenterY >= rect.top &&
        viewportCenterY <= rect.bottom
      );
    });

    let targetX;
    let targetY;

    if (centerBook) {
      const centerRect =
        centerBook.getBoundingClientRect();

      targetX =
        -floorLeft +
        centerRect.right +
        gap;

      targetY =
        -floorTop +
        centerRect.top;
    } else {
      targetX =
        centerX -
        newItem.offsetWidth / 2;

      targetY =
        centerY -
        newItem.offsetHeight / 2;
    }

    /*
      계산된 위치에 이미 다른 책이 있으면
      겹치는 책의 오른쪽으로 계속 이동합니다.
    */
    let hasOverlap = true;
    let safetyCount = 0;

    while (hasOverlap && safetyCount < 100) {
      hasOverlap = false;
      safetyCount += 1;

      const candidateRect = {
        left: floorLeft + targetX,
        top: floorTop + targetY,
        right:
          floorLeft +
          targetX +
          newItem.offsetWidth,
        bottom:
          floorTop +
          targetY +
          newItem.offsetHeight
      };

      const overlappingBook = otherBooks.find(book => {
        const rect = book.getBoundingClientRect();

        return (
          candidateRect.left < rect.right &&
          candidateRect.right > rect.left &&
          candidateRect.top < rect.bottom &&
          candidateRect.bottom > rect.top
        );
      });

      if (overlappingBook) {
        const rect =
          overlappingBook.getBoundingClientRect();

        targetX =
          -floorLeft +
          rect.right +
          gap;

        hasOverlap = true;
      }
    }

    newItem.style.position = "absolute";
    newItem.style.left = `${targetX}px`;
    newItem.style.top = `${targetY}px`;
  }

  async function loadBooks() {
    try {
      const res = await fetch(
        `/books?_=${Date.now()}`,
        {
          cache: "no-store"
        }
      );

      // const res = await fetch("/books");

      if (!res.ok) {
        throw new Error("Failed to load the book list");
      }

      const books = await res.json();

      // const visibleBooks = [...getVisibleBooks(books)].reverse();
      const visibleBooks = isAllMode
        ? [...getVisibleBooks(books)].reverse()
        : getVisibleBooks(books);
      
      const currentVisibleBookIds = new Set(
        visibleBooks.map(book => String(book.id))
      );

      const newBookIds = new Set();

      if (previousVisibleBookIds !== null) {
        currentVisibleBookIds.forEach(id => {
          if (!previousVisibleBookIds.has(id)) {
            newBookIds.add(id);
          }
        });
      }

      const renderer = renderers[mode] || renderers.currentLibrary;

      bookList.innerHTML = "";

      visibleBooks.forEach(book => {
        const item = renderer(book);

        bookList.appendChild(item);

        const isNewBook =
          newBookIds.has(String(book.id));

        if (!isAllMode && isNewBook) {
          placeNewBookNextToCenter(item);
        }

        // 위치를 먼저 지정한 다음 PlayHTML 연결
        if (
          !isAllMode &&
          typeof window.setupPlayhtmlElement === "function"
        ) {
          window.setupPlayhtmlElement(item);
        }
      });

      previousVisibleBookIds = currentVisibleBookIds;

      placeItems();
    } catch (error) {
      console.error(error);
    }
  }

  window.loadBooks = loadBooks;
  // ======================================================
  // Book Update Events
  // ======================================================
  async function handleBookUpdated(event) {
    const data = event.detail || event.data;

    if (data?.type !== "book-updated") {
      return;
    }

    // 현재 Library 화면에서는
    // 다른 Library에서 발생한 변경은 무시
    if (
      !isAllMode &&
      data.libraryName &&
      data.libraryName !== CURRENT_LIBRARY
    ) {
      return;
    }

    await loadBooks();
  }

  // ------------------------------------------------------
  // 현재 창에서 발생한 CustomEvent
  // ------------------------------------------------------
  if (bookList._bookUpdatedHandler) {
    window.removeEventListener(
      "book-updated",
      bookList._bookUpdatedHandler
    );
  }

  bookList._bookUpdatedHandler = handleBookUpdated;

  window.addEventListener(
    "book-updated",
    handleBookUpdated
  );

  // ------------------------------------------------------
  // 다른 탭 또는 팝업에서 발생한 BroadcastChannel
  // ------------------------------------------------------
  if (bookList._bookUpdateChannel) {
    bookList._bookUpdateChannel.close();
  }

  const bookUpdateChannel = new BroadcastChannel("book-updates");

  bookUpdateChannel.addEventListener(
    "message",
    async event => {
      const message = event.data;

      if (
        !message ||
        message.type !== "delete-book-mirror-data" ||
        message.libraryName !== CURRENT_LIBRARY
      ) {
        return;
      }

      const elementId = message.bookId;

      if (
        window.playhtml &&
        typeof window.playhtml.deleteElementData === "function"
      ) {
        try {
          const result =
            await window.playhtml.deleteElementData(
              "can-mirror",
              elementId
            );

          console.log(
            "Deleted can-mirror data:",
            elementId,
            result
          );
        } catch (error) {
          console.error(
            "Failed to delete can-mirror data:",
            error
          );
        }
      }
    }
  );

  bookList._bookUpdateChannel = bookUpdateChannel;

  // ------------------------------------------------------
  // window.opener.postMessage()로 전달된 변경
  // ------------------------------------------------------
  if (bookList._bookMessageHandler) {
    window.removeEventListener(
      "message",
      bookList._bookMessageHandler
    );
  }

  bookList._bookMessageHandler = event => {
    if (event.origin !== window.location.origin) {
      return;
    }

    handleBookUpdated(event);
  };

  window.addEventListener(
    "message",
    bookList._bookMessageHandler
  );

  // ------------------------------------------------------
  if (isAllMode) {
    if (bookList._resizeHandler) {
      window.removeEventListener(
        "resize",
        bookList._resizeHandler
      );
    }

    bookList._resizeHandler = placeItems;

    window.addEventListener(
      "resize",
      placeItems
    );
  }

  await loadBooks();
}
