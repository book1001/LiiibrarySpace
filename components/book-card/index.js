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

  let currentBookId = "";
  let currentBook = null;
  let currentBookUrl = "";

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

  function updateLiveNoteDate() {
    liveNoteDate.textContent = getLocalTimeText();
  }

  updateLiveNoteDate();
  setInterval(updateLiveNoteDate, 1000);

  function renderNotes(notes) {
    if (Array.isArray(notes) && notes.length > 0) {
      cardNote.innerHTML = [...notes].reverse().map(note => {
        return `
          <div class="list-item">
            <div>${escapeHtml(note.date)}</div>
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

    cardLibrary.textContent = Array.isArray(book.library)
      ? book.library.join(", ")
      : "";

    renderNotes(book.note);

    bookCard.style.display = "block";
  }

  addNoteSubmitBtn.addEventListener("click", async () => {
    if (!currentBookId) return;

    const borrower = noteBorrowerInput.value.trim();
    const comment = noteCommentInput.value.trim();

    if (!borrower && !comment) {
      alert("borrower 또는 comment를 입력해주세요.");
      return;
    }

    const response = await fetch(`/books/${currentBookId}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      },
      body: JSON.stringify({
        date: getLocalTimeText(),
        borrower,
        comment
      })
    });

    const result = await response.json();

    if (result.success) {
      currentBook = result.book;

      noteBorrowerInput.value = "";
      noteCommentInput.value = "";

      renderNotes(currentBook.note);
    } else {
      alert(result.message);
    }
  });

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