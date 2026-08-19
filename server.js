const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const libraryNamePattern = /^(?![._-])(?!.*[._-]{2})[A-Za-z0-9._-]+(?<![._-])$/;

const app = express();
const PORT = process.env.PORT || 8080;
// const PORT = 3000;

app.use(express.static("public"));
app.use("/components", express.static(path.join(__dirname, "components")));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================================================================
// 🔗 경로 읽어오기
// ======================================================================
const DATA_FILE = path.join(__dirname, "data", "libraries.json");
app.get("/libraries.json", (req, res) => {
  res.sendFile(DATA_FILE);
});

const BOOK_FILE = path.join(__dirname, "data", "books.json");
app.get("/books.json", (req, res) => {
  res.sendFile(BOOK_FILE);
});


// ======================================================================
// Board
// ======================================================================

const BOARD_FILE = path.join(__dirname, "data", "board.json");
const boardClients = new Set();

function readBoard() {
  if (!fs.existsSync(BOARD_FILE)) {
    fs.writeFileSync(BOARD_FILE, "[]", "utf8");
  }

  return JSON.parse(fs.readFileSync(BOARD_FILE, "utf8") || "[]");
}

function writeBoard(board) {
  fs.writeFileSync(BOARD_FILE, JSON.stringify(board, null, 2), "utf8");
}

function formatBoardDate(date = new Date()) {
  return date.toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
}

function broadcastBoardUpdate() {
  boardClients.forEach(client => {
    client.write("event: board-update\n");
    client.write(`data: ${Date.now()}\n\n`);
  });
}

// ======================================================================
// Board SSE
// ======================================================================

app.get("/board/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  res.write(": connected\n\n");

  boardClients.add(res);

  const keepAlive = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(keepAlive);
    boardClients.delete(res);
  });
});

// ======================================================================
// Board GET
// ======================================================================

app.get("/board", (req, res) => {
  const board = readBoard();

  res.setHeader("Cache-Control", "no-store");

  res.json(board.map(({ password, ...message }) => message));
});

// ======================================================================
// Board POST
// ======================================================================

app.post("/board", (req, res) => {
  const { name, message, password } = req.body;

  if (!name?.trim() || !message?.trim() || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, Message, and Password are required."
    });
  }

  const board = readBoard();

  const newMessage = {
    id: createUniqueId(board),
    date: formatBoardDate(),
    name: name.trim(),
    message: message.trim(),
    password
  };

  board.unshift(newMessage);

  writeBoard(board);

  const { password: hiddenPassword, ...publicMessage } = newMessage;

  broadcastBoardUpdate();

  return res.json({
    success: true,
    message: publicMessage
  });
});

// ======================================================================
// Board DELETE
// ======================================================================

app.delete("/board/:id", (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const board = readBoard();

  const messageIndex = board.findIndex(item => String(item.id) === String(id));

  if (messageIndex === -1) {
    return res.status(404).json({
      success: false,
      message: "Message not found."
    });
  }

  if (String(password) !== String(board[messageIndex].password)) {
    return res.status(403).json({
      success: false,
      message: "Incorrect password."
    });
  }

  board.splice(messageIndex, 1);

  writeBoard(board);

  broadcastBoardUpdate();

  return res.json({
    success: true,
    deletedId: id
  });
});


// ======================================================================
//
// ======================================================================
function readLibraries() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf8");
  }

  const data = fs.readFileSync(DATA_FILE, "utf8");
  return JSON.parse(data || "[]");
}

function writeLibraries(libraries) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(libraries, null, 2), "utf8");
}

function createUniqueId(existingLibraries) {
  let id;

  do {
    id = crypto.randomUUID();
  } while (existingLibraries.some(item => item.id === id));

  return id;
}

// ======================================================================
// 🔗 경로 읽어오기
// ======================================================================
const PUBLIC_DIR = path.join(__dirname, "public");

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createLibraryPage(library) {
  const libraryDir = path.join(PUBLIC_DIR, library.libraryName);

  if (!fs.existsSync(libraryDir)) {
    fs.mkdirSync(libraryDir, { recursive: true });
  }

  const templatePath = path.join(__dirname, "templates", "library-template.html");

  let html = fs.readFileSync(templatePath, "utf8");

  html = html
    .replaceAll("{{LIBRARY_NAME}}", escapeHtml(library.libraryName))
    .replaceAll("{{LIBRARY_COLOR}}", library.color);

  fs.writeFileSync(
    path.join(libraryDir, "index.html"),
    html,
    "utf8"
  );
}


