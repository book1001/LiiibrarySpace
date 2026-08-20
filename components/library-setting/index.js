import { initBookCard } from "../book-card/index.js";
const settingHouseWall = document.getElementById("settingHouseWall");
const settingHouseTitle = document.getElementById("settingHouseTitle");
const settingTitle = document.getElementById("settingTitle");
const settingCreatedAt = document.getElementById("settingCreatedAt");
const settingDescription = document.getElementById("settingDescription");
const settingHoldings = document.getElementById("settingHoldings");
const repairBtn = document.getElementById("repairBtn");
const repairBtnCancel = document.getElementById("repairBtnCancel");
const repairMore = document.getElementById("repairMore");
const repairColor = document.getElementById("repairColor");
const settingColorPicker = document.getElementById("settingColorPicker");
const libraryHeader = document.getElementById("libraryHeader");

const repairBtnMore = document.getElementById("repairBtnMore");
const dropdownMore = document.getElementById("dropdownMore");
const settingDelete = document.getElementById("settingDelete");
const deleteLibraryModal = document.getElementById("deleteLibraryModal");
const deleteLibraryPassword = document.getElementById("deleteLibraryPassword");
const deleteLibraryMessage = document.getElementById("deleteLibraryMessage");
const deleteLibraryCancel = document.getElementById("deleteLibraryCancel");
const deleteLibraryConfirm = document.getElementById("deleteLibraryConfirm");
const deleteLibraryForm = document.getElementById("deleteLibraryForm");

const librarySettingBorders = document.querySelectorAll(".librarySetting-border");

const settingPassword = document.getElementById("settingPassword");
const passwordChangeForm = document.getElementById("passwordChangeForm");

// let isRepairMode = false;
let currentLibraryData = null;
let repairOriginalData = null;

// 책별 변경 전 색상
let originalBookColors = new Map();

// 책별 현재 편집 색상
let pendingBookColors = new Map();



// let isColorisInitialized = false;

// function initializeColoris() {
//   if (isColorisInitialized) return;

//   if (typeof window.Coloris !== "function") {
//     console.error("Coloris is not loaded.");
//     return;
//   }

//   if (typeof window.Coloris.init === "function") {
//     window.Coloris.init();
//   }

//   window.Coloris({
//     el: ".holdingBookColorPicker, #settingColorPicker",
//     theme: "pill",
//     themeMode: "light",
//     alpha: false,
//     format: "hex",
//     formatToggle: false
//   });

//   isColorisInitialized = true;
// }


// Coloris({
//   el: ".holdingBookColorPicker",
//   theme: "pill",
//   themeMode: "light",
//   format: "hex",
//   alpha: false
// });

// ========================================
// 책 실시간 업데이트
// ========================================
const holdingBookUpdateChannel = new BroadcastChannel("book-updates");
let holdingRefreshTimer = null;

function refreshLibraryHoldings() {
  clearTimeout(holdingRefreshTimer);

  holdingRefreshTimer = setTimeout(async () => {
    if (window.isRepairMode) return;
    await loadLibrarySettings();
  }, 50);
}

function removeDeletedBookFromHoldings(bookId) {
  const normalizedBookId = String(bookId);
  const holdingBookColor = settingHoldings.querySelector(`.holdingBookColor[data-book-id="${CSS.escape(normalizedBookId)}"]`);
  const holding = holdingBookColor?.closest(".holding");

  if (holding) holding.remove();

  pendingBookColors.delete(normalizedBookId);
  originalBookColors.delete(normalizedBookId);

  if (!settingHoldings.querySelector(".holding")) {
    const emptyMessage = document.createElement("div");

    emptyMessage.className = "holdingEmpty";
    emptyMessage.textContent = "No books in this library.";

    settingHoldings.appendChild(emptyMessage);
  }
}

