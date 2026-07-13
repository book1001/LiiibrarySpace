const libraryList = document.getElementById("libraryList");
const libraryStreet = document.getElementById("libraryStreet");

const bookUpdateChannel =
  new BroadcastChannel("book-updates");

let isLoadingLibraries = false;
let lastMessageKey = "";
let lastMessageTime = 0;

// ======================================================
// Library 목록 불러오기
// ======================================================
async function loadLibraries() {
  if (isLoadingLibraries) {
    return;
  }

  isLoadingLibraries = true;

  try {
    const timestamp = Date.now();

    const [libraryResponse, bookResponse] =
      await Promise.all([
        fetch(`/libraries?_=${timestamp}`, {
          cache: "no-store"
        }),

        fetch(`/books?_=${timestamp}`, {
          cache: "no-store"
        })
      ]);

    if (!libraryResponse.ok) {
      throw new Error(
        "Failed to load the library list"
      );
    }

    if (!bookResponse.ok) {
      throw new Error(
        "Failed to load the book list"
      );
    }

    const libraries = await libraryResponse.json();
    const books = await bookResponse.json();

    libraryStreet.innerHTML = "";

    libraryList.innerHTML =
      '<option value="">Open Library...</option>';

    [...libraries]
      .reverse()
      .forEach(library => {
        const libraryName = library.libraryName;

        const libraryBooks = books.filter(book => {
          return (
            Array.isArray(book.library) &&
            book.library.includes(libraryName)
          );
        });

        const bookCount = libraryBooks.length;

        // -----------------------------------------------
        // Street
        // -----------------------------------------------
        const container =
          document.createElement("div");

        container.className = "library";

        const link =
          document.createElement("a");

        link.className = "library-link";
        link.href =
          `/${encodeURIComponent(libraryName)}/`;

        link.addEventListener("click", (e) => {
          e.preventDefault();
          openLibrary(libraryName);
        });

        const house =
          document.createElement("pre");

        house.className = "library-house";
        house.textContent = library.house || "";

        const color = library.color || "inherit";
        house.style.color = color;

        if (
          library.color &&
          getColorBrightness(library.color) >= 200
        ) {
          house.style.textShadow = "1px 0 gray";
        }

        const name =
          document.createElement("h5");

        name.className = "library-name";
        name.textContent = libraryName;

        link.append(
          house,
          name
        );

        container.appendChild(link);
        libraryStreet.appendChild(container);

        // -----------------------------------------------
        // Dropdown
        // -----------------------------------------------
        const option =
          document.createElement("option");

        option.value = libraryName;
        option.textContent =
          `${libraryName} (${bookCount})`;

        libraryList.appendChild(option);
      });
  } catch (error) {
    console.error(
      "loadLibraries error:",
      error
    );
  } finally {
    isLoadingLibraries = false;
  }
}

// ======================================================
// Book 업데이트 수신 후 UI 갱신
// ======================================================
async function handleBookUpdated(data) {
  if (data?.type !== "book-updated") {
    return;
  }

  const messageKey = [
    data.type,
    data.action,
    data.libraryName,
    data.bookId || ""
  ].join("|");

  const now = Date.now();

  // BroadcastChannel과 postMessage가
  // 동시에 올 경우 한 번만 처리
  if (
    messageKey === lastMessageKey &&
    now - lastMessageTime < 500
  ) {
    return;
  }

  lastMessageKey = messageKey;
  lastMessageTime = now;

  console.log(
    "Book update received:",
    data
  );

  // Library street와 dropdown 갱신
  await loadLibraries();

  // index.html의 book-list 컴포넌트 갱신
  window.dispatchEvent(
    new CustomEvent("book-updated", {
      detail: {
        libraryName: data.libraryName,
        action: data.action,
        bookId: data.bookId
      }
    })
  );
}

// ======================================================
// BroadcastChannel 수신
// ======================================================
bookUpdateChannel.addEventListener(
  "message",
  (event) => {
    handleBookUpdated(event.data);
  }
);

// ======================================================
// postMessage 수신
// ======================================================
window.addEventListener(
  "message",
  (event) => {
    if (event.origin !== window.location.origin) {
      return;
    }

    handleBookUpdated(event.data);
  }
);

// ======================================================
// Library 팝업 열기
// ======================================================
function openLibrary(libraryName) {
  window.open(
    `/${encodeURIComponent(libraryName)}/`,
    libraryName,
    "width=1280,height=900,left=200,top=100,resizable=yes,scrollbars=yes"
  );
}

// ======================================================
// Dropdown
// ======================================================
libraryList.addEventListener("change", () => {
  const libraryName = libraryList.value;

  if (!libraryName) {
    return;
  }

  openLibrary(libraryName);
  libraryList.selectedIndex = 0;
});