// ======================================================================
app.get("/check-library-name", (req, res) => {
  const name = (req.query.name || "").trim();

  if (!name) {
    return res.json({ available: false });
  }

  if (!libraryNamePattern.test(name)) {
    return res.json({ available: false });
  }

  const libraries = readLibraries();

  const exists = libraries.some(
    library => library.libraryName.toLowerCase() === name.toLowerCase()
  );

  res.json({
    available: !exists
  });
});

// ======================================================================
app.post("/register-library", (req, res) => {
  const { 
    libraryName, 
    editableName,
    password, 
    description = "", 
    color, 
    bookSharing,
    item, 
    house,
    houseTitle 
  } = req.body;

  if (!libraryNamePattern.test(libraryName.trim())) {
    return res.status(400).json({
      success: false,
      message: "The library name may contain only letters, numbers, hyphens (-), underscores (_), and periods (.)"
    });
  }

  if (!libraryName || !password || !color || !bookSharing) {
    return res.status(400).json({
      success: false,
      message: "Please fill in all required fields"
    });
  }

  const libraries = readLibraries();

  const duplicated = libraries.some(
    library =>
      library.libraryName.toLowerCase() ===
      libraryName.trim().toLowerCase()
  );

  if (duplicated) {
    return res.status(409).json({
      success: false,
      message: "This library name is already taken"
    });
  }
  
  const newLibrary = {
    id: createUniqueId(libraries),
    libraryName,
    editableName: typeof editableName === "string" && editableName.trim()
      ? editableName.trim()
      : `${libraryName} Liiibrary`,
    password,
    description: typeof description === "string" ? description.trim() : "",
    color,
    bookSharing,
    createdAt: new Date().toISOString(),
    note: [],
    lineH: [],
    lineV: [],
    light: [],
    radio: [],
    item: [],
    house: house || "",
    houseTitle: houseTitle || ""
  };

  libraries.push(newLibrary);
  writeLibraries(libraries);

  createLibraryPage(newLibrary);

  res.json({
    success: true,
    library: newLibrary
  });

});


// ======================================================================
// 🔗 경로 읽어오기
// ======================================================================


function readBooks() {
  if (!fs.existsSync(BOOK_FILE)) {
    fs.writeFileSync(BOOK_FILE, "[]", "utf8");
  }

  return JSON.parse(fs.readFileSync(BOOK_FILE, "utf8") || "[]");
}

function writeBooks(books) {
  fs.writeFileSync(BOOK_FILE, JSON.stringify(books, null, 2), "utf8");
}

// ======================================================================
// 책 색상
// ======================================================================
app.patch("/books/library-colors", (req, res) => {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates)) {
        return res.status(400).json({
          success: false,
          message:
            "Updates must be an array."
        });
      }

      const books = readBooks();
      const updatedBooks = [];

      for (const update of updates) {
        const {
          bookId,
          libraryName,
          color
        } = update || {};

        if (
          !bookId ||
          !libraryName ||
          !/^#[0-9a-fA-F]{6}$/.test(
            String(color || "")
          )
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid book color update."
          });
        }

        const book = books.find(
          item =>
            String(item.id) ===
            String(bookId)
        );

        if (!book) {
          return res.status(404).json({
            success: false,
            message:
              `Book "${bookId}" was not found.`
          });
        }

        if (!Array.isArray(book.library)) {
          return res.status(400).json({
            success: false,
            message:
              `Book "${bookId}" has no library data.`
          });
        }

        let libraryEntry =
          book.library.find(item => {
            if (typeof item === "string") {
              return item === libraryName;
            }

            return item?.name === libraryName;
          });

        /*
          기존 문자열 구조가 남아 있다면
          객체 구조로 변환합니다.
        */
        if (typeof libraryEntry === "string") {
          const index =
            book.library.indexOf(
              libraryEntry
            );

          libraryEntry = {
            name: libraryName,
            color
          };

          book.library[index] =
            libraryEntry;
        } else if (
          libraryEntry &&
          typeof libraryEntry === "object"
        ) {
          libraryEntry.color = color;
        } else {
          return res.status(404).json({
            success: false,
            message:
              `Book "${bookId}" is not registered in "${libraryName}".`
          });
        }

        updatedBooks.push(book);
      }

      writeBooks(books);

      return res.json({
        success: true,
        books: updatedBooks
      });
    } catch (error) {
      console.error(
        "Failed to save book colors:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to save book colors."
      });
    }
  }
);

