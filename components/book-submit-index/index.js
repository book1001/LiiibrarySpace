const form = document.getElementById("bookForm");
const authorList = document.getElementById("authorList");
const addAuthorBtn = document.getElementById("addAuthorBtn");
const submitBtn = document.getElementById("submitBtn");

const submitLibraryDropdownBtn = document.getElementById("submitLibraryDropdownBtn");
const submitLibraryDropdown = document.getElementById("submitLibraryDropdown");
const submitLibraryCheckboxList = document.getElementById("submitLibraryCheckboxList");

const bookUpdateChannel = new BroadcastChannel("book-updates");

const CENTRAL_LIBRARY_NAME = "Central Liiibrary";

// 불러온 Library 정보
let availableLibraries = [];

// private Library에 입력한 패스워드 저장
// key: libraryName
// value: password
const selectedLibraryPasswords = new Map();


// ======================================================
// 책 목록 업데이트 알림
// ======================================================
function notifyBookUpdated(detail = {}) {
  const message = {
    type: "book-updated",
    libraryName: CENTRAL_LIBRARY_NAME,
    ...detail
  };

  // 현재 index.html의 bookList 갱신
  window.dispatchEvent(
    new CustomEvent("book-updated", {
      detail: message
    })
  );

  // 다른 같은 출처 창에 알림
  bookUpdateChannel.postMessage(message);

  // index.html이 다른 창에서 열린 경우
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage(
      message,
      window.location.origin
    );
  }
}


// ======================================================
// 폼 검사
// ======================================================
function checkBookForm() {
  const title = form.title.value.trim();
  const url = form.url.value.trim();

  const hasAuthor = [
    ...authorList.querySelectorAll(".authorInput")
  ].some(input => input.value.trim());

  const hasLibrary =
    getSelectedLibraryCheckboxes().length > 0;

  submitBtn.disabled = !(
    title &&
    url &&
    hasAuthor &&
    hasLibrary
  );
}

form.title.addEventListener("input", checkBookForm);
form.url.addEventListener("input", checkBookForm);
authorList.addEventListener("input", checkBookForm);


// ======================================================
// Author 입력칸 생성
// ======================================================
function createAuthorRow({ removable = true } = {}) {
  const row = document.createElement("div");
  row.className = "author-row";

  const input = document.createElement("input");

  input.type = "text";
  input.className = "authorInput";
  input.required = true;

  row.appendChild(input);

  if (removable) {
    const removeButton = document.createElement("button");

    removeButton.type = "button";
    removeButton.className = "removeAuthorBtn";
    removeButton.classList.add(
      "material-symbols-outlined"
    );

    removeButton.textContent = "do_not_disturb_on";

    removeButton.addEventListener("click", () => {
      row.remove();
      checkBookForm();
    });

    row.appendChild(removeButton);
  }

  return row;
}


// ======================================================
// Author 추가
// ======================================================
addAuthorBtn.addEventListener("click", () => {
  const row = createAuthorRow({
    removable: true
  });

  authorList.appendChild(row);

  row.querySelector(".authorInput").focus();

  checkBookForm();
});


// ======================================================
// 선택된 Library 체크박스 가져오기
// ======================================================
function getSelectedLibraryCheckboxes() {
  return [
    ...submitLibraryCheckboxList.querySelectorAll(
      'input[type="checkbox"]:checked'
    )
  ];
}


// ======================================================
// 선택된 Library 이름 가져오기
// ======================================================
function getSelectedLibraryNames() {
  return getSelectedLibraryCheckboxes().map(
    checkbox => checkbox.value
  );
}


// ======================================================
// Library 정보 찾기
// ======================================================
function findLibrary(libraryName) {
  return availableLibraries.find(
    library => library.libraryName === libraryName
  );
}