function handleHoldingBookUpdate(message) {
  if (!message || message.type !== "book-updated") return;
  if (message.libraryName && message.libraryName !== CURRENT_LIBRARY) return;

  const isRemoval = message.action === "remove-library" || message.action === "delete-book";

  if (isRemoval && message.bookId) {
    removeDeletedBookFromHoldings(message.bookId);
    return;
  }

  if (window.isRepairMode) return;

  refreshLibraryHoldings();
}

window.addEventListener("book-updated", event => {
  handleHoldingBookUpdate(event.detail);
});

holdingBookUpdateChannel.addEventListener("message", event => {
  handleHoldingBookUpdate(event.data);
});

window.addEventListener("message", event => {
  if (event.origin !== window.location.origin) return;
  handleHoldingBookUpdate(event.data);
});

// ========================================
// Library Settings 불러오기
// ========================================
async function loadLibrarySettings() {
  try {
    if (
      typeof CURRENT_LIBRARY === "undefined" ||
      !CURRENT_LIBRARY
    ) {
      throw new Error(
        "CURRENT_LIBRARY is not defined."
      );
    }

    const timestamp = Date.now();

    const [librariesResponse, booksResponse] =
      await Promise.all([
        fetch(`/libraries?_=${timestamp}`, {
          cache: "no-store"
        }),

        fetch(`/books?_=${timestamp}`, {
          cache: "no-store"
        })
      ]);

    if (!librariesResponse.ok) {
      throw new Error(
        "Failed to load libraries."
      );
    }

    if (!booksResponse.ok) {
      throw new Error(
        "Failed to load books."
      );
    }

    const libraries = await librariesResponse.json();
    const books = await booksResponse.json();

    const currentLibrary = libraries.find(
      library =>
        library.libraryName === CURRENT_LIBRARY
    );

    if (!currentLibrary) {
      throw new Error(
        `Library "${CURRENT_LIBRARY}" was not found.`
      );
    }

    currentLibraryData = currentLibrary;

    renderLibraryInformation(currentLibrary);
    renderLibraryHoldings(books);
  } catch (error) {
    console.error(error);

    settingHoldings.replaceChildren();

    const errorMessage = document.createElement("div");
    errorMessage.className = "holdingEmpty";
    errorMessage.textContent = "Failed to load the library information.";

    settingHoldings.appendChild(errorMessage);
  }
}


// ========================================
// Library 정보 표시
// ========================================
function renderLibraryInformation(library) {
  const libraryColor = normalizeHexColor(library.color) || "#000000";

  settingHouseWall.textContent = library.house || "";
  settingHouseWall.style.color = libraryColor;

  settingHouseTitle.textContent = library.houseTitle || "";
  settingHouseTitle.style.color = libraryColor;

  document.body.style.background = libraryColor;

  settingTitle.textContent = library.editableName || "";
  settingCreatedAt.textContent = `Built on ${formatCreatedAt(library.createdAt)}`;
  settingDescription.textContent = library.description || "";
  settingColorPicker.value = libraryColor;
}

// ========================================
// Book Color
// ========================================
function getBookLibraryEntry(book, libraryName) {
  if (!Array.isArray(book.library)) {
    return null;
  }

  return book.library.find(item => {
    if (typeof item === "string") {
      return item === libraryName;
    }

    return item?.name === libraryName;
  }) || null;
}

function getBookLibraryColor(book, libraryName) {
  const entry = getBookLibraryEntry(
    book,
    libraryName
  );

  if (
    entry &&
    typeof entry === "object" &&
    normalizeHexColor(entry.color)
  ) {
    return normalizeHexColor(entry.color);
  }

  return "#f2edcb";
}

function previewBookColor(bookId, color) {
  const bookElement = document.getElementById(
    String(bookId)
  );

  if (bookElement) {
    bookElement.style.backgroundColor = color;
  }
}


