export function initBookCard() {
  const bookCard = document.getElementById("bookCard");
  const cardTitle = document.getElementById("cardTitle");
  const cardAuthor = document.getElementById("cardAuthor");
  const cardLibrary = document.getElementById("cardLibrary");
  const cardNote = document.getElementById("cardNote");
  const openBookBtn = document.getElementById("openBookBtn");
  const copyBookURL = document.getElementById("copyBookURL");
  const liveNoteDate = document.getElementById("liveNoteDate");
  const noteBorrowerInput = document.getElementById("noteBorrowerInput");
  const noteCommentInput = document.getElementById("noteCommentInput");
  const addNoteSubmitBtn = document.getElementById("addNoteSubmitBtn");
  const closeBookCardBtn = document.getElementById("closeBookCardBtn");

  const addLibraryBtn = document.getElementById("addLibrary");
  const libraryDropdown = document.getElementById("libraryDropdown");
  const libraryCheckboxList = document.getElementById("libraryCheckboxList");

  let currentBookId = "";
  let currentBook = null;
  let currentBookUrl = "";
  let allLibraries = [];

  const bookUpdateChannel = new BroadcastChannel("book-updates");


  // ======================================================
  // BOOK UPDATE
  // ======================================================
  function notifyBookUpdated(detail = {}) {
    const message = {
      type: "book-updated",
      ...detail
    };

    window.dispatchEvent(
      new CustomEvent("book-updated", {
        detail: message
      })
    );

    bookUpdateChannel.postMessage(message);

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(message, window.location.origin);
    }
  }


  // ======================================================
  // 다른 창에서 같은 Book이 수정된 경우
  // ======================================================
  bookUpdateChannel.addEventListener("message", event => {
    const message = event.data;

    if (
      !message ||
      message.type !== "book-updated" ||
      !message.book ||
      message.book.id !== currentBookId
    ) {
      return;
    }

    currentBook = message.book;

    renderCardLibraries();
    renderLibraryCheckboxes();
  });


  // ======================================================
  // ESCAPE HTML
  // ======================================================
  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  // ======================================================
  // DATE
  // ======================================================
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

    if (hour === 0) {
      hour = 12;
    }

    hour = String(hour).padStart(2, "0");

    return `${month}/${day}/${year}, ${hour}:${minute}:${second} ${ampm}`;
  }


  function getLocalDateText() {
    const now = new Date();

    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const year = now.getFullYear();

    return `${month}/${day}/${year}`;
  }


  function updateLiveNoteDate() {
    liveNoteDate.textContent = getLocalDateText();
  }

  updateLiveNoteDate();


  // ======================================================
  // NOTES
  // ======================================================
  function renderNotes(notes) {
    if (Array.isArray(notes) && notes.length > 0) {
      cardNote.innerHTML = [...notes]
        .reverse()
        .map(note => {
          return `
            <div class="list-item">
              <div class="list-date">${escapeHtml(note.date.split(",")[0])}</div>
              <div>${escapeHtml(note.borrower)}</div>
              <div>${escapeHtml(note.comment)}</div>
            </div>
          `;
        })
        .join("");
    } else {
      cardNote.textContent = "";
    }
  }


  // ======================================================
  // POPUP
  // ======================================================
  function openBookPopup(url) {
    if (!url) {
      return;
    }

    const width = 1200;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    window.open(
      url,
      "_blank",
      `popup=yes,width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  }


  // ======================================================
  // CARD LIBRARIES
  // ======================================================
  function renderCardLibraries() {
    const bookLibraries = Array.isArray(currentBook?.library)
      ? currentBook.library
      : [];

    cardLibrary.textContent = bookLibraries
      .map(item => {
        if (typeof item === "string") {
          return item;
        }

        return item?.name || item?.libraryName || "";
      })
      .filter(Boolean)
      .join(", ");
  }


  // ======================================================
  // LIBRARIES LOAD
  // ======================================================
  async function loadLibraries() {
    try {
      const response = await fetch(`/libraries?_=${Date.now()}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("Failed to load the library list");
      }

      const result = await response.json();

      allLibraries = Array.isArray(result) ? result : [];

      renderLibraryCheckboxes();
    } catch (error) {
      console.error(error);
      libraryCheckboxList.textContent = "Failed to load the library list";
    }
  }


  // ======================================================
  // LIBRARY CHECKBOXES
  // ======================================================
  function renderLibraryCheckboxes() {
    libraryCheckboxList.innerHTML = "";

    if (!currentBook) {
      return;
    }

    const currentLibraryNames = Array.isArray(currentBook.library)
      ? currentBook.library
          .map(item => {
            if (typeof item === "string") {
              return item;
            }

            return item?.name || item?.libraryName || "";
          })
          .filter(Boolean)
      : [];


    // --------------------------------------------------
    // Central Liiibrary
    // --------------------------------------------------
    const centralItem = document.createElement("div");
    const centralCheckbox = document.createElement("input");
    const centralLabel = document.createElement("label");

    centralItem.className = "library-checkbox-item";

    centralCheckbox.type = "checkbox";
    centralCheckbox.id = "book-library-central";
    centralCheckbox.checked = true;
    centralCheckbox.disabled = true;

    centralLabel.htmlFor = "book-library-central";
    centralLabel.textContent = "Central Liiibrary";

    centralItem.append(centralCheckbox, centralLabel);
    libraryCheckboxList.appendChild(centralItem);


    // --------------------------------------------------
    // Local Libraries
    // --------------------------------------------------
    allLibraries.forEach(library => {
      const libraryName = library.libraryName;

      if (!libraryName || libraryName === "Central Liiibrary") {
        return;
      }

      const item = document.createElement("div");
      const checkbox = document.createElement("input");
      const label = document.createElement("label");

      item.className = "library-checkbox-item";

      checkbox.type = "checkbox";
      checkbox.checked = currentLibraryNames.includes(libraryName);

      const checkboxId = `book-library-${libraryName.replace(/[^A-Za-z0-9_-]/g, "-")}`;

      checkbox.id = checkboxId;

      label.htmlFor = checkboxId;
      label.textContent = libraryName;

      if (library.bookSharing === "private") {
        const lockMark = document.createElement("span");

        lockMark.textContent = "❋";
        lockMark.title = "Password required to add or remove this library";

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


  // ======================================================
  // LIBRARY ADD / REMOVE
  // ======================================================
  async function updateBookLibrary({ library, checkbox, item }) {
    if (!currentBookId || !currentBook) {
      checkbox.checked = !checkbox.checked;
      return;
    }

    const libraryName = library.libraryName;
    const shouldAdd = checkbox.checked;

    let password = "";

    if (library.bookSharing === "private") {
      const actionText = shouldAdd ? "add" : "remove";
      const enteredPassword = window.prompt(
        `Please enter the password to ${actionText} ${libraryName}`
      );

      if (enteredPassword === null) {
        checkbox.checked = !shouldAdd;
        return;
      }

      password = enteredPassword;
    }

    checkbox.disabled = true;
    item.classList.add("is-loading");

    try {
      // --------------------------------------------------
      // Mirror 데이터 제거
      // --------------------------------------------------
      if (!shouldAdd) {
        bookUpdateChannel.postMessage({
          type: "delete-book-mirror-data",
          bookId: currentBookId,
          libraryName
        });

        await new Promise(resolve => {
          setTimeout(resolve, 300);
        });
      }


      // --------------------------------------------------
      // 서버 업데이트
      // --------------------------------------------------
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
          "Failed to update the library information"
        );
      }


      // --------------------------------------------------
      // 최신 Book 데이터
      // --------------------------------------------------
      currentBook = result.book;

      renderCardLibraries();
      renderLibraryCheckboxes();


      // --------------------------------------------------
      // 실시간 업데이트
      // --------------------------------------------------
      notifyBookUpdated({
        action: shouldAdd ? "add-library" : "remove-library",
        bookId: currentBookId,
        libraryName,
        libraries: [libraryName],
        book: currentBook
      });
    } catch (error) {
      console.error(error);

      checkbox.checked = !shouldAdd;

      alert(error.message);
    } finally {
      checkbox.disabled = false;
      item.classList.remove("is-loading");
    }
  }


  // ======================================================
  // SHOW BOOK CARD
  // ======================================================
  function showBookCard(book) {
    currentBook = book;
    currentBookId = book.id;
    currentBookUrl = book.url;

    noteBorrowerInput.value = "";
    noteCommentInput.value = "";
    cardTitle.innerHTML = "";

    const titleHeading = document.createElement("h2");

    titleHeading.textContent = book.title || "";
    cardTitle.appendChild(titleHeading);

    cardTitle.removeAttribute("href");
    cardTitle.removeAttribute("target");

    cardAuthor.textContent = Array.isArray(book.author)
      ? book.author.join(", ")
      : "";

    renderCardLibraries();
    renderLibraryCheckboxes();
    renderNotes(book.note);

    libraryDropdown.classList.remove("is-open");
    bookCard.style.display = "block";

    noteBorrowerInput.focus();
  }


  // ======================================================
  // CARD TITLE
  // ======================================================
  cardTitle.addEventListener("click", event => {
    event.preventDefault();
    openBookPopup(currentBookUrl);
  });


  // ======================================================
  // NOTE SUBMIT
  // ======================================================
  async function submitNote() {
    if (!currentBookId) {
      return;
    }

    const borrower = noteBorrowerInput.value.trim();
    const comment = noteCommentInput.value.trim();

    if (!borrower && !comment) {
      alert("Please enter a borrower or a comment");
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
          "Failed to save the note"
        );
      }

      currentBook = result.book;

      noteBorrowerInput.value = "";
      noteCommentInput.value = "";

      renderNotes(currentBook.note);

      notifyBookUpdated({
        action: "update-note",
        bookId: currentBookId,
        book: currentBook
      });
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  }


  // ======================================================
  // LIBRARY DROPDOWN
  // ======================================================
  addLibraryBtn.addEventListener("click", async event => {
    event.preventDefault();
    event.stopPropagation();

    if (!currentBook) {
      return;
    }

    const willOpen = !libraryDropdown.classList.contains("is-open");

    libraryDropdown.classList.toggle("is-open");

    if (willOpen) {
      await loadLibraries();
    }
  });


  libraryDropdown.addEventListener("click", event => {
    event.stopPropagation();
  });


  document.addEventListener("click", event => {
    if (
      !libraryDropdown.contains(event.target) &&
      event.target !== addLibraryBtn
    ) {
      libraryDropdown.classList.remove("is-open");
    }
  });


  // ======================================================
  // NOTE ENTER
  // ======================================================
  [noteBorrowerInput, noteCommentInput].forEach(input => {
    input.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitNote();
      }
    });
  });


  if (addNoteSubmitBtn) {
    addNoteSubmitBtn.addEventListener("click", event => {
      event.preventDefault();
      submitNote();
    });
  }


  // ======================================================
  // OPEN BOOK
  // ======================================================
  openBookBtn.addEventListener("click", () => {
    openBookPopup(currentBookUrl);
  });


  // ======================================================
  // TOAST
  // ======================================================
  function showToast(message) {
    const toast = document.createElement("div");

    toast.className = "toast";
    toast.textContent = message;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("show");
    });

    setTimeout(() => {
      toast.classList.remove("show");

      toast.addEventListener(
        "transitionend",
        () => toast.remove(),
        {
          once: true
        }
      );
    }, 1800);
  }


  // ======================================================
  // COPY URL
  // ======================================================
  copyBookURL.addEventListener("click", async () => {
    if (!currentBookUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(currentBookUrl);
      showToast("Book URL copied!");
    } catch (error) {
      console.error(error);
      showToast("Failed to copy URL.");
    }
  });


  // ======================================================
  // CLOSE BOOK CARD
  // ======================================================
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