// ======================================================================
// 🔗 경로 읽어오기
// ======================================================================
app.get("/libraries", (req, res) => {
  const libraries = readLibraries();

  res.json(
    libraries.map(library => ({
      libraryName: library.libraryName,
      editableName: library.editableName,
      bookSharing: library.bookSharing,
      createdAt: library.createdAt,
      description: library.description || "",
      color: library.color,
      item: library.item || [],
      house: library.house,
      houseTitle: library.houseTitle
    }))
  );
});

// ======================================================================
app.get("/libraries/:libraryName", (req, res) => {
  const { libraryName } = req.params;

  const libraries = readLibraries();
  const library = libraries.find(item => item.libraryName === libraryName);

  if (!library) {
    return res.status(404).json({
      success: false,
      message: "Library not found"
    });
  }

  res.json(library);
});

app.post("/libraries/:libraryName/items", (req, res) => {
  const { libraryName } = req.params;
  const { imagePath } = req.body;

  if (!imagePath || imagePath.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Please provide an image path"
    });
  }

  const libraries = readLibraries();
  const library = libraries.find(item => item.libraryName === libraryName);

  if (!library) {
    return res.status(404).json({
      success: false,
      message: "Library not found"
    });
  }

  if (!Array.isArray(library.item)) {
    library.item = [];
  }

  library.item.push(imagePath.trim());

  writeLibraries(libraries);

  res.json({
    success: true,
    item: library.item
  });
});

app.delete("/libraries/:libraryName/items", (req, res) => {
  const { libraryName } = req.params;
  const { imagePath } = req.body;

  const libraries = readLibraries();
  const library = libraries.find(item => item.libraryName === libraryName);

  if (!library) {
    return res.status(404).json({
      success: false,
      message: "Library not found"
    });
  }

  library.item = Array.isArray(library.item)
    ? library.item.filter(path => path !== imagePath)
    : [];

  writeLibraries(libraries);

  res.json({
    success: true,
    item: library.item
  });
});



// ======================================================================
// Library: Edit
// ======================================================================
app.patch("/libraries/:libraryName", (req, res) => {
    const { libraryName } = req.params;

    const {
      house,
      houseTitle,
      editableName,
      description,
      color
    } = req.body;

    const libraries = readLibraries();

    const library = libraries.find(
      item =>
        item.libraryName === libraryName
    );

    if (!library) {
      return res.status(404).json({
        success: false,
        message: "Library not found"
      });
    }

    if (
      color !== undefined &&
      !/^#[0-9a-fA-F]{6}$/.test(color)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Color must be a six-digit HEX code"
      });
    }

    if (house !== undefined) {
      library.house =
        typeof house === "string"
          ? house
          : "";
    }

    if (houseTitle !== undefined) {
      library.houseTitle =
        typeof houseTitle === "string"
          ? houseTitle.trim()
          : "";
    }

    if (editableName !== undefined) {
      library.editableName =
        typeof editableName === "string"
          ? editableName.trim()
          : "";
    }

    if (description !== undefined) {
      library.description =
        typeof description === "string"
          ? description.trim()
          : "";
    }

    if (color !== undefined) {
      library.color = color;
    }

    writeLibraries(libraries);

    return res.json({
      success: true,
      library
    });
  }
);


// ======================================================================
// Library: Verify Password
// ======================================================================
app.post(
  "/libraries/:libraryName/verify-password",
  (req, res) => {
    try {
      const { libraryName } = req.params;
      const { password } = req.body;

      if (
        typeof password !== "string" ||
        password.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message: "The current password is required."
        });
      }

      const libraries = readLibraries();

      const library = libraries.find(
        item =>
          item.libraryName === libraryName
      );

      if (!library) {
        return res.status(404).json({
          success: false,
          message: "Library not found."
        });
      }

      if (
        String(password) !==
        String(library.password)
      ) {
        return res.status(403).json({
          success: false,
          message: "The current password is incorrect."
        });
      }

      return res.json({
        success: true
      });
    } catch (error) {
      console.error("Failed to verify password:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to verify the password."
      });
    }
  }
);