// ========================================
// renderLibraryHoldings
// ========================================
function renderLibraryHoldings(books) {
  settingHoldings.replaceChildren();

  const currentLibraryBooks = books
    .filter(book => {
      if (!Array.isArray(book.library)) return false;

      return book.library.some(item => {
        if (typeof item === "string") return item === CURRENT_LIBRARY;
        return item?.name === CURRENT_LIBRARY;
      });
    })
    .sort((a, b) => {
      const authorA = Array.isArray(a.author) ? a.author.join(", ") : a.author || "";
      const authorB = Array.isArray(b.author) ? b.author.join(", ") : b.author || "";
      const authorCompare = authorA.localeCompare(authorB, "en", { sensitivity: "base" });

      if (authorCompare !== 0) return authorCompare;

      return (a.title || "").localeCompare(b.title || "", "en", { sensitivity: "base" });
    });

  if (currentLibraryBooks.length === 0) {
    const emptyMessage = document.createElement("div");

    emptyMessage.className = "holdingEmpty";
    emptyMessage.textContent = "No books in this library.";

    settingHoldings.appendChild(emptyMessage);
    return;
  }

  currentLibraryBooks.forEach(book => {
    const holding = document.createElement("div");
    const author = document.createElement("div");
    const title = document.createElement("div");
    const bookColor = document.createElement("div");
    const colorPicker = document.createElement("input");
    const bookId = String(book.id);
    const currentColor = pendingBookColors.get(bookId) || getBookLibraryColor(book, CURRENT_LIBRARY);

    holding.className = "holding";

    author.className = "holdingAuthor";
    author.textContent = Array.isArray(book.author) ? book.author.join(", ") : book.author || "";

    title.className = "holdingBookTitle";
    title.textContent = book.title || "";

    bookColor.className = "holdingBookColor";
    bookColor.dataset.bookId = bookId;
    bookColor.style.backgroundColor = currentColor;

    colorPicker.type = "text";
    // colorPicker.type = "color";
    colorPicker.className = "holdingBookColorPicker";
    colorPicker.value = currentColor;
    colorPicker.tabIndex = -1;
    // colorPicker.disabled = !window.isRepairMode;
    colorPicker.setAttribute("data-coloris", "");

    // colorPicker.addEventListener("click", event => {
    //   event.stopPropagation();
    // });

    bookColor.addEventListener("click", event => {
      /*
        colorPicker.click()으로 발생한 이벤트가 다시 bookColor까지
        올라왔을 때 반복 실행되지 않도록 합니다.
      */
      if (event.target !== bookColor) return;

      event.preventDefault();
      event.stopPropagation();

      if (!window.isRepairMode) return;

      colorPicker.click();
    });

    colorPicker.addEventListener("input", event => {
      if (!window.isRepairMode) return;

      const selectedColor = normalizeHexColor(event.target.value);

      if (!selectedColor) return;

      pendingBookColors.set(bookId, selectedColor);
      bookColor.style.backgroundColor = selectedColor;
      previewBookColor(bookId, selectedColor);
    });

    // bookColor.addEventListener("click", event => {
    //   event.preventDefault();
    //   event.stopPropagation();

    //   if (!window.isRepairMode) return;

    //   colorPicker.dispatchEvent(
    //       new MouseEvent("click", {
    //           bubbles: true
    //       })
    //   );
    //   // if (typeof colorPicker.showPicker === "function") {
    //   //   colorPicker.showPicker();
    //   // } else {
    //   //   colorPicker.click();
    //   // }
    // });

    // colorPicker.addEventListener("input", event => {
    //   if (!window.isRepairMode) return;

    //   const selectedColor = normalizeHexColor(event.target.value);

    //   if (!selectedColor) return;

    //   pendingBookColors.set(bookId, selectedColor);
    //   bookColor.style.backgroundColor = selectedColor;
    //   previewBookColor(bookId, selectedColor);
    // });

    const openBookUrl = event => {
      event.preventDefault();
      event.stopPropagation();

      if (book.url) {
        window.open(book.url, "_blank", "noopener,noreferrer");
      }
    };

    author.addEventListener("click", openBookUrl);
    title.addEventListener("click", openBookUrl);

    bookColor.appendChild(colorPicker);
    holding.append(author, title, bookColor);
    settingHoldings.appendChild(holding);
  });
}


