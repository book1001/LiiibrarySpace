const libraryList = document.getElementById("libraryList");
const libraryStreet = document.getElementById("libraryStreet");
const bookUpdateChannel = new BroadcastChannel("book-updates");

let isLoadingLibraries = false;
let lastMessageKey = "";
let lastMessageTime = 0;
let requestPresenceUpdate = () => {};

// ======================================================
// Path
// ======================================================
function normalizePath(path) {
  if (!path || path === "/") {
    return "/";
  }

  return path.replace(/\/+$/, "");
}

// ======================================================
// Presence: PlayHTML initializer
// playhtml.init()보다 먼저 실행되어야 함
// ======================================================
libraryStreet.defaultData = {
  byPath: {}
};

libraryStreet.updateElement = ({ element, data }) => {
  const now = Date.now();
  const byPath = data?.byPath ?? {};

  element.querySelectorAll(".library-link").forEach((link) => {
    const house = link.querySelector(".library-house");

    if (!house) {
      return;
    }

    const path = normalizePath(link.dataset.path || link.pathname);
    const lastSeen = byPath[path] ?? 0;
    const isOpen = now - lastSeen < 10000;
    const shadows = [];

    if (house.dataset.baseShadow) {
      shadows.push(house.dataset.baseShadow);
    }

    if (isOpen) {
      shadows.push("0 0 6px #ffff1c");
    }

    house.style.textShadow = shadows.join(", ");
    house.classList.toggle("is-home", isOpen);
    link.classList.toggle("is-home", isOpen);
  });
};

libraryStreet.onMount = ({ setData, requestUpdate }) => {
  const presenceChannel = new BroadcastChannel("page-presence");
  const currentPath = normalizePath(window.location.pathname);

  requestPresenceUpdate = requestUpdate;

  function recordPresence(path, timestamp = Date.now()) {
    const normalizedPath = normalizePath(path);
    const normalizedTimestamp = Number(timestamp) || Date.now();

    setData((data) => {
      data.byPath ??= {};
      data.byPath[normalizedPath] = normalizedTimestamp;
    });

    requestUpdate();
  }

  function pulse() {
    recordPresence(currentPath, Date.now());
  }

  function handlePresenceMessage(event) {
    const message = event.data;

    if (message?.type !== "page-presence") {
      return;
    }

    if (typeof message.path !== "string") {
      return;
    }

    recordPresence(message.path, message.time);

    console.log(
      "presence received:",
      normalizePath(message.path),
      message.time
    );
  }

  presenceChannel.addEventListener("message", handlePresenceMessage);

  pulse();

  const pulseTimer = setInterval(pulse, 4000);
  const renderTimer = setInterval(requestUpdate, 1000);

  return () => {
    clearInterval(pulseTimer);
    clearInterval(renderTimer);
    presenceChannel.removeEventListener("message", handlePresenceMessage);
    presenceChannel.close();
    requestPresenceUpdate = () => {};
  };
};

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

    const [libraryResponse, bookResponse] = await Promise.all([
      fetch(`/libraries?_=${timestamp}`, {
        cache: "no-store"
      }),

      fetch(`/books?_=${timestamp}`, {
        cache: "no-store"
      })
    ]);

    if (!libraryResponse.ok) {
      throw new Error("Failed to load the library list");
    }

    if (!bookResponse.ok) {
      throw new Error("Failed to load the book list");
    }

    const libraries = await libraryResponse.json();
    const books = await bookResponse.json();

    libraryStreet.innerHTML = "";
    libraryList.innerHTML = '<option value="">Open Library...</option>';

    [...libraries].reverse().forEach((library) => {
      const libraryName = library.libraryName;

      const libraryBooks = books.filter((book) => {
        return (
          Array.isArray(book.library) &&
          book.library.includes(libraryName)
        );
      });

      const bookCount = libraryBooks.length;

      // --------------------------------------------------
      // Street
      // --------------------------------------------------
      const container = document.createElement("div");
      container.className = "library";

      const link = document.createElement("a");
      link.className = "library-link";
      link.href = `/${encodeURIComponent(libraryName)}/`;
      link.dataset.path = normalizePath(link.pathname);

      link.addEventListener("click", (event) => {
        event.preventDefault();
        openLibrary(libraryName);
      });

      const house = document.createElement("pre");
      house.className = "library-house";
      house.textContent = library.house || "";

      const color = library.color || "inherit";
      house.style.color = color;
      house.dataset.baseShadow = "";

      if (
        library.color &&
        getColorBrightness(library.color) >= 200
      ) {
        house.dataset.baseShadow = "1px 0 gray";
        house.style.textShadow = house.dataset.baseShadow;
      }

      const nameContainer = document.createElement("div");
      nameContainer.className = "library-name-container";

      const name = document.createElement("h5");
      name.className = "library-name";
      name.append(document.createTextNode(libraryName));

      nameContainer.appendChild(name);

      if (library.bookSharing === "private") {
        const mark = document.createElement("span");
        mark.className = "library-private";
        mark.textContent = "❋";
        nameContainer.appendChild(mark);
      }

      link.append(house, nameContainer);
      container.appendChild(link);
      libraryStreet.appendChild(container);

      // --------------------------------------------------
      // Dropdown
      // --------------------------------------------------
      const option = document.createElement("option");
      option.value = libraryName;
      option.textContent = `${libraryName} (${bookCount})`;

      libraryList.appendChild(option);
    });

    requestPresenceUpdate();
  } catch (error) {
    console.error("loadLibraries error:", error);
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

  if (
    messageKey === lastMessageKey &&
    now - lastMessageTime < 500
  ) {
    return;
  }

  lastMessageKey = messageKey;
  lastMessageTime = now;

  console.log("Book update received:", data);

  await loadLibraries();

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
// BroadcastChannel: Book 업데이트 수신
// ======================================================
bookUpdateChannel.addEventListener("message", (event) => {
  handleBookUpdated(event.data);
});

// ======================================================
// postMessage: Book 업데이트 수신
// ======================================================
window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) {
    return;
  }

  handleBookUpdated(event.data);
});

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
// index.html 활성화 시 동기화
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

  const normalizedHex = hex.replace("#", "").trim();
  const r = parseInt(normalizedHex.slice(0, 2), 16);
  const g = parseInt(normalizedHex.slice(2, 4), 16);
  const b = parseInt(normalizedHex.slice(4, 6), 16);

  return (
    r * 299 +
    g * 587 +
    b * 114
  ) / 1000;
}

// ======================================================
// libraryStreet: 가로 스크롤
// ======================================================
libraryStreet.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();

    libraryStreet.scrollLeft +=
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
        ? event.deltaX
        : event.deltaY;
  },
  {
    passive: false
  }
);

// ======================================================
// 최초 로드
// ======================================================
loadLibraries();