// ======================================================================
// Library: Change Password
// ======================================================================
app.patch("/libraries/:libraryName/password", (req, res) => {
    try {
      const { libraryName } = req.params;

      const {
        currentPassword,
        newPassword
      } = req.body;

      if (
        typeof currentPassword !== "string" ||
        currentPassword.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The current password is required."
        });
      }

      if (
        typeof newPassword !== "string" ||
        newPassword.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "The new password is required."
        });
      }

      const libraries = readLibraries();

      const library = libraries.find(
        item =>
          item.libraryName === libraryName
      );

      if (!library) {
        return res.status(404).json({
          success: false,
          message: "Library not found."
        });
      }

      // 저장 직전에 기존 비밀번호 다시 확인
      if (
        String(currentPassword) !==
        String(library.password)
      ) {
        return res.status(403).json({
          success: false,
          message:
            "The current password is incorrect."
        });
      }

      // 비밀번호에 공백 제거
      const normalizedNewPassword = newPassword.trim();

      if (!normalizedNewPassword) {
        return res.status(400).json({
          success: false,
          message: "The new password is required."
        });
      }

      library.password = normalizedNewPassword;

      // libraries.json의 password 변경
      // library.password = newPassword;

      writeLibraries(libraries);

      return res.json({
        success: true,
        message:
          "The library password has been changed successfully."
      });
    } catch (error) {
      console.error(
        "Failed to change password:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to change the password."
      });
    }
  }
);


// ======================================================================
// Library: Delete Forever
// ======================================================================
app.delete("/libraries/:libraryName", (req, res) => {
  try {
    const { libraryName } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required"
      });
    }

    /*
    // Central Liiibrary를 삭제하지 못하게 하려면 사용
    if (libraryName === "Central Liiibrary") {
      return res.status(403).json({
        success: false,
        message: "Central Liiibrary cannot be deleted"
      });
    }
    */

    const libraries = readLibraries();

    const libraryIndex = libraries.findIndex(
      library => library.libraryName === libraryName
    );

    if (libraryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Library not found"
      });
    }

    const library = libraries[libraryIndex];

    // 패스워드 확인
    if (
      String(password) !==
      String(library.password)
    ) {
      return res.status(403).json({
        success: false,
        message: "Incorrect password"
      });
    }

    // --------------------------------------
    // libraries.json에서 Library 삭제
    // --------------------------------------
    libraries.splice(libraryIndex, 1);

    // --------------------------------------
    // books.json의 모든 library 배열에서 삭제
    // --------------------------------------
    const books = readBooks();

    books.forEach(book => {
      if (!Array.isArray(book.library)) {
        return;
      }

      book.library = (book.library || []).filter(item => {
        if (typeof item === "string") {
          return item !== libraryName;
        }

        return item.name !== libraryName;
      });
    });

    // JSON 파일 저장
    writeLibraries(libraries);
    writeBooks(books);

    // --------------------------------------
    // 생성된 Library 페이지 폴더도 삭제
    // public/{libraryName}/
    // --------------------------------------
    const libraryDir = path.join(
      PUBLIC_DIR,
      libraryName
    );

    if (fs.existsSync(libraryDir)) {
      fs.rmSync(libraryDir, {
        recursive: true,
        force: true
      });
    }

    return res.json({
      success: true,
      message: "The library has been permanently deleted",
      deletedLibrary: libraryName
    });
  } catch (error) {
    console.error(
      "Failed to delete library:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete the library"
    });
  }
});


// ======================================================================
// Toolbox
// ======================================================================
const TOOL_TYPES = ["note", "lineH", "lineV", "light", "radio"];

function getNextToolId(library, type) {
  if (!Array.isArray(library[type])) {
    library[type] = [];
  }

  let maxNumber = -1;

  library[type].forEach(id => {
    const match = String(id).match(new RegExp(`^${type}_(\\d+)$`));

    if (match) {
      const number = Number(match[1]);
      if (number > maxNumber) maxNumber = number;
    }
  });

  return `${type}_${maxNumber + 1}`;
}