// ======================================================
// index.html이 활성화될 때 동기화
// ======================================================
window.addEventListener("focus", () => {
  loadLibraries();
});

// ======================================================
// Color
// ======================================================
function getColorBrightness(hex) {
  if (!hex) {
    return 0;
  }

  const normalizedHex = hex
    .replace("#", "")
    .trim();

  const r = parseInt(
    normalizedHex.slice(0, 2),
    16
  );

  const g = parseInt(
    normalizedHex.slice(2, 4),
    16
  );

  const b = parseInt(
    normalizedHex.slice(4, 6),
    16
  );

  return (
    r * 299 +
    g * 587 +
    b * 114
  ) / 1000;
}

// ======================================================
// 최초 로드
// ======================================================
loadLibraries();


// ======================================================
// libraryStreet: 스크롤
// ======================================================
// const libraryStreet = document.getElementById("libraryStreet");

libraryStreet.addEventListener("wheel", (e) => {
  e.preventDefault();

  libraryStreet.scrollLeft +=
    Math.abs(e.deltaX) > Math.abs(e.deltaY)
      ? e.deltaX
      : e.deltaY;
}, { passive: false });

// const libraryList = document.getElementById("libraryList");
// const libraryStreet = document.getElementById("libraryStreet");

// const bookUpdateChannel = new BroadcastChannel("book-updates");

// // ======================================================
// // Library 목록 불러오기
// // ======================================================
// window.addEventListener("message", async (event) => {
//   // 다른 도메인에서 보낸 메시지는 무시
//   if (event.origin !== window.location.origin) {
//     return;
//   }

//   if (event.data?.type !== "book-updated") {
//     return;
//   }

//   console.log("Book update received:", event.data);

//   // Library street/dropdown 갱신
//   await loadLibraries();

//   // index.html에 책 목록이 있다면 책 목록도 갱신
//   if (typeof window.loadBooks === "function") {
//     await window.loadBooks();
//   }
// });

// async function loadLibraries() {
//   const bookUpdateChannel = new BroadcastChannel("book-updates");

//   bookUpdateChannel.addEventListener("message", async (event) => {
//     if (event.data?.type !== "book-updated") {
//       return;
//     }

//     await loadLibraries();
//   });

//   try {
//     const [libraryResponse, bookResponse] = await Promise.all([
//       fetch("/libraries"),
//       fetch("/books")
//     ]);

//     if (!libraryResponse.ok) {
//       throw new Error("Library 목록을 불러오지 못했습니다.");
//     }

//     if (!bookResponse.ok) {
//       throw new Error("책 목록을 불러오지 못했습니다.");
//     }

//     const libraries = await libraryResponse.json();
//     const books = await bookResponse.json();

//     libraryStreet.innerHTML = "";
//     libraryList.innerHTML =
//       '<option value="">Open Library...</option>';

//     [...libraries].reverse().forEach(library => {
//       const libraryName = library.libraryName;

//       const bookCount = books.filter(book => {
//         return (
//           Array.isArray(book.library) &&
//           book.library.includes(libraryName)
//         );
//       }).length;

//       // ==================================================
//       // Street
//       // ==================================================
//       const container = document.createElement("div");
//       container.className = "library";

//       const house = document.createElement("pre");
//       house.className = "library-house";
//       house.textContent = library.house || "";

//       const color = library.color || "inherit";
//       house.style.color = color;

//       if (
//         library.color &&
//         getColorBrightness(library.color) >= 200
//       ) {
//         house.style.textShadow = "1px 0px gray";
//       }

//       const name = document.createElement("h5");
//       name.className = "library-name";
//       name.textContent = libraryName;

//       // 책 개수 표시
//       const count = document.createElement("span");
//       count.className = "library-book-count";
//       count.textContent = `${bookCount} ${
//         bookCount === 1 ? "book" : "books"
//       }`;

//       const link = document.createElement("a");
//       link.href = `/${encodeURIComponent(libraryName)}/`;
//       link.className = "library-link";

//       link.addEventListener("click", (e) => {
//         e.preventDefault();
//         openLibrary(libraryName);
//       });

//       link.append(house, name, count);
//       container.appendChild(link);
//       libraryStreet.appendChild(container);

//       // ==================================================
//       // Dropdown
//       // ==================================================
//       const option = document.createElement("option");
//       option.value = libraryName;
//       option.textContent =
//         `${libraryName} (${bookCount})`;

//       libraryList.appendChild(option);
//     });
//   } catch (error) {
//     console.error(error);
//   }
// }