// ======================================================
// Dropdown 버튼 텍스트 업데이트
// ======================================================
function updateLibraryDropdownButton() {
  const selectedLibraryNames =
    getSelectedLibraryNames();

  submitLibraryDropdownBtn.innerHTML = `
    ${selectedLibraryNames.join(", ")}
    <span class="add-circle material-symbols-outlined">add_circle</span>
  `;
}

// function updateLibraryDropdownButton() {
//   const selectedLibraryNames =
//     getSelectedLibraryNames();

//   if (
//     selectedLibraryNames.length === 1 &&
//     selectedLibraryNames[0] === CENTRAL_LIBRARY_NAME
//   ) {
//     submitLibraryDropdownBtn.textContent =
//       `${CENTRAL_LIBRARY_NAME} ▾`;
//   } else {
//     submitLibraryDropdownBtn.textContent =
//       selectedLibraryNames.join(", ");
//   }
// }


// ======================================================
// Private Library 패스워드 요청
// ======================================================
function requestLibraryPassword(library) {
  if (library.bookSharing !== "private") {
    return "";
  }

  const savedPassword = selectedLibraryPasswords.get(
    library.libraryName
  );

  if (savedPassword) {
    return savedPassword;
  }

  const password = prompt(
    `Enter the password for ${library.libraryName}`
  );

  if (password === null) {
    return null;
  }

  const trimmedPassword = password.trim();

  if (!trimmedPassword) {
    alert("Please enter the password.");
    return null;
  }

  selectedLibraryPasswords.set(
    library.libraryName,
    trimmedPassword
  );

  return trimmedPassword;
}


// ======================================================
// Library 체크박스 생성
// ======================================================
function createLibraryCheckbox(library) {
  const label = document.createElement("label");
  label.className = "submit-library-checkbox";

  const checkbox = document.createElement("input");

  checkbox.type = "checkbox";
  checkbox.value = library.libraryName;
  checkbox.dataset.bookSharing =
    library.bookSharing || "open";

  const name = document.createElement("span");
  name.textContent = library.libraryName;

  // Central Liiibrary는 항상 선택
  if (library.libraryName === CENTRAL_LIBRARY_NAME) {
    checkbox.checked = true;
    checkbox.disabled = true;

    label.classList.add("is-central");
  }

  // Private 표시
  if (library.bookSharing === "private") {
    const privateMark = document.createElement("span");

    privateMark.className = "private-library-mark";
    privateMark.textContent = " ❋";

    name.appendChild(privateMark);
  }

  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      const password =
        requestLibraryPassword(library);

      // 취소하거나 비밀번호를 입력하지 않은 경우
      if (password === null) {
        checkbox.checked = false;
      }
    } else {
      // 체크 해제 시 저장된 패스워드 제거
      selectedLibraryPasswords.delete(
        library.libraryName
      );
    }

    updateLibraryDropdownButton();
    checkBookForm();
  });

  label.append(checkbox, name);

  return label;
}


// ======================================================
// Library 목록 렌더링
// ======================================================
function renderLibraryCheckboxes() {
  submitLibraryCheckboxList.innerHTML = "";

  availableLibraries.forEach(library => {
    const checkbox = createLibraryCheckbox(library);

    submitLibraryCheckboxList.appendChild(checkbox);
  });

  updateLibraryDropdownButton();
  checkBookForm();
}