// ========================================
// Repair Mode 시작
// ========================================
function startRepairMode() {
  if (!currentLibraryData) return;

  window.isRepairMode = true;
  // isRepairMode = true;

  document.body.classList.add("is-repair-mode");

  // settingHoldings
  // .querySelectorAll(".holdingBookColorPicker")
  // .forEach(picker => {
  //   picker.disabled = false;
  // });

  originalBookColors.clear();
  pendingBookColors.clear();

  settingHoldings
    .querySelectorAll(".holdingBookColor")
    .forEach(element => {
      const bookId = element.dataset.bookId;
      const color = normalizeHexColor(element.style.backgroundColor);

      /*
        style.backgroundColor는 rgb(...) 형식일 수 있으므로
        picker value에서 읽는 편이 안전합니다.
      */
      const picker = element.querySelector(".holdingBookColorPicker");
      const originalColor = normalizeHexColor(picker?.value) || "#f2edcb";
      originalBookColors.set(bookId, originalColor);

    });

  repairOriginalData = {
    house: settingHouseWall.textContent,
    houseTitle: settingHouseTitle.textContent,
    editableName: settingTitle.textContent,
    description: settingDescription.textContent,
    color: normalizeHexColor(currentLibraryData.color) || "#000000"
  };

  // settingHouseWall.contentEditable = "true";
  settingHouseTitle.contentEditable = "true";
  settingTitle.contentEditable = "true";
  settingDescription.contentEditable = "true";

  // settingHouseWall.spellcheck = false;
  settingHouseTitle.spellcheck = false;
  settingTitle.spellcheck = false;
  settingDescription.spellcheck = false;

  // settingHouseWall.classList.add("is-editing");
  // settingHouseTitle.classList.add("is-editing");
  // settingTitle.classList.add("is-editing");
  // settingDescription.classList.add("is-editing");
  librarySettingBorders.forEach(element => {
    element.style.display = "block";
  });

  repairBtn.textContent = "check_circle";
  repairBtnCancel.style.display = "block";
  repairMore.style.display = "flex";

  repairColor.style.display = "block";
  settingColorPicker.value = repairOriginalData.color;
}


// ========================================
// Repair Mode 종료
// ========================================
function endRepairMode() {
  window.isRepairMode = false;
  // isRepairMode = false;

  document.body.classList.remove("is-repair-mode");

  // settingHoldings
  //   .querySelectorAll(".holdingBookColorPicker")
  //   .forEach(picker => {
  //     picker.disabled = true;
  //   });

  // settingHouseWall.contentEditable = "false";
  settingHouseTitle.contentEditable = "false";
  settingTitle.contentEditable = "false";
  settingDescription.contentEditable = "false";

  // settingHouseWall.classList.remove("is-editing");
  // settingHouseTitle.classList.remove("is-editing");
  // settingTitle.classList.remove("is-editing");
  // settingDescription.classList.remove("is-editing");
  librarySettingBorders.forEach(element => {
    element.style.display = "none";
  });

  repairBtn.textContent = "build_circle";
  repairBtnCancel.style.display = "none";
  repairMore.style.display = "none";

  closeMoreDropdown();

  repairColor.style.display = "none";
  repairOriginalData = null;

  originalBookColors.clear();
  pendingBookColors.clear();  
}

// ========================================
// 책 색상을 저장하는 함수 추가
// ========================================
async function savePendingBookColors() {
  if (pendingBookColors.size === 0) return [];

  const booksResponse = await fetch(`/books?_=${Date.now()}`, {
    cache: "no-store"
  });

  if (!booksResponse.ok) {
    throw new Error("Failed to check the current book list.");
  }

  const books = await booksResponse.json();
  const existingBookIds = new Set(books.map(book => String(book.id)));

  const updates = [...pendingBookColors.entries()]
    .filter(([bookId]) => existingBookIds.has(String(bookId)))
    .map(([bookId, color]) => ({
      bookId,
      libraryName: CURRENT_LIBRARY,
      color
    }));

  if (updates.length === 0) {
    pendingBookColors.clear();
    return [];
  }

  const response = await fetch("/books/library-colors", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json;charset=UTF-8"
    },
    body: JSON.stringify({ updates })
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Failed to save book colors.");
  }

  return result.books || [];
}