// // ======================================================
// // Library 팝업 열기
// // ======================================================
// function openLibrary(libraryName) {
//   window.open(
//     `/${encodeURIComponent(libraryName)}/`,
//     libraryName,
//     "width=1280,height=900,left=200,top=100,resizable=yes,scrollbars=yes"
//   );
// }

// // ======================================================
// // Dropdown
// // ======================================================
// libraryList.addEventListener("change", () => {
//   if (!libraryList.value) return;

//   openLibrary(libraryList.value);
//   libraryList.selectedIndex = 0;
// });

// // ======================================================
// // 다른 창에서 책이 추가되면 자동 갱신
// // ======================================================
// bookUpdateChannel.addEventListener(
//   "message",
//   async (event) => {
//     if (event.data?.type !== "book-updated") {
//       return;
//     }

//     await loadLibraries();
//   }
// );

// // ======================================================
// // Color
// // ======================================================
// function getColorBrightness(hex) {
//   if (!hex) return 0;

//   const normalizedHex = hex.replace("#", "");

//   const r = parseInt(normalizedHex.slice(0, 2), 16);
//   const g = parseInt(normalizedHex.slice(2, 4), 16);
//   const b = parseInt(normalizedHex.slice(4, 6), 16);

//   return (r * 299 + g * 587 + b * 114) / 1000;
// }

// // 최초 로드
// loadLibraries();

// // const libraryList = document.getElementById("libraryList");
// // const libraryStreet = document.getElementById("libraryStreet");

// // async function loadLibraries() {
// //   const res = await fetch("/libraries");
// //   const libraries = await res.json();

// //   libraryStreet.innerHTML = "";
// //   libraryList.innerHTML = '<option value="">Open Library...</option>';

// //   [...libraries].reverse().forEach(library => {

// //     // ---------- Street ----------
// //     const container = document.createElement("div");
// //     container.className = "library";

// //     const house = document.createElement("pre");
// //     house.className = "library-house";
// //     house.textContent = library.house || "";
// //     // house.style.color = library.color || "inherit";

// //     const color = library.color || "inherit";
// //     house.style.color = color;
// //     if (library.color && getColorBrightness(library.color) >= 200) {
// //       house.style.textShadow = "1px 0px gray";
// //     }

// //     const name = document.createElement("h5");
// //     name.className = "library-name";
// //     name.textContent = library.libraryName;

// //     const link = document.createElement("a");
// //     link.href = `/${library.libraryName}/`;
// //     link.className = "library-link";

// //     link.addEventListener("click", (e) => {
// //       e.preventDefault();

// //       openLibrary(library.libraryName);
// //     });

// //     link.appendChild(house);
// //     link.appendChild(name);
// //     container.appendChild(link);

// //     libraryStreet.appendChild(container);

// //     // ---------- Dropdown ----------
// //     const option = document.createElement("option");
// //     option.value = library.libraryName;
// //     option.textContent = library.libraryName;

// //     libraryList.appendChild(option);
// //   });
// // }

// // function openLibrary(libraryName) {
// //   window.open(
// //     `/${libraryName}/`,
// //     libraryName,
// //     "width=1280,height=900,left=200,top=100,resizable=yes,scrollbars=yes"
// //   );
// // }

// // libraryList.addEventListener("change", () => {
// //   if (!libraryList.value) return;

// //   openLibrary(libraryList.value);

// //   // 다시 placeholder로 돌아가게 하고 싶으면
// //   libraryList.selectedIndex = 0;
// // });

// // loadLibraries();


// // // ===============================================
// // // Color
// // // ===============================================
// // function getColorBrightness(hex) {
// //   if (!hex) return 0;

// //   const normalizedHex = hex.replace("#", "");

// //   const r = parseInt(normalizedHex.slice(0, 2), 16);
// //   const g = parseInt(normalizedHex.slice(2, 4), 16);
// //   const b = parseInt(normalizedHex.slice(4, 6), 16);

// //   return (r * 299 + g * 587 + b * 114) / 1000;
// // }
// // // const libraryList = document.getElementById("libraryList");

// // // async function loadLibraries() {
// // //   const res = await fetch("/libraries");
// // //   const libraries = await res.json();

// // //   libraries.forEach(library => {
// // //     const link = document.createElement("a");

// // //     link.textContent = library.libraryName;
// // //     link.href = `/${library.libraryName}/`;
// // //     link.className = "library-link";

// // //     link.addEventListener("click", (e) => {
// // //       e.preventDefault();

// // //       window.open(
// // //         `/${library.libraryName}/`,
// // //         library.libraryName,
// // //         "width=1280,height=900,left=200,top=100,resizable=yes,scrollbars=yes"
// // //       );
// // //     });

// // //     libraryList.appendChild(link);
// // //   });
// // // }

// // // loadLibraries();