// ======================================================
// Library 목록 불러오기
// ======================================================
async function loadLibraries() {
  try {
    const response = await fetch(
      `/libraries?_=${Date.now()}`,
      {
        cache: "no-store"
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
        "Failed to load the library list"
      );
    }

    const libraries = Array.isArray(result)
      ? result
      : [];

    // Central Liiibrary가 JSON에 없으면 직접 추가
    const hasCentralLibrary = libraries.some(
      library =>
        library.libraryName === CENTRAL_LIBRARY_NAME
    );

    availableLibraries = hasCentralLibrary
      ? libraries
      : [
          {
            libraryName: CENTRAL_LIBRARY_NAME,
            bookSharing: "open"
          },
          ...libraries
        ];

    renderLibraryCheckboxes();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}


// ======================================================
// Dropdown 열기 / 닫기
// ======================================================
submitLibraryDropdownBtn.addEventListener(
  "click",
  event => {
    event.stopPropagation();

    submitLibraryDropdown.classList.toggle("is-open");
  }
);


// Dropdown 내부 클릭 시 닫히지 않도록 설정
submitLibraryDropdown.addEventListener(
  "click",
  event => {
    event.stopPropagation();
  }
);


// 바깥 클릭 시 Dropdown 닫기
document.addEventListener("click", () => {
  submitLibraryDropdown.classList.remove("is-open");
});


// Escape 키로 Dropdown 닫기
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    submitLibraryDropdown.classList.remove(
      "is-open"
    );
  }
});


// ======================================================
// 선택된 Library 등록 데이터 만들기
// ======================================================
function getSelectedLibraryData() {
  return getSelectedLibraryNames().map(
    libraryName => {
      const library = findLibrary(libraryName);

      return {
        libraryName,
        password:
          library?.bookSharing === "private"
            ? selectedLibraryPasswords.get(
                libraryName
              ) || ""
            : ""
      };
    }
  );
}


// ======================================================
// 선택된 private Library의 비밀번호 확인
// ======================================================
function confirmSelectedLibraryPasswords() {
  const selectedLibraryNames =
    getSelectedLibraryNames();

  for (const libraryName of selectedLibraryNames) {
    const library = findLibrary(libraryName);

    if (!library) {
      continue;
    }

    if (library.bookSharing !== "private") {
      continue;
    }

    const password =
      requestLibraryPassword(library);

    if (password === null) {
      const checkbox =
        submitLibraryCheckboxList.querySelector(
          `input[value="${CSS.escape(libraryName)}"]`
        );

      if (checkbox) {
        checkbox.checked = false;
      }

      updateLibraryDropdownButton();
      checkBookForm();

      return false;
    }
  }

  return true;
}