app.post("/libraries/:libraryName/tools", (req, res) => {
  const { libraryName } = req.params;
  const { type } = req.body;

  if (!TOOL_TYPES.includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid tool type"
    });
  }

  const libraries = readLibraries();

  const library = libraries.find(
    item => item.libraryName === libraryName
  );

  if (!library) {
    return res.status(404).json({
      success: false,
      message: "Library not found"
    });
  }

  const newToolId = getNextToolId(library, type);

  library[type].push(newToolId);

  writeLibraries(libraries);

  res.json({
    success: true,
    id: newToolId,
    library
  });
});


// ======================================================================
// Toolbox: Tool Remove
// ======================================================================
app.delete("/libraries/:libraryName/tools/:toolId", (req, res) => {
  const { libraryName, toolId } = req.params;

  const toolTypes = ["note", "lineH", "lineV", "light", "radio"];

  const libraries = readLibraries();
  const library = libraries.find(item => item.libraryName === libraryName);

  if (!library) {
    return res.status(404).json({
      success: false,
      message: "Library not found"
    });
  }

  const type = toolTypes.find(type => toolId.startsWith(`${type}_`));

  if (!type) {
    return res.status(400).json({
      success: false,
      message: "Invalid tool ID"
    });
  }

  library[type] = Array.isArray(library[type])
    ? library[type].filter(id => id !== toolId)
    : [];

  writeLibraries(libraries);

  res.json({
    success: true,
    removedId: toolId
  });
});


// ======================================================================
function normalizeText(text) {
  return String(text || "").trim().toLowerCase();
}

function normalizeAuthors(authors) {
  if (!Array.isArray(authors)) return "";

  return authors
    .map(author => normalizeText(author))
    .filter(Boolean)
    .sort()
    .join("|");
}

function isSameBook(book, incoming) {
  return (
    normalizeText(book.title) === normalizeText(incoming.title) &&
    normalizeText(book.url) === normalizeText(incoming.url) &&
    normalizeAuthors(book.author) === normalizeAuthors(incoming.author)
  );
}

app.post("/check-book", (req, res) => {
  const { title, author, url } = req.body;

  const books = readBooks();

  const foundBook = books.find(book =>
    isSameBook(book, { title, author, url })
  );

  if (foundBook) {
    return res.json({
      exists: true,
      book: foundBook
    });
  }

  res.json({
    exists: false
  });
});


// -------------------------------------------------------------
// Book Card: Library 추가 / 제거
// -------------------------------------------------------------
app.patch("/books/:id/libraries", (req, res) => {
  const { id } = req.params;

  const {
    libraryName,
    action,
    password = ""
  } = req.body;

  if (!libraryName || typeof libraryName !== "string") {
    return res.status(400).json({
      success: false,
      message: "Liiibrary name is required"
    });
  }

  if (!["add", "remove"].includes(action)) {
    return res.status(400).json({
      success: false,
      message: "Action must be either Add or Remove"
    });
  }

  if (libraryName === "Central Liiibrary" && action === "remove") {
    return res.status(400).json({
      success: false,
      message: "Books cannot be removed from the Central Liiibrary"
    });
  }

  const books = readBooks();
  const libraries = readLibraries();

  const book = books.find(
    item => String(item.id) === String(id)
  );

  if (!book) {
    return res.status(404).json({
      success: false,
      message: "Book not found"
    });
  }

  const library = libraries.find(
    item => item.libraryName === libraryName
  );

  if (!library) {
    return res.status(404).json({
      success: false,
      message: "Library not found"
    });
  }

  // 패스워드가 필요한 라이브러리는
  // 추가와 제거 모두 패스워드 검사
  if (library.bookSharing === "private") {
    if (!password) {
      return res.status(401).json({
        success: false,
        passwordRequired: true,
        message: `Please enter the password for ${libraryName}`
      });
    }

    if (String(password) !== String(library.password)) {
      return res.status(403).json({
        success: false,
        passwordRequired: true,
        message: "Incorrect password"
      });
    }
  }

  const existingLibraries = Array.isArray(book.library)
    ? book.library
        .map(item => {
          if (typeof item === "string") {
            const libraryInfo = libraries.find(lib => lib.libraryName === item);

            return {
              name: item,
              color: "#f2edcb"
            };
          }

          if (item && typeof item === "object") {
            return {
              name: item.name || item.libraryName || "",
              color: item.color || "#f2edcb"
            };
          }

          return null;
        })
        .filter(item => item?.name)
    : [];

  if (action === "add") {
    const alreadyExists = existingLibraries.some(item => item.name === libraryName);

    if (alreadyExists) {
      return res.status(409).json({
        success: false,
        alreadyExists: true,
        message: `This book is already registered in ${libraryName}`
      });
    }

    existingLibraries.push({
      name: libraryName,
      color: "#f2edcb"
    });
  }

  if (action === "remove") {
    const index = existingLibraries.findIndex(item => item.name === libraryName);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `This book is not registered in ${libraryName}`
      });
    }

    existingLibraries.splice(index, 1);
  }

  // Central Liiibrary는 항상 유지
  if (
    !existingLibraries.some(
      item => item.name === "Central Liiibrary"
    )
  ) {
    existingLibraries.unshift({
      name: "Central Liiibrary",
      color: "#f2edcb"
    });
  }

  book.library = existingLibraries;

  writeBooks(books);

  return res.json({
    success: true,
    action,
    libraryName,
    book
  });
});

