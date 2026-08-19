async function startBoard() {
  const boardContainer = document.querySelector(
    '[data-component="board"]'
  );

  if (!boardContainer) {
    console.error(
      'Board container [data-component="board"] was not found.'
    );

    return;
  }

  try {
    const componentResponse = await fetch(
      `/components/board/index.html?_=${Date.now()}`,
      {
        method: "GET",
        cache: "no-store"
      }
    );

    if (!componentResponse.ok) {
      throw new Error(
        `Failed to load board component: ${componentResponse.status}`
      );
    }

    const componentHTML = await componentResponse.text();

    boardContainer.innerHTML = componentHTML;

    initializeBoard(boardContainer);

  } catch (error) {
    console.error("Board initialization failed:", error);
  }
}


if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    startBoard,
    { once: true }
  );
} else {
  startBoard();
}

// document.addEventListener("DOMContentLoaded", async () => {
//   const boardContainer = document.querySelector('[data-component="board"]');

//   if (!boardContainer) return;

//   try {
//     const componentResponse = await fetch("/components/board/index.html", { cache: "no-store" });

//     if (!componentResponse.ok) throw new Error("Failed to load the board component.");

//     boardContainer.innerHTML = await componentResponse.text();
//   } catch (error) {
//     console.error(error);
//     return;
//   }

//   initializeBoard(boardContainer);
// });

