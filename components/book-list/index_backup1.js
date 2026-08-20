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

  let bookListL = null;
  let bookListR = null;


  // ======================================================
  // ALL MODE COLUMNS
  // ======================================================
  if (isAllMode) {
    bookList.innerHTML = "";

    bookListL = document.createElement("div");
    bookListR = document.createElement("div");

    bookListL.id = "bookList-L";
    bookListR.id = "bookList-R";

    bookList.append(bookListL, bookListR);
  }


  // ======================================================
  // VISIBLE BOOKS
  // ======================================================
  function getVisibleBooks(books) {
    if (isAllMode) return books;

    return books.filter(book => {
      if (!Array.isArray(book.library)) return false;

      return book.library.some(item => {
        if (typeof item === "string") return item === CURRENT_LIBRARY;

        return item?.name === CURRENT_LIBRARY;
      });
    });
  }


  // ======================================================
  // RENDERERS
  // ======================================================
  const renderers = {
    all(book) {
      const item = document.createElement("div");

      item.textContent = book.title;
      item.classList.add("book");

      item.addEventListener("click", () => {
        if (typeof showBookCard === "function") showBookCard(book);
      });

      return item;
    },


    currentLibrary(book) {
      const item = document.createElement("div");
      const handle = document.createElement("div");
      const title = document.createElement("div");

      item.id = book.id;
      item.classList.add("book", "can-drag");
      item.setAttribute("can-mirror", "");

      const libraryEntry = Array.isArray(book.library)
        ? book.library.find(library => {
            if (typeof library === "string") return library === CURRENT_LIBRARY;
            return library?.name === CURRENT_LIBRARY;
          })
        : null;

      item.style.backgroundColor = libraryEntry?.color || "#f2edcb";

      handle.classList.add("drag-handle");

      title.classList.add("book-title");
      title.textContent = book.title;

      item.append(handle, title);


      // ==================================================
      // BOOK TITLE CLICK
      // ==================================================
      title.addEventListener("click", e => {
        e.stopPropagation();

        if (typeof showBookCard === "function") showBookCard(book);
      });

      return item;
    }
  };


  let previousVisibleBookIds = null;


  // ======================================================
  // NEW BOOK POSITION
  // ======================================================
  function placeNewBookNextToCenter(newItem) {
    if (isAllMode) return;

    const floor = document.getElementById("floor");

    if (!floor) return;

    const floorLeft = parseFloat(getComputedStyle(floor).left) || 0;
    const floorTop = parseFloat(getComputedStyle(floor).top) || 0;

    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;

    const centerX = -floorLeft + viewportCenterX;
    const centerY = -floorTop + viewportCenterY;

    const otherBooks = [...bookList.querySelectorAll(".book")].filter(book => book !== newItem);

    const gap = 5;


    // --------------------------------------------------
    // 화면 중앙을 덮고 있는 책
    // --------------------------------------------------
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
      const centerRect = centerBook.getBoundingClientRect();

      targetX = -floorLeft + centerRect.right + gap;
      targetY = -floorTop + centerRect.top;
    } else {
      targetX = centerX - newItem.offsetWidth / 2;
      targetY = centerY - newItem.offsetHeight / 2;
    }


    // --------------------------------------------------
    // 겹치는 Book 확인
    // --------------------------------------------------
    let hasOverlap = true;
    let safetyCount = 0;

    while (hasOverlap && safetyCount < 100) {
      hasOverlap = false;
      safetyCount += 1;

      const candidateRect = {
        left: floorLeft + targetX,
        top: floorTop + targetY,
        right: floorLeft + targetX + newItem.offsetWidth,
        bottom: floorTop + targetY + newItem.offsetHeight
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
        const rect = overlappingBook.getBoundingClientRect();

        targetX = -floorLeft + rect.right + gap;
        hasOverlap = true;
      }
    }


    newItem.style.position = "absolute";
    newItem.style.left = `${targetX}px`;
    newItem.style.top = `${targetY}px`;
  }


  // ======================================================
  // LOAD BOOKS
  // ======================================================
  async function loadBooks() {
    try {
      const res = await fetch(`/books?_=${Date.now()}`, {
        cache: "no-store"
      });

      if (!res.ok) throw new Error("Failed to load the book list");

      const books = await res.json();

      const visibleBooks = isAllMode
        ? [...getVisibleBooks(books)].reverse()
        : getVisibleBooks(books);

      const currentVisibleBookIds = new Set(
        visibleBooks.map(book => String(book.id))
      );

      const newBookIds = new Set();


      // --------------------------------------------------
      // 새로 추가된 Book 찾기
      // --------------------------------------------------
      if (previousVisibleBookIds !== null) {
        currentVisibleBookIds.forEach(id => {
          if (!previousVisibleBookIds.has(id)) newBookIds.add(id);
        });
      }


      const renderer = renderers[mode] || renderers.currentLibrary;


      // ==================================================
      // ALL MODE
      //
      // 최신 --------------------> 오래된
      //
      // 앞쪽 절반 → #bookList-L
      // 뒤쪽 절반 → #bookList-R
      // ==================================================
      if (isAllMode) {
        bookListL.innerHTML = "";
        bookListR.innerHTML = "";

        const middleIndex = Math.ceil(visibleBooks.length / 2);

        visibleBooks.forEach((book, index) => {
          const item = renderer(book);

          if (index < middleIndex) {
            bookListL.appendChild(item);
          } else {
            bookListR.appendChild(item);
          }
        });
      }


      // ==================================================
      // CURRENT LIBRARY MODE
      // ==================================================
      else {
        bookList.innerHTML = "";

        visibleBooks.forEach(book => {
          const item = renderer(book);

          bookList.appendChild(item);

          const isNewBook = newBookIds.has(String(book.id));

          if (isNewBook) placeNewBookNextToCenter(item);

          // 위치 지정 후 PlayHTML 연결
          if (typeof window.setupPlayhtmlElement === "function") {
            window.setupPlayhtmlElement(item);
          }
        });
      }


      previousVisibleBookIds = currentVisibleBookIds;
    } catch (error) {
      console.error(error);
    }
  }


  window.loadBooks = loadBooks;


  // ======================================================
  // BOOK UPDATE EVENTS
  // ======================================================
  async function handleBookUpdated(event) {
    const data = event.detail || event.data;

    if (data?.type !== "book-updated") return;

    /*
      currentLibrary 모드에서도 현재 Library가 제거된
      Book을 바로 목록에서 없애야 하므로
      remove-library는 libraryName 필터를 거치지 않습니다.
    */
    if (
      !isAllMode &&
      data.action !== "remove-library" &&
      data.libraryName &&
      data.libraryName !== CURRENT_LIBRARY
    ) {
      return;
    }

    await loadBooks();
  }


  // ======================================================
  // CURRENT WINDOW CUSTOM EVENT
  // ======================================================
  if (bookList._bookUpdatedHandler) {
    window.removeEventListener("book-updated", bookList._bookUpdatedHandler);
  }

  bookList._bookUpdatedHandler = handleBookUpdated;

  window.addEventListener("book-updated", handleBookUpdated);


  // ======================================================
  // BROADCAST CHANNEL
  // ======================================================
  if (bookList._bookUpdateChannel) bookList._bookUpdateChannel.close();

  const bookUpdateChannel = new BroadcastChannel("book-updates");


  // ------------------------------------------------------
  // BroadcastChannel 메시지
  // ------------------------------------------------------
  bookUpdateChannel.addEventListener("message", async event => {
    const message = event.data;

    if (!message) return;


    // --------------------------------------------------
    // Library 제거 전 PlayHTML mirror 데이터 삭제
    // --------------------------------------------------
    if (
      message.type === "delete-book-mirror-data" &&
      message.libraryName === CURRENT_LIBRARY
    ) {
      const elementId = message.bookId;

      if (
        window.playhtml &&
        typeof window.playhtml.deleteElementData === "function"
      ) {
        try {
          const result = await window.playhtml.deleteElementData(
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

      return;
    }


    // --------------------------------------------------
    // Book 추가 / 제거 / 수정 실시간 반영
    // --------------------------------------------------
    if (message.type === "book-updated") {
      await handleBookUpdated(event);
    }
  });


  bookList._bookUpdateChannel = bookUpdateChannel;


  // ======================================================
  // WINDOW.OPENER POSTMESSAGE
  // ======================================================
  if (bookList._bookMessageHandler) {
    window.removeEventListener("message", bookList._bookMessageHandler);
  }

  bookList._bookMessageHandler = event => {
    if (event.origin !== window.location.origin) return;

    handleBookUpdated(event);
  };

  window.addEventListener("message", bookList._bookMessageHandler);


  // ======================================================
  // INITIAL LOAD
  // ======================================================
  await loadBooks();
}