// ========================================
// 수정 내용 저장
// ========================================
async function saveRepairChanges() {
  const updatedData = {
    // house: settingHouseWall.textContent,
    houseTitle: settingHouseTitle.textContent.trim(),
    editableName: settingTitle.textContent.trim(),
    description: settingDescription.textContent.trim(),
    color: settingColorPicker.value
  };

  repairBtn.disabled = true;
  repairBtnCancel.disabled = true;

  try {
    const response = await fetch(
      `/libraries/${encodeURIComponent(CURRENT_LIBRARY)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedData)
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Failed to save changes."
      );
    }

    await savePendingBookColors();

    currentLibraryData = result.library;
    renderLibraryInformation(result.library);

    const message = {
      type: "book-updated",
      action: "update-library-colors",
      libraryName: CURRENT_LIBRARY
    };

    window.dispatchEvent(
      new CustomEvent("book-updated", {
        detail: message
      })
    );

    holdingBookUpdateChannel.postMessage(message);

    endRepairMode();
    await loadLibrarySettings();
  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    repairBtn.disabled = false;
    repairBtnCancel.disabled = false;
  }
}


// ========================================
// 수정 취소
// ========================================
function cancelRepairChanges() {
  if (!repairOriginalData) {
    endRepairMode();
    return;
  }

  settingHouseWall.textContent = repairOriginalData.house;
  settingHouseTitle.textContent = repairOriginalData.houseTitle;
  settingTitle.textContent = repairOriginalData.editableName;
  settingDescription.textContent = repairOriginalData.description;
  settingHouseWall.style.color = repairOriginalData.color;
  settingHouseTitle.style.color = repairOriginalData.color;
  document.body.style.background = repairOriginalData.color;
  settingColorPicker.value = repairOriginalData.color;

  originalBookColors.forEach(
    (color, bookId) => {
      const holdingColor = settingHoldings.querySelector(`.holdingBookColor[data-book-id="${CSS.escape(bookId)}"]`);

      if (holdingColor) {
        holdingColor.style.backgroundColor = color;
        const picker = holdingColor.querySelector(".holdingBookColorPicker");
        if (picker) {
          picker.value = color;
        }
      }

      previewBookColor(bookId, color);
    }
  );

  pendingBookColors.clear();

  endRepairMode();
}


// ========================================
// HEX 색상 정리
// ========================================
function normalizeHexColor(color) {
  if (typeof color !== "string") {
    return null;
  }

  const value = color.trim();

  if (/^#[0-9a-fA-F]{6}$/.test(value)) {
    return value;
  }

  if (/^#[0-9a-fA-F]{3}$/.test(value)) {
    return (
      "#" +
      value
        .slice(1)
        .split("")
        .map(character =>
          character + character
        )
        .join("")
    );
  }

  return null;
}


// ========================================
// Repair Btn 클릭
// ========================================
repairBtn.addEventListener("click", async () => {
  if (!window.isRepairMode) {
    startRepairMode();
    return;
  }

  await saveRepairChanges();
});
// repairBtn.addEventListener("click", async () => {
//   if (!isRepairMode) {
//     startRepairMode();
//     return;
//   }

//   await saveRepairChanges();
// });


// ========================================
// Repair Cancel 클릭
// ========================================
repairBtnCancel.addEventListener("click", cancelRepairChanges);


// ========================================
// Title 변경
// ========================================
settingTitle.addEventListener("input", () => {
  if (!window.isRepairMode) return;
  libraryHeader.textContent = settingTitle.textContent;
});
// settingTitle.addEventListener("input", () => {
//   if (!isRepairMode) return;

//   libraryHeader.textContent =
//     settingTitle.textContent;
// });


// ========================================
// Color Picker 변경
// ========================================
function positionColorPicker() {
  const picker = document.getElementById("clr-picker");
  if (!picker) return;

  const rect = settingColorPicker.getBoundingClientRect();

  picker.style.position = "fixed";
  picker.style.left = `${rect.left + 5}px`;
  picker.style.top = `${rect.bottom + 10}px`;
}

settingColorPicker.addEventListener("click", () => {
  requestAnimationFrame(() => {
    positionColorPicker();
  });
});

settingColorPicker.addEventListener("input", event => {
  if (!window.isRepairMode) return;

  const selectedColor = normalizeHexColor(event.target.value);

  if (!selectedColor) return;

  settingHouseWall.style.color = selectedColor;
  settingHouseTitle.style.color = selectedColor;
  document.body.style.backgroundColor = selectedColor;
});



// settingColorPicker.addEventListener(
//   "input",
//   event => {
//     if (!window.isRepairMode) return;
//     // if (!isRepairMode) return;

//     const selectedColor = event.target.value;
//     settingHouseWall.style.color = selectedColor;
//     settingHouseTitle.style.color = selectedColor;
//     document.body.style.background = selectedColor;
//   }
// );


// ========================================
// 날짜 포맷
// ========================================
function formatCreatedAt(createdAt) {
  if (!createdAt) return "";

  const d = new Date(createdAt);

  if (Number.isNaN(d.getTime())) {
    return createdAt;
  }

  const pad = number => String(number).padStart(2, "0");
  let hour = d.getHours();
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;

  return (
    `${pad(d.getMonth() + 1)}/` +
    `${pad(d.getDate())}/` +
    `${d.getFullYear()}, ` +
    `${hour}:` +
    `${pad(d.getMinutes())}:` +
    `${pad(d.getSeconds())} ` +
    `${ampm}`
  );
}

// ========================================
// More Dropdown
// ========================================
function openMoreDropdown() {
  dropdownMore.classList.add("is-open");
  repairBtnMore.setAttribute("aria-expanded", "true");
}

function closeMoreDropdown() {
  dropdownMore.classList.remove("is-open");
  repairBtnMore.setAttribute("aria-expanded", "false");
}

function toggleMoreDropdown() {
  const isOpen = dropdownMore.classList.toggle("is-open");
  repairBtnMore.setAttribute("aria-expanded", String(isOpen));
}

repairBtnMore.setAttribute("aria-expanded", "false");
repairBtnMore.addEventListener("click", event => {
  // document 클릭 이벤트까지 전달되어
  // 바로 닫히는 것을 방지
  event.stopPropagation();
  toggleMoreDropdown();
});

dropdownMore.addEventListener("click", event => {
  // 드롭다운 내부 클릭은 바깥 클릭으로 처리하지 않음
  event.stopPropagation();
});

document.addEventListener("click", event => {
  if (!repairMore.contains(event.target)) {
    closeMoreDropdown();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeMoreDropdown();
    closeDeleteLibraryModal();
  }
});


// ========================================
// Password Modal 열기
// ========================================
function openPasswordModal() {
  closeMoreDropdown();

  currentLibraryPassword.value = "";
  newLibraryPassword.value = "";
  passwordModalMessage.textContent = "";

  currentPasswordStep.style.display = "block";
  newPasswordStep.style.display = "none";

  passwordModal.classList.add("is-open");

  requestAnimationFrame(() => {
    currentLibraryPassword.focus();
  });
}


// ========================================
// Password Modal 닫기
// ========================================
function closePasswordModal() {
  // if (
  //   verifyCurrentPassword.disabled ||
  //   saveNewPassword.disabled
  // ) {
  //   return;
  // }

  passwordModal.classList.remove("is-open");

  currentLibraryPassword.value = "";
  newLibraryPassword.value = "";
  passwordModalMessage.textContent = "";

  currentPasswordStep.style.display = "block";
  newPasswordStep.style.display = "none";
}


// ========================================
// Change Password 버튼
// ========================================
settingPassword.addEventListener("click", openPasswordModal);


// ========================================
// Cancel 버튼
// ========================================
passwordModalCancel.addEventListener("click", closePasswordModal);
newPasswordCancel.addEventListener("click", closePasswordModal);


// ========================================
// 모달 바깥 클릭 시 닫기
// ========================================
passwordModal.addEventListener("click", event => {
    if (event.target === passwordModal) {
      closePasswordModal();
    }
  }
);


// ========================================
// 기존 비밀번호 확인
// ========================================
async function checkCurrentPassword() {
  const currentPassword = currentLibraryPassword.value;

  if (!currentPassword) {
    passwordModalMessage.textContent = "Please enter the current password.";
    currentLibraryPassword.focus();
    return;
  }

  verifyCurrentPassword.disabled = true;
  passwordModalCancel.disabled = true;
  currentLibraryPassword.disabled = true;

  passwordModalMessage.textContent = "Checking password...";

  try {
    const response = await fetch(
      `/libraries/${encodeURIComponent(
        CURRENT_LIBRARY
      )}/verify-password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password: currentPassword
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message ||
        "The current password is incorrect."
      );
    }

    passwordModalMessage.textContent = "";

    // 기존 비밀번호가 맞으면
    // 새 비밀번호 입력 단계 표시
    currentPasswordStep.style.display = "none";
    newPasswordStep.style.display = "block";

    requestAnimationFrame(() => {
      newLibraryPassword.focus();
    });
  } catch (error) {
    console.error(error);

    passwordModalMessage.textContent = error.message;

    currentLibraryPassword.select();
    currentLibraryPassword.focus();
  } finally {
    verifyCurrentPassword.disabled = false;
    passwordModalCancel.disabled = false;
    currentLibraryPassword.disabled = false;
  }
}

verifyCurrentPassword.addEventListener("click", checkCurrentPassword);

currentLibraryPassword.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkCurrentPassword();
    }
  }
);


// ========================================
// 새 비밀번호 저장
// ========================================
async function changeLibraryPassword() {
  const currentPassword = currentLibraryPassword.value;
  const newPassword = newLibraryPassword.value;

  if (!newPassword) {
    passwordModalMessage.textContent = "Please enter a new password.";

    newLibraryPassword.focus();
    return;
  }

  saveNewPassword.disabled = true;
  newPasswordCancel.disabled = true;
  newLibraryPassword.disabled = true;

  passwordModalMessage.textContent = "Saving password...";

  try {
    const response = await fetch(
      `/libraries/${encodeURIComponent(
        CURRENT_LIBRARY
      )}/password`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message ||
        "Failed to change the password."
      );
    }

    // 닫기 전에 disabled 해제
    saveNewPassword.disabled = false;
    newPasswordCancel.disabled = false;
    newLibraryPassword.disabled = false;

    closePasswordModal();

    alert("The library password has been changed successfully.");
  } catch (error) {
    console.error(error);

    passwordModalMessage.textContent = error.message;

    newLibraryPassword.select();
    newLibraryPassword.focus();
  } finally {
    saveNewPassword.disabled = false;
    newPasswordCancel.disabled = false;
    newLibraryPassword.disabled = false;
  }
}

