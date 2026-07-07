const bookList = document.getElementById("bookList");
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

function getCurrentTimeText() {
  return new Date().toLocaleString();
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


function renderNotes(notes) {
  if (Array.isArray(notes) && notes.length > 0) {
    cardNote.innerHTML = [...notes].reverse().map(note => {
      return `
        <div>
          <div><strong>Date:</strong> ${escapeHtml(note.date)}</div>
          <div><strong>Borrower:</strong> ${escapeHtml(note.borrower)}</div>
          <div><strong>Comment:</strong> ${escapeHtml(note.comment)}</div>
        </div>
        <br />
      `;
    }).join("");
  } else {
    cardNote.textContent = "";
  }
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

function openBook(url) {
  window.open(url, "_blank", "noopener,noreferrer");
}

openBookBtn.addEventListener("click", () => {
  if (currentBookUrl) {
    openBook(currentBookUrl);
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

// Filter
const CURRENT_LIBRARY = window.CURRENT_LIBRARY;

async function loadBooks() {
  const res = await fetch("/books");
  const books = await res.json();

  // Filter
  const filteredBooks = books.filter(book => {
    return Array.isArray(book.library) &&
      book.library.includes(CURRENT_LIBRARY);
  });

  // Filter
  filteredBooks.forEach(book => {
    const link = document.createElement("div");
    link.textContent = book.title;
    link.classList.add('book');
    link.setAttribute("can-move", "");
    // const link = document.createElement("a");
    // link.textContent = book.title;
    // link.href = book.url;
    // link.target = "_blank";
    // link.rel = "noopener noreferrer";

    link.addEventListener("mouseenter", () => {
      showBookCard(book);
    });

    bookList.appendChild(link);
  });
}

loadBooks();


// Add Items ================================

const itemPathInput = document.getElementById("itemPathInput");
const addItemBtn = document.getElementById("addItemBtn");
const itemImages = document.getElementById("itemImages");

async function loadLibraryItems() {
  if (!itemImages) return;

  const res = await fetch(`/libraries/${encodeURIComponent(CURRENT_LIBRARY)}`);
  const library = await res.json();

  itemImages.innerHTML = "";

  if (!Array.isArray(library.item)) return;

  library.item.forEach(imagePath => {
    renderItemImage(imagePath);
  });
}

function renderItemImage(imagePath) {
  if (!itemImages) return;

  const img = document.createElement("img");
  img.src = imagePath;
  img.dataset.path = imagePath;
  img.style.maxWidth = "200px";
  img.style.display = "block";
  img.setAttribute("can-move", "");

  let pressTimer;

  img.addEventListener("mousedown", () => {
    pressTimer = setTimeout(() => {
      deleteItemImage(imagePath, img);
    }, 800);
  });

  img.addEventListener("mouseup", () => clearTimeout(pressTimer));
  img.addEventListener("mouseleave", () => clearTimeout(pressTimer));

  img.addEventListener("touchstart", () => {
    pressTimer = setTimeout(() => {
      deleteItemImage(imagePath, img);
    }, 800);
  });

  img.addEventListener("touchend", () => clearTimeout(pressTimer));

  itemImages.appendChild(img);
}

async function deleteItemImage(imagePath, img) {
  const ok = confirm("Delete this item?");
  if (!ok) return;

  const res = await fetch(
    `/libraries/${encodeURIComponent(CURRENT_LIBRARY)}/items`,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      },
      body: JSON.stringify({ imagePath })
    }
  );

  const result = await res.json();

  if (result.success) {
    img.remove();
  } else {
    alert(result.message || "이미지를 삭제할 수 없습니다.");
  }
}

if (addItemBtn && itemPathInput && itemImages) {
  addItemBtn.addEventListener("click", async () => {
    const imagePath = itemPathInput.value.trim();

    if (!imagePath) {
      alert("이미지 path를 입력해주세요.");
      return;
    }

    const res = await fetch(
      `/libraries/${encodeURIComponent(CURRENT_LIBRARY)}/items`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8"
        },
        body: JSON.stringify({ imagePath })
      }
    );

    const result = await res.json();

    if (result.success) {
      itemPathInput.value = "";
      loadLibraryItems();
    } else {
      alert(result.message);
    }
  });

  loadLibraryItems();
}
