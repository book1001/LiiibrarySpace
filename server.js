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
  const { libraryName, password, color, bookSharing, item, house } = req.body;

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
    password,
    color,
    bookSharing,
    createdAt: new Date().toISOString(),
    note: [],
    lineH: [],
    lineV: [],
    light: [],
    radio: [],
    item: [],
    house: house || ""
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
// 🔗 경로 읽어오기
// ======================================================================
app.get("/libraries", (req, res) => {
  const libraries = readLibraries();

  res.json(
    libraries.map(library => ({
      libraryName: library.libraryName,
      bookSharing: library.bookSharing,
      color: library.color,
      item: library.item || [],
      house: library.house
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
      message: "Library name is required"
    });
  }

  if (!["add", "remove"].includes(action)) {
    return res.status(400).json({
      success: false,
      message: "Action must be either Add or Remove"
    });
  }

  if (libraryName === "Central Library" && action === "remove") {
    return res.status(400).json({
      success: false,
      message: "Books cannot be removed from the Central Library"
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
  if (library.bookSharing === "패스워드 필요") {
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

  const existingLibraryNames = Array.isArray(book.library)
    ? book.library
        .map(item => {
          if (typeof item === "string") {
            return item;
          }

          return item?.libraryName;
        })
        .filter(Boolean)
    : [];

  if (action === "add") {
    // 이미 추가되어 있다면 저장하지 않고 에러 반환
    if (existingLibraryNames.includes(libraryName)) {
      return res.status(409).json({
        success: false,
        alreadyExists: true,
        message: `This book is not registered in ${libraryName}`
      });
    }

    existingLibraryNames.push(libraryName);
  }

  if (action === "remove") {
    const index = existingLibraryNames.indexOf(libraryName);

    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: `이 책은 ${libraryName}에 등록되어 있지 않습니다.`
      });
    }

    existingLibraryNames.splice(index, 1);
  }

  // Central Library는 항상 유지
  book.library = existingLibraryNames.includes("Central Library")
    ? [...new Set(existingLibraryNames)]
    : ["Central Library", ...new Set(existingLibraryNames)];

  writeBooks(books);

  return res.json({
    success: true,
    action,
    libraryName,
    book
  });
});

// app.patch("/books/:id/libraries", (req, res) => {
//   const { id } = req.params;

//   const {
//     libraryName,
//     action,
//     password = ""
//   } = req.body;

//   // libraryName 검사
//   if (!libraryName || typeof libraryName !== "string") {
//     return res.status(400).json({
//       success: false,
//       message: "libraryName이 필요합니다."
//     });
//   }

//   // action은 add 또는 remove만 가능
//   if (!["add", "remove"].includes(action)) {
//     return res.status(400).json({
//       success: false,
//       message: "action은 add 또는 remove여야 합니다."
//     });
//   }

//   if (libraryName === "Central Library" && action === "remove") {
//     return res.status(400).json({
//       success: false,
//       message: "Central Library에서는 제거할 수 없습니다."
//     });
//   }

//   const books = readBooks();
//   const libraries = readLibraries();

//   const book = books.find(item => String(item.id) === String(id));

//   if (!book) {
//     return res.status(404).json({
//       success: false,
//       message: "책을 찾을 수 없습니다."
//     });
//   }

//   const library = libraries.find(
//     item => item.libraryName === libraryName
//   );

//   if (!library) {
//     return res.status(404).json({
//       success: false,
//       message: "라이브러리를 찾을 수 없습니다."
//     });
//   }

//   // 패스워드가 필요한 라이브러리는
//   // 추가와 제거 모두 패스워드를 확인
//   if (library.bookSharing === "패스워드 필요") {
//     if (!password) {
//       return res.status(401).json({
//         success: false,
//         message: "패스워드를 입력해주세요."
//       });
//     }

//     if (String(password) !== String(library.password)) {
//       return res.status(403).json({
//         success: false,
//         message: "패스워드가 올바르지 않습니다."
//       });
//     }
//   }

//   // 기존 library 값 정리
//   const existingLibraryNames = Array.isArray(book.library)
//     ? book.library
//         .map(item => {
//           if (typeof item === "string") {
//             return item;
//           }

//           return item?.libraryName;
//         })
//         .filter(Boolean)
//     : [];

//   if (action === "add") {
//     if (existingLibraryNames.includes(libraryName)) {
//       return res.status(409).json({
//         success: false,
//         alreadyExists: true,
//         message: `이 책은 이미 ${libraryName}에 추가되어 있습니다.`
//       });
//     }

//     existingLibraryNames.push(libraryName);
//   }

//   if (action === "remove") {
//     const index = existingLibraryNames.indexOf(libraryName);

//     if (index !== -1) {
//       existingLibraryNames.splice(index, 1);
//     }
//   }

//   book.library = existingLibraryNames.includes("Central Library")
//   ? existingLibraryNames
//   : ["Central Library", ...existingLibraryNames];
//   // book.library = existingLibraryNames;

//   writeBooks(books);

//   return res.json({
//     success: true,
//     action,
//     libraryName,
//     book
//   });
// });

// app.post("/books/:id/add-library", (req, res) => {
//   const { id } = req.params;
//   const { library } = req.body;

//   if (!Array.isArray(library)) {
//     return res.status(400).json({
//       success: false,
//       message: "library 정보가 올바르지 않습니다."
//     });
//   }

//   const books = readBooks();
//   const book = books.find(item => item.id === id);

//   if (!book) {
//     return res.status(404).json({
//       success: false,
//       message: "책을 찾을 수 없습니다."
//     });
//   }

//   const incomingLibraryNames = library
//     .map(item => {
//       if (typeof item === "string") return item;
//       return item.libraryName;
//     })
//     .filter(Boolean);

//   const existingLibraryNames = Array.isArray(book.library)
//     ? book.library
//         .map(item => {
//           if (typeof item === "string") return item;
//           return item.libraryName;
//         })
//         .filter(Boolean)
//     : [];

//   const merged = new Set([
//     "Central Library",
//     ...existingLibraryNames,
//     ...incomingLibraryNames
//   ]);

//   book.library = [...merged];

//   writeBooks(books);

//   res.json({
//     success: true,
//     book
//   });
// });
// -------------------------------------------------------------
app.post("/register-book", (req, res) => {
  const { title, author, url, library } = req.body;

  if (!title || !Array.isArray(author) || author.length === 0 || !url) {
    return res.status(400).json({
      success: false,
      message: "필수 항목을 입력해주세요."
    });
  }

  const books = readBooks();

  const selectedLibraryNames = Array.isArray(library)
  ? [
      ...new Set(
        library
          .map(item =>
            typeof item === "string"
              ? item
              : item?.libraryName
          )
          .filter(Boolean)
      )
    ]
  : ["Central Library"];

  // const selectedLibraryNames = Array.isArray(library)
  //   ? library.map(item =>
  //       typeof item === "string" ? item : item.libraryName
  //     ).filter(Boolean)
  //   : ["Central Library"];

  const newBook = {
    id: createUniqueId(books),
    title: title.trim(),
    author: author.map(a => a.trim()).filter(Boolean),
    url: url.trim(),
    library: selectedLibraryNames.includes("Central Library")
      ? selectedLibraryNames
      : ["Central Library", ...selectedLibraryNames],
    note: []
  };

  books.push(newBook);
  writeBooks(books);

  res.json({
    success: true,
    book: newBook
  });
});



// app.post("/register-book", (req, res) => {
//   const { title, author, url, library } = req.body;

//   if (!title || !Array.isArray(author) || author.length === 0 || !url) {
//     return res.status(400).json({
//       success: false,
//       message: "필수 항목을 입력해주세요."
//     });
//   }

//   const books = readBooks();

//   const now = new Date().toISOString();

//   const libraries = readLibraries();

//   const selectedLibraryNames = [];

//   for (const item of library) {
//     const libraryName = item.libraryName;

//     if (libraryName === "Central Library") {
//       selectedLibraryNames.push("Central Library");
//       continue;
//     }

//     const foundLibrary = libraries.find(
//       lib => lib.libraryName === libraryName
//     );

//     if (!foundLibrary) {
//       return res.status(400).json({
//         success: false,
//         message: `${libraryName} 도서관을 찾을 수 없습니다.`
//       });
//     }

//     if (foundLibrary.bookSharing === "패스워드 필요") {
//       if (item.password !== foundLibrary.password) {
//         return res.status(403).json({
//           success: false,
//           message: `${libraryName} 도서관의 비밀번호가 틀렸습니다.`
//         });
//       }
//     }

//     selectedLibraryNames.push(libraryName);
//   }

//   const newBook = {
//     id: createUniqueId(books),
//     title: title.trim(),
//     author: author.map(a => a.trim()).filter(Boolean),
//     url: url.trim(),
//     library: selectedLibraryNames.includes("Central Library")
//       ? selectedLibraryNames
//       : ["Central Library", ...selectedLibraryNames],
//     note: []
//   };

//   books.push(newBook);
//   writeBooks(books);

//   res.json({
//     success: true,
//     book: newBook
//   });
// });

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