// -------------------------------------------------------------
app.post("/register-book", (req, res) => {
  const {
    title,
    author,
    url,
    library,
    password = ""
  } = req.body;

  if (
    !title ||
    !Array.isArray(author) ||
    author.length === 0 ||
    !url
  ) {
    return res.status(400).json({
      success: false,
      message: "필수 항목을 입력해주세요."
    });
  }

  const books = readBooks();
  const libraries = readLibraries();

  const selectedLibraries = Array.isArray(library)
    ? [
        ...new Map(
          library
            .map(item => {
              const name =
                typeof item === "string"
                  ? item
                  : item?.name || "";

              if (!name) return null;

              const color =
                item &&
                typeof item === "object" &&
                /^#[0-9a-fA-F]{6}$/.test(item.color)
                  ? item.color
                  : "#f2edcb";

              return [
                name,
                {
                  name,
                  color
                }
              ];
            })
            .filter(Boolean)
        ).values()
      ]
    : [];

  // 요청된 private library 비밀번호 확인
  for (const selectedLibrary of selectedLibraries) {
    const libraryData = libraries.find(
      item =>
        item.libraryName === selectedLibrary.name
    );

    if (!libraryData) {
      return res.status(404).json({
        success: false,
        message:
          `Library "${selectedLibrary.name}" was not found.`
      });
    }

    if (
      libraryData.bookSharing === "private" &&
      String(password) !==
        String(libraryData.password)
    ) {
      return res.status(403).json({
        success: false,
        message: "Incorrect password"
      });
    }
  }

  const hasCentralLibrary =
    selectedLibraries.some(
      item =>
        item.name === "Central Liiibrary"
    );

  const newBook = {
    id: createUniqueId(books),
    title: title.trim(),
    author: author
      .map(authorName => authorName.trim())
      .filter(Boolean),
    url: url.trim(),

    library: hasCentralLibrary
      ? selectedLibraries
      : [
          {
            name: "Central Liiibrary",
            color: "#f2edcb"
          },
          ...selectedLibraries
        ],

    note: []
  };

  books.push(newBook);
  writeBooks(books);

  return res.json({
    success: true,
    book: newBook
  });
});

// ======================================================================
app.post("/books/:id/notes", (req, res) => {
  const { id } = req.params;
  
  const { borrower, comment, date } = req.body;

  if (!borrower && !comment) {
    return res.status(400).json({
      success: false,
      message: "borrower 또는 comment를 입력해주세요."
    });
  }

  const books = readBooks();
  const book = books.find(item => item.id === id);

  if (!book) {
    return res.status(404).json({
      success: false,
      message: "책을 찾을 수 없습니다."
    });
  }

  if (!Array.isArray(book.note)) {
    book.note = [];
  }

  const newNote = {
    date: date || "",
    borrower: borrower || "",
    comment: comment || ""
  };

  book.note.push(newNote);
  writeBooks(books);

  res.json({
    success: true,
    note: newNote,
    book
  });
});


// ======================================================================
app.get("/books", (req, res) => {
  const books = readBooks();
  res.json(books);
});



// ======================================================================
// 서버 시작
// ======================================================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });