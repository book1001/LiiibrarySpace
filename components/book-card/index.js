export function initBookCard() {
  const bookCard = document.getElementById("bookCard");
  const cardTitle = document.getElementById("cardTitle");
  const cardAuthor = document.getElementById("cardAuthor");
  const cardLibrary = document.getElementById("cardLibrary");
  const cardNote = document.getElementById("cardNote");
  const openBookBtn = document.getElementById("openBookBtn");
  const liveNoteDate = document.getElementById("liveNoteDate");
  const noteBorrowerInput = document.getElementById("noteBorrowerInput");
  const noteCommentInput = document.getElementById("noteCommentInput");
  const addNoteSubmitBtn = document.getElementById("addNoteSubmitBtn");
  const closeBookCardBtn = document.getElementById("closeBookCardBtn");

  // Library dropdown
  const addLibraryBtn = document.getElementById("addLibrary");
  const libraryDropdown = document.getElementById("libraryDropdown");
  const libraryCheckboxList = document.getElementById(
    "libraryCheckboxList"
  );


  let currentBookId = "";
  let currentBook = null;
  let currentBookUrl = "";

  let allLibraries = [];

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getLocalTimeText() {
    const now = new Date();

    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const year = now.getFullYear();

    let hour = now.getHours();
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");

    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;
    if (hour === 0) hour = 12;

    hour = String(hour).padStart(2, "0");

    return `${month}/${day}/${year}, ${hour}:${minute}:${second} ${ampm}`;
  }

  function getLocalDateText() {
    const now = new Date();

    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const year = now.getFullYear();

    // 화면 표시용
    return `${month}/${day}/${year}`;
  }

  function updateLiveNoteDate() {
    liveNoteDate.textContent = getLocalDateText();
  }

  updateLiveNoteDate();
  // setInterval(updateLiveNoteDate, 1000);

  function renderNotes(notes) {
    if (Array.isArray(notes) && notes.length > 0) {
      cardNote.innerHTML = [...notes].reverse().map(note => {
        return `
          <div class="list-item">
            <div>${escapeHtml(note.date.split(",")[0])}</div>
            <div>${escapeHtml(note.borrower)}</div>
            <div>${escapeHtml(note.comment)}</div>
          </div>
          <br />
        `;
      }).join("");
    } else {
      cardNote.textContent = "";
    }
  }

  // =======================
  function renderCardLibraries() {
    const bookLibraries = Array.isArray(currentBook?.library)
      ? currentBook.library
      : [];

    cardLibrary.textContent = bookLibraries.join(", ");
  }

  /**
   * libraries.json의 라이브러리 목록을 가져옵니다.
   *
   * 서버에서는 password를 제외하고
   * libraryName과 bookSharing만 보내야 합니다.
   */
  async function loadLibraries() {
    try {
      const response = await fetch("/libraries");

      if (!response.ok) {
        throw new Error("라이브러리 목록을 불러오지 못했습니다.");
      }

      const result = await response.json();

      allLibraries = Array.isArray(result)
        ? result
        : [];

      renderLibraryCheckboxes();
    } catch (error) {
      console.error(error);

      libraryCheckboxList.textContent =
        "라이브러리 목록을 불러오지 못했습니다.";
    }
  }

  /**
   * 현재 책의 library 배열을 기준으로
   * 체크박스를 생성합니다.
   */
  function renderLibraryCheckboxes() {
    libraryCheckboxList.innerHTML = "";

    if (!currentBook) {
      return;
    }

    const currentLibraries = Array.isArray(currentBook.library)
      ? currentBook.library
      : [];

    // --------------------------------------------------
    // Central Library
    // 항상 체크되어 있고 해제할 수 없음
    // --------------------------------------------------
    const centralItem = document.createElement("div");
    centralItem.className = "library-checkbox-item";

    const centralCheckbox = document.createElement("input");
    centralCheckbox.type = "checkbox";
    centralCheckbox.id = "book-library-central";
    centralCheckbox.checked = true;
    centralCheckbox.disabled = true;

    const centralLabel = document.createElement("label");
    centralLabel.htmlFor = "book-library-central";
    centralLabel.textContent = "Central Library";

    centralItem.append(
      centralCheckbox,
      centralLabel
    );

    libraryCheckboxList.appendChild(centralItem);

    // --------------------------------------------------
    // libraries.json의 나머지 라이브러리
    // --------------------------------------------------
    allLibraries.forEach(library => {
      const libraryName = library.libraryName;

      if (!libraryName) {
        return;
      }

      const item = document.createElement("div");
      item.className = "library-checkbox-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = currentLibraries.includes(libraryName);

      const checkboxId = `book-library-${libraryName.replace(
        /[^A-Za-z0-9_-]/g,
        "-"
      )}`;

      checkbox.id = checkboxId;

      const label = document.createElement("label");
      label.htmlFor = checkboxId;
      label.textContent = libraryName;

      if (library.bookSharing === "패스워드 필요") {
        const lockMark = document.createElement("span");
        lockMark.textContent = "🔒";
        lockMark.title = "등록 또는 제거할 때 패스워드가 필요합니다.";

        label.append(" ", lockMark);
      }

      checkbox.addEventListener("change", async () => {
        await updateBookLibrary({
          library,
          checkbox,
          item
        });
      });

      item.append(checkbox, label);
      libraryCheckboxList.appendChild(item);
    });
  }

  /**
   * 체크박스 변경 내용을 서버에 저장합니다.
   */
  async function updateBookLibrary({
    library,
    checkbox,
    item
  }) {
    if (!currentBookId || !currentBook) {
      checkbox.checked = !checkbox.checked;
      return;
    }

    const libraryName = library.libraryName;
    const shouldAdd = checkbox.checked;

    let password = "";

    if (library.bookSharing === "패스워드 필요") {
      const actionText = shouldAdd
        ? "등록"
        : "제거";

      const enteredPassword = window.prompt(
        `${libraryName}을(를) ${actionText}하려면 패스워드를 입력해주세요.`
      );

      // Cancel을 누른 경우 기존 상태로 되돌리기
      if (enteredPassword === null) {
        checkbox.checked = !shouldAdd;
        return;
      }

      password = enteredPassword;
    }

    checkbox.disabled = true;
    item.classList.add("is-loading");

    try {
      const response = await fetch(
        `/books/${encodeURIComponent(currentBookId)}/libraries`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json;charset=UTF-8"
          },
          body: JSON.stringify({
            libraryName,
            action: shouldAdd ? "add" : "remove",
            password
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "라이브러리 정보를 변경하지 못했습니다."
        );
      }

      // 서버에서 반환된 최신 book 데이터로 교체
      currentBook = result.book;

      renderCardLibraries();
      renderLibraryCheckboxes();
    } catch (error) {
      console.error(error);

      // 저장 실패 시 체크 상태를 원래대로 복구
      checkbox.checked = !shouldAdd;

      alert(error.message);
    } finally {
      checkbox.disabled = false;
      item.classList.remove("is-loading");
    }
  }

  // ==================

  function showBookCard(book) {
    currentBook = book;
    currentBookId = book.id;
    currentBookUrl = book.url;

    noteBorrowerInput.value = "";
    noteCommentInput.value = "";

    cardTitle.textContent = book.title || "";

    cardAuthor.textContent = Array.isArray(book.author)
      ? book.author.join(", ")
      : "";

    // cardLibrary.textContent = Array.isArray(book.library)
    //   ? book.library.join(", ")
    //   : "";

    renderCardLibraries();
    renderLibraryCheckboxes();

    renderNotes(book.note);

    libraryDropdown.classList.remove("is-open");
    bookCard.style.display = "block";
  }

// ===========================
  async function submitNote() {
    if (!currentBookId) {
      return;
    }

    const borrower = noteBorrowerInput.value.trim();
    const comment = noteCommentInput.value.trim();

    if (!borrower && !comment) {
      alert("borrower 또는 comment를 입력해주세요.");
      return;
    }

    try {
      const response = await fetch(
        `/books/${encodeURIComponent(currentBookId)}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json;charset=UTF-8"
          },
          body: JSON.stringify({
            date: getLocalTimeText(),
            borrower,
            comment
          })
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
          "노트를 저장하지 못했습니다."
        );
      }

      currentBook = result.book;

      noteBorrowerInput.value = "";
      noteCommentInput.value = "";

      renderNotes(currentBook.note);
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }

  /**
   * Add Library 버튼 클릭 시 드롭다운 토글
   */
  addLibraryBtn.addEventListener("click", async event => {
    event.preventDefault();
    event.stopPropagation();

    if (!currentBook) {
      return;
    }

    const willOpen =
      !libraryDropdown.classList.contains("is-open");

    libraryDropdown.classList.toggle("is-open");

    if (willOpen) {
      await loadLibraries();
    }
  });

  /**
   * 드롭다운 내부를 클릭했을 때 닫히지 않도록 설정
   */
  libraryDropdown.addEventListener("click", event => {
    event.stopPropagation();
  });

  /**
   * 드롭다운 바깥을 클릭하면 닫기
   */
  document.addEventListener("click", event => {
    if (
      !libraryDropdown.contains(event.target) &&
      event.target !== addLibraryBtn
    ) {
      libraryDropdown.classList.remove("is-open");
    }
  });
  // async function submitNote() {
  //   if (!currentBookId) return;

  //   const borrower = noteBorrowerInput.value.trim();
  //   const comment = noteCommentInput.value.trim();

  //   if (!borrower && !comment) {
  //     alert("borrower 또는 comment를 입력해주세요.");
  //     return;
  //   }

  //   const response = await fetch(`/books/${currentBookId}/notes`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json;charset=UTF-8"
  //     },
  //     body: JSON.stringify({
  //       date: getLocalTimeText(),
  //       borrower,
  //       comment
  //     })
  //   });

  //   const result = await response.json();

  //   if (result.success) {
  //     currentBook = result.book;

  //     noteBorrowerInput.value = "";
  //     noteCommentInput.value = "";

  //     renderNotes(currentBook.note);
  //   } else {
  //     alert(result.message);
  //   }
  // }

  // addNoteSubmitBtn.addEventListener("click", submitNote);



  // =====================
  [noteBorrowerInput, noteCommentInput].forEach(input => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitNote();
      }
    });
  });

  // addNoteSubmitBtn.addEventListener("click", async () => {
  //   if (!currentBookId) return;

  //   const borrower = noteBorrowerInput.value.trim();
  //   const comment = noteCommentInput.value.trim();

  //   if (!borrower && !comment) {
  //     alert("borrower 또는 comment를 입력해주세요.");
  //     return;
  //   }

  //   const response = await fetch(`/books/${currentBookId}/notes`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json;charset=UTF-8"
  //     },
  //     body: JSON.stringify({
  //       date: getLocalTimeText(),
  //       borrower,
  //       comment
  //     })
  //   });

  //   const result = await response.json();

  //   if (result.success) {
  //     currentBook = result.book;

  //     noteBorrowerInput.value = "";
  //     noteCommentInput.value = "";

  //     renderNotes(currentBook.note);
  //   } else {
  //     alert(result.message);
  //   }
  // });

  openBookBtn.addEventListener("click", () => {
    if (currentBookUrl) {
      window.open(currentBookUrl, "_blank", "noopener,noreferrer");
    }
  });

  closeBookCardBtn.addEventListener("click", () => {
    bookCard.style.display = "none";

    currentBook = null;
    currentBookId = "";
    currentBookUrl = "";

    noteBorrowerInput.value = "";
    noteCommentInput.value = "";
  });

  return {
    showBookCard
  };
}