function initializeBoard(boardContainer) {
  // ============================================================
  // Elements
  // ============================================================

  const boardForm = boardContainer.querySelector("[data-board-form]");
  const boardList = boardContainer.querySelector("[data-board-list]");
  const boardStatus = boardContainer.querySelector("[data-board-status]");
  const currentDateElement = boardContainer.querySelector("[data-board-current-date]");
  const boardRowTemplate = boardContainer.querySelector("[data-board-row-template]");
  const boardEmptyTemplate = boardContainer.querySelector("[data-board-empty-template]");

  // ============================================================
  // Check required elements
  // ============================================================

  if (
    !boardForm ||
    !boardList ||
    !boardStatus ||
    !currentDateElement ||
    !boardRowTemplate ||
    !boardEmptyTemplate
  ) {
    console.error("Board component is incomplete.", {
      boardForm,
      boardList,
      boardStatus,
      currentDateElement,
      boardRowTemplate,
      boardEmptyTemplate
    });

    return;
  }

  // ============================================================
  // Form elements
  // ============================================================

  const nameInput = boardForm.elements.name;
  const messageInput = boardForm.elements.message;
  // const passwordInput = boardForm.elements.password;
  const passwordModal = boardContainer.querySelector("[data-board-password-modal]");
  const passwordModalInput = boardContainer.querySelector("[data-board-password-input]");
  const submitButton = boardForm.querySelector(".board-submit-button");

  // ============================================================
  // State
  // ============================================================

  let previousBoardJSON = "";
  let pendingSubmission = null;
  let isSubmitting = false;
  let isDeleting = false;
  

  // ============================================================
  // Date
  // ============================================================

  function formatBoardDate(date = new Date()) {
    const datePart = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      month: "2-digit",
      day: "2-digit",
      year: "numeric"
    }).format(date);

    const timePart = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    }).format(date);

    return `${datePart}, ${timePart}`;
  }

  function updateCurrentDate() {
    currentDateElement.textContent = formatBoardDate().split(",")[0].trim();
  }

  updateCurrentDate();

  window.setInterval(updateCurrentDate, 1000);

  // ============================================================
  // Status
  // ============================================================

  function setBoardStatus(message = "", type = "") {
    boardStatus.textContent = message;

    if (type) {
      boardStatus.dataset.type = type;
    } else {
      delete boardStatus.dataset.type;
    }
  }

  // ============================================================
  // Render
  // ============================================================

  function renderBoard(board) {
    if (!Array.isArray(board)) board = [];

    if (board.length === 0) {
      if (!boardEmptyTemplate) {
        console.error("Board empty template was not found.");
        boardList.replaceChildren();
        return;
      }

      const emptyFragment = boardEmptyTemplate.content.cloneNode(true);

      boardList.replaceChildren(emptyFragment);

      return;
    }

    if (!boardRowTemplate) {
      console.error("Board row template was not found.");
      boardList.replaceChildren();
      return;
    }

    const boardFragment = document.createDocumentFragment();

    board.forEach(item => {
      const rowFragment = boardRowTemplate.content.cloneNode(true);
      const row = rowFragment.querySelector(".board-row");
      const dateElement = rowFragment.querySelector(".board-row-date");
      const nameElement = rowFragment.querySelector(".board-row-name");
      const messageElement = rowFragment.querySelector(".board-row-message");
      const deleteButton = rowFragment.querySelector(".board-delete-button");

      if (!row || !dateElement || !nameElement || !messageElement || !deleteButton) {
        console.error("The board row template is incomplete.");
        return;
      }

      row.dataset.boardId = item.id;
      dateElement.textContent = item.date ? item.date.split(",")[0].trim() : "";
      nameElement.textContent = item.name || "";
      messageElement.textContent = item.message || "";
      deleteButton.dataset.deleteId = item.id;

      boardFragment.append(rowFragment);
    });

    boardList.replaceChildren(boardFragment);
  }

  // ============================================================
  // Load board
  // ============================================================

  async function loadBoard({ forceRender = false } = {}) {
    try {
      const response = await fetch(`/board?_=${Date.now()}`, {
        method: "GET",
        cache: "no-store",
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) throw new Error("Failed to load the board.");

      const result = await response.json();
      const board = Array.isArray(result) ? result : [];
      const currentBoardJSON = JSON.stringify(board);

      if (!forceRender && currentBoardJSON === previousBoardJSON) return;

      previousBoardJSON = currentBoardJSON;

      renderBoard(board);
    } catch (error) {
      console.error("Failed to load board:", error);

      setBoardStatus(error.message || "Failed to load the board.", "error");
    }
  }

  // ============================================================
  // Password Modal
  // ============================================================
  function openPasswordModal(name, message) {
    pendingSubmission = {
      name,
      message
    };

    passwordModal.classList.add("is-open");

    passwordModalInput.value = "";

    requestAnimationFrame(() => {
      passwordModalInput.focus();
    });
  }

  function closePasswordModal() {
    passwordModal.classList.remove("is-open");
    passwordModalInput.value = "";
    pendingSubmission = null;
  }

  // ============================================================
  // Submit
  // ============================================================

  async function submitBoardMessage(name, message, password) {
    if (isSubmitting) return;

    if (!name || !message || !password) {
      setBoardStatus("Please fill in Name, Message, and Password.", "error");
      return;
    }

    isSubmitting = true;
    submitButton.disabled = true;

    setBoardStatus("Saving...");

    try {
      const response = await fetch("/board", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          name,
          message,
          password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save the message.");
      }

      if (!result.message || typeof result.message !== "object") {
        throw new Error("The server returned an invalid message.");
      }

      previousBoardJSON = "";
      await loadBoard({ forceRender: true });
      messageInput.value = "";
      closePasswordModal();
      setBoardStatus("Saved.", "success");
      messageInput.focus();
    } catch (error) {
      console.error("Failed to submit message:", error);

      setBoardStatus(
        error.message || "Failed to save the message.",
        "error"
      );
      passwordModalInput.select();
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
    }
  }

  // async function submitBoardMessage() {
  //   if (isSubmitting) return;

  //   const name = nameInput.value.trim();
  //   const message = messageInput.value.trim();
  //   const password = passwordInput.value;

  //   if (!name || !message || !password) {
  //     setBoardStatus("Please fill in Name, Message, and Password.", "error");
  //     return;
  //   }

  //   isSubmitting = true;
  //   submitButton.disabled = true;

  //   setBoardStatus("Saving...");

  //   try {
  //     const response = await fetch("/board", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Accept: "application/json"
  //       },
  //       body: JSON.stringify({
  //         name,
  //         message,
  //         password
  //       })
  //     });

  //     const result = await response.json();

  //     if (!response.ok) throw new Error(result.message || "Failed to save the message.");

  //     if (!result.message || typeof result.message !== "object") {
  //       throw new Error("The server returned an invalid message.");
  //     }

  //     /*
  //       저장에 성공하면 polling을 기다리지 않고
  //       서버의 최신 board를 즉시 다시 가져옵니다.
  //     */

  //     previousBoardJSON = "";

  //     await loadBoard({ forceRender: true });

  //     messageInput.value = "";
  //     passwordInput.value = "";

  //     setBoardStatus("Saved.", "success");

  //     messageInput.focus();
  //   } catch (error) {
  //     console.error("Failed to submit message:", error);

  //     setBoardStatus(error.message || "Failed to save the message.", "error");
  //   } finally {
  //     isSubmitting = false;
  //     submitButton.disabled = false;
  //   }
  // }

  // ============================================================
  // Delete
  // ============================================================

  async function deleteBoardMessage(id, deleteButton) {
    if (isDeleting) return;

    const password = window.prompt("Enter the password for this message.");

    if (password === null) return;

    if (!password) {
      setBoardStatus("Password is required.", "error");
      return;
    }

    isDeleting = true;
    deleteButton.disabled = true;

    setBoardStatus("Deleting...");

    try {
      const response = await fetch(`/board/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        body: JSON.stringify({
          password
        })
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.message || "Failed to delete the message.");

      previousBoardJSON = "";

      await loadBoard({ forceRender: true });

      setBoardStatus("Deleted.", "success");
    } catch (error) {
      console.error("Failed to delete message:", error);

      setBoardStatus(error.message || "Failed to delete the message.", "error");

      deleteButton.disabled = false;
    } finally {
      isDeleting = false;
    }
  }

  // ============================================================
  // Board row / Delete click
  // ============================================================

  boardList.addEventListener("click", event => {
    const deleteButton = event.target.closest("[data-delete-id]");
    const clickedRow = event.target.closest(".board-row");

    if (deleteButton) {
      event.stopPropagation();

      deleteBoardMessage(deleteButton.dataset.deleteId, deleteButton);

      return;
    }

    if (!clickedRow) return;

    boardList.querySelectorAll(".board-row.is-active").forEach(row => {
      if (row !== clickedRow) row.classList.remove("is-active");
    });

    clickedRow.classList.add("is-active");
  });

  document.addEventListener("click", event => {
    if (event.target.closest(".board-row")) return;

    boardList.querySelectorAll(".board-row.is-active").forEach(row => {
      row.classList.remove("is-active");
    });
  });

  // ============================================================
  // Submit event
  // ============================================================

  function requestBoardSubmission() {
    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !message) {
      setBoardStatus("Please fill in Name and Message.", "error");
      return;
    }

    openPasswordModal(name, message);
  }

  boardForm.addEventListener("submit", event => {
    event.preventDefault();

    requestBoardSubmission();
  });

  boardForm.addEventListener("keydown", event => {
    if (event.key !== "Enter") return;

    event.preventDefault();

    requestBoardSubmission();
  });

  passwordModalInput.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      event.preventDefault();
      closePasswordModal();
      messageInput.focus();
      return;
    }

    if (event.key !== "Enter") return;

    event.preventDefault();

    const password = passwordModalInput.value;

    if (!password) {
      setBoardStatus("Password is required.", "error");
      return;
    }

    if (!pendingSubmission) return;

    submitBoardMessage(
      pendingSubmission.name,
      pendingSubmission.message,
      password
    );
  });

  passwordModal.addEventListener("click", event => {
    if (event.target !== passwordModal) return;

    closePasswordModal();
    messageInput.focus();
  });

  // boardForm.addEventListener("submit", event => {
  //   event.preventDefault();

  //   submitBoardMessage();
  // });

  // ============================================================
  // Enter event
  // ============================================================

  // boardForm.addEventListener("keydown", event => {
  //   if (event.key !== "Enter") return;

  //   event.preventDefault();

  //   submitBoardMessage();
  // });

  // ============================================================
  // Initial load
  // ============================================================

  loadBoard({ forceRender: true });

  // ============================================================
  // SSE
  // ============================================================

  if ("EventSource" in window) {
    const boardEvents = new EventSource("/board/events");

    boardEvents.addEventListener("board-update", () => {
      loadBoard();
    });

    boardEvents.addEventListener("open", () => {
      console.log("Board real-time connection opened.");
    });

    boardEvents.addEventListener("error", error => {
      console.error("Board real-time connection error:", error);
    });

    window.addEventListener("beforeunload", () => {
      boardEvents.close();
    });
  }

  // ============================================================
  // Visibility
  // ============================================================

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;

    previousBoardJSON = "";

    loadBoard({ forceRender: true });
  });
}