// ======================================================
// 기존 책에 Library 하나 추가
// ======================================================
async function addLibraryToExistingBook({
  bookId,
  libraryName,
  password
}) {
  const response = await fetch(
    `/books/${encodeURIComponent(bookId)}/libraries`,
    {
      method: "PATCH",
      headers: {
        "Content-Type":
          "application/json;charset=UTF-8"
      },
      body: JSON.stringify({
        libraryName,
        action: "add",
        password
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
      `Failed to add the book to ${libraryName}`
    );
  }

  return result;
}


// ======================================================
// 책에 이미 등록된 Library 이름 가져오기
// ======================================================
function getExistingBookLibraryNames(book) {
  if (!Array.isArray(book.library)) {
    return [];
  }

  return book.library
    .map(library => {
      if (typeof library === "string") {
        return library;
      }

      if (
        library &&
        typeof library === "object"
      ) {
        return library.libraryName;
      }

      return null;
    })
    .filter(Boolean);
}


// ======================================================
// 기존 책에 선택된 Library들 추가
// ======================================================
async function addSelectedLibrariesToExistingBook(
  book
) {
  const selectedLibraries =
    getSelectedLibraryData();

  const existingLibraryNames =
    getExistingBookLibraryNames(book);

  const librariesToAdd =
    selectedLibraries.filter(
      library =>
        !existingLibraryNames.includes(
          library.libraryName
        )
    );

  // 모든 선택 Library가 이미 등록되어 있는 경우
  if (librariesToAdd.length === 0) {
    return {
      addedLibraries: [],
      alreadyRegistered: true
    };
  }

  // 순서대로 Library 추가
  for (const library of librariesToAdd) {
    await addLibraryToExistingBook({
      bookId: book.id,
      libraryName: library.libraryName,
      password: library.password
    });
  }

  return {
    addedLibraries: librariesToAdd.map(
      library => library.libraryName
    ),
    alreadyRegistered: false
  };
}


// ======================================================
// 새 책 등록
// ======================================================
async function registerNewBook({
  title,
  author,
  url,
  libraries
}) {
  const response = await fetch("/register-book", {
    method: "POST",
    headers: {
      "Content-Type":
        "application/json;charset=UTF-8"
    },
    body: JSON.stringify({
      title,
      author,
      url,
      library: libraries
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
      "Failed to register the book"
    );
  }

  return result;
}


// ======================================================
// Library 선택 초기화
// ======================================================
function resetLibrarySelection() {
  selectedLibraryPasswords.clear();

  const checkboxes =
    submitLibraryCheckboxList.querySelectorAll(
      'input[type="checkbox"]'
    );

  checkboxes.forEach(checkbox => {
    const isCentral =
      checkbox.value === CENTRAL_LIBRARY_NAME;

    checkbox.checked = isCentral;
  });

  updateLibraryDropdownButton();

  submitLibraryDropdown.classList.remove("is-open");
}


// ======================================================
// 폼 초기화
// ======================================================
function resetBookForm() {
  form.reset();

  authorList.innerHTML = "";

  authorList.appendChild(
    createAuthorRow({
      removable: false
    })
  );

  resetLibrarySelection();
  checkBookForm();
}


// ======================================================
// Book Submit
// ======================================================
form.addEventListener("submit", async event => {
  event.preventDefault();

  const title = form.title.value.trim();
  const url = form.url.value.trim();

  const author = [
    ...authorList.querySelectorAll(".authorInput")
  ]
    .map(input => input.value.trim())
    .filter(Boolean);

  if (!title || !url || author.length === 0) {
    alert(
      "Please enter the title, author, and URL"
    );

    return;
  }

  const selectedLibraryNames =
    getSelectedLibraryNames();

  if (selectedLibraryNames.length === 0) {
    alert(
      "Please select at least one library."
    );

    return;
  }

  // private Library의 패스워드가 모두 입력되었는지 확인
  const passwordsConfirmed =
    confirmSelectedLibraryPasswords();

  if (!passwordsConfirmed) {
    return;
  }

  const selectedLibraries =
    getSelectedLibraryData();

  submitBtn.disabled = true;

  try {
    // 동일한 책이 이미 등록되어 있는지 검사
    const checkResponse = await fetch(
      "/check-book",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json;charset=UTF-8"
        },
        body: JSON.stringify({
          title,
          author,
          url
        })
      }
    );

    const checkResult =
      await checkResponse.json();

    if (!checkResponse.ok) {
      throw new Error(
        checkResult.message ||
        "Failed to check whether the book already exists"
      );
    }

    // ==================================================
    // 같은 책이 이미 존재하는 경우
    // 선택된 Library들을 기존 책에 추가
    // ==================================================
    if (checkResult.exists) {
      const addResult =
        await addSelectedLibrariesToExistingBook(
          checkResult.book
        );

      if (addResult.alreadyRegistered) {
        alert(
          "This book is already registered in all selected libraries."
        );

        return;
      }

      notifyBookUpdated({
        action: "add-libraries",
        bookId: checkResult.book.id,
        libraries: addResult.addedLibraries
      });

      resetBookForm();
      return;
    }

    // ==================================================
    // 같은 책이 없는 경우 새 책 등록
    // ==================================================
    const registerResult =
      await registerNewBook({
        title,
        author,
        url,
        libraries: selectedLibraries
      });

    notifyBookUpdated({
      action: "register",
      bookId: registerResult.book?.id,
      libraries: selectedLibraryNames
    });

    resetBookForm();
  } catch (error) {
    console.error(error);
    alert(error.message);
  } finally {
    checkBookForm();
  }
});


// ======================================================
// 최초 상태 설정
// ======================================================
authorList.innerHTML = "";

authorList.appendChild(
  createAuthorRow({
    removable: false
  })
);

loadLibraries();
checkBookForm();