passwordChangeForm.addEventListener("submit", event => {
    event.preventDefault();
    if (
      newPasswordStep.style.display !== "none"
    ) {
      changeLibraryPassword();
    }
  }
);

// saveNewPassword.addEventListener(
//   "click",
//   changeLibraryPassword
// );

// newLibraryPassword.addEventListener(
//   "keydown",
//   event => {
//     if (event.key === "Enter") {
//       event.preventDefault();
//       changeLibraryPassword();
//     }
//   }
// );


// ========================================
// Escape 키
// ========================================
document.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      passwordModal.classList.contains("is-open")
    ) {
      closePasswordModal();
    }
  }
);


// ========================================
// Library Delete Modal
// ========================================
function openDeleteLibraryModal() {
  closeMoreDropdown();

  deleteLibraryPassword.value = "";
  deleteLibraryMessage.textContent = "";
  deleteLibraryModal.classList.add("is-open");

  requestAnimationFrame(() => {
    deleteLibraryPassword.focus();
  });
}

function closeDeleteLibraryModal() {
  if (deleteLibraryConfirm.disabled) {
    return;
  }

  deleteLibraryModal.classList.remove("is-open");
  deleteLibraryPassword.value = "";
  deleteLibraryMessage.textContent = "";
}

settingDelete.addEventListener("click", openDeleteLibraryModal);
deleteLibraryCancel.addEventListener("click", closeDeleteLibraryModal);

// 회색 배경을 클릭하면 닫기
deleteLibraryModal.addEventListener("click", event => {
    if (event.target === deleteLibraryModal) {
      closeDeleteLibraryModal();
    }
  }
);

// deleteLibraryPassword.addEventListener(
//   "keydown",
//   event => {
//     if (event.key === "Enter") {
//       event.preventDefault();
//       deleteCurrentLibrary();
//     }
//   }
// );


// ========================================
// Library 완전 삭제
// ========================================
async function deleteCurrentLibrary() {
  const password = deleteLibraryPassword.value;

  if (!password) {
    deleteLibraryMessage.textContent = "Please enter the library password.";
    deleteLibraryPassword.focus();
    return;
  }

  deleteLibraryConfirm.disabled = true;
  deleteLibraryCancel.disabled = true;
  deleteLibraryPassword.disabled = true;
  deleteLibraryMessage.textContent = "Deleting library...";

  try {
    const response = await fetch(
      `/libraries/${encodeURIComponent(CURRENT_LIBRARY)}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password
        })
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(
        result.message || "Failed to delete the library."
      );
    }

    // 삭제된 Library 페이지를 더 이상 유지하지 않고
    // 메인 페이지로 이동
    window.location.replace("/");
  } catch (error) {
    console.error(error);

    deleteLibraryMessage.textContent = error.message;
    deleteLibraryPassword.select();
    deleteLibraryPassword.focus();
  } finally {
    deleteLibraryConfirm.disabled = false;
    deleteLibraryCancel.disabled = false;
    deleteLibraryPassword.disabled = false;
  }
}

deleteLibraryForm.addEventListener(
  "submit",
  event => {
    event.preventDefault();
    deleteCurrentLibrary();
  }
);
// deleteLibraryConfirm.addEventListener("click", deleteCurrentLibrary);

// ========================================
// ========================================
// Library Settings 초기화
// ========================================
let isLibrarySettingsInitialized = false;

async function initializeLibrarySettings() {
  if (isLibrarySettingsInitialized) return;

  if (
    typeof CURRENT_LIBRARY === "undefined" ||
    !CURRENT_LIBRARY
  ) {
    requestAnimationFrame(initializeLibrarySettings);
    return;
  }

  if (
    !document.getElementById("settingHouseWall") ||
    !document.getElementById("settingHouseTitle") ||
    !document.getElementById("settingTitle") ||
    !document.getElementById("settingCreatedAt") ||
    !document.getElementById("settingDescription") ||
    !document.getElementById("settingHoldings")
  ) {
    requestAnimationFrame(initializeLibrarySettings);
    return;
  }

  // initializeColoris();

  isLibrarySettingsInitialized = true;
  await loadLibrarySettings();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeLibrarySettings,
    { once: true }
  );
} else {
  initializeLibrarySettings();
}

window.addEventListener("pageshow", event => {
  if (event.persisted) {
    isLibrarySettingsInitialized = false;
    initializeLibrarySettings();
  }
});

// document.addEventListener(
//   "DOMContentLoaded",
//   loadLibrarySettings
// );
