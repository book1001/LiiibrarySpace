const form = document.getElementById("bookForm");
const authorList = document.getElementById("authorList");
const addAuthorBtn = document.getElementById("addAuthorBtn");
const submitBtn = document.getElementById("submitBtn");
const bookUpdateChannel = new BroadcastChannel("book-updates");


// ======================================================
function notifyBookUpdated(detail = {}) {
  const message = {
    type: "book-updated",
    libraryName: CURRENT_LIBRARY,
    ...detail
  };

  // 현재 Library 창의 bookList 갱신
  window.dispatchEvent(
    new CustomEvent("book-updated", {
      detail: message
    })
  );

  // BroadcastChannel을 통해 다른 같은 출처 창에 알림
  bookUpdateChannel.postMessage(message);

  // window.open()으로 연 index.html에도 직접 알림
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage(
      message,
      window.location.origin
    );
  }
}
// ======================================================
// 현재 페이지의 Library 이름
// 예: /Test3/ → Test3
// ======================================================
function getCurrentLibraryName() {
  const pathParts = window.location.pathname
    .split("/")
    .filter(Boolean);

  if (pathParts.length === 0) {
    return "Central Liiibrary";
  }

  return decodeURIComponent(pathParts[0]);
}

const CURRENT_LIBRARY = getCurrentLibraryName();

// ======================================================
// 폼 검사
// ======================================================
function checkBookForm() {
  const title = form.title.value.trim();
  const url = form.url.value.trim();

  const hasAuthor = [...authorList.querySelectorAll(".authorInput")]
    .some(input => input.value.trim());

  submitBtn.disabled = !(title && url && hasAuthor);
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
    removeButton.classList.add("material-symbols-outlined");
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

  checkBookForm();
}

// ======================================================
// 현재 Library 정보 가져오기
// ======================================================
async function getCurrentLibrary() {
  if (CURRENT_LIBRARY === "Central Liiibrary") {
    return {
      libraryName: "Central Liiibrary",
      bookSharing: "open"
    };
  }

  const response = await fetch(
    `/libraries/${encodeURIComponent(CURRENT_LIBRARY)}`
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
      `${CURRENT_LIBRARY} 정보를 불러오지 못했습니다.`
    );
  }

  return result;
}

// ======================================================
// Library 패스워드 받기
// ======================================================
function requestLibraryPassword(library) {
  if (library.bookSharing !== "private") {
    return "";
  }

  const password = prompt(
    `Enter the password for ${CURRENT_LIBRARY}`
  );

  if (password === null) {
    return null;
  }

  const trimmedPassword = password.trim();

  if (!trimmedPassword) {
    alert("패스워드를 입력해주세요.");
    return null;
  }

  return trimmedPassword;
}

// ======================================================
// 기존 책에 현재 Library 추가
// ======================================================
async function addCurrentLibraryToBook(bookId, password) {
  const response = await fetch(
    `/books/${encodeURIComponent(bookId)}/libraries`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      },
      body: JSON.stringify({
        libraryName: CURRENT_LIBRARY,
        action: "add",
        password
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
      `Failed to add the book to ${CURRENT_LIBRARY}`
    );
  }

  return result;
}

// ======================================================
// 새 책 등록
// ======================================================
async function registerNewBook({
  title,
  author,
  url,
  password
}) {
  const response = await fetch("/register-book", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8"
    },
    body: JSON.stringify({
      title,
      author,
      url,
      library: [
        {
          libraryName: CURRENT_LIBRARY,
          password
        }
      ]
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
// Book Submit
// ======================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = form.title.value.trim();
  const url = form.url.value.trim();

  const author = [
    ...authorList.querySelectorAll(".authorInput")
  ]
    .map(input => input.value.trim())
    .filter(Boolean);

  if (!title || !url || author.length === 0) {
    alert("Please enter the title, author, and URL");
    return;
  }

  submitBtn.disabled = true;

  try {
    // 현재 URL에 해당하는 Library 정보 확인
    const currentLibrary = await getCurrentLibrary();

    // 패스워드가 필요한 Library이면 입력
    const password = requestLibraryPassword(currentLibrary);

    // 사용자가 prompt를 취소했거나
    // 패스워드를 입력하지 않은 경우 중단
    if (password === null) {
      return;
    }

    // 동일한 책이 이미 등록되어 있는지 검사
    const checkResponse = await fetch("/check-book", {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      },
      body: JSON.stringify({
        title,
        author,
        url
      })
    });

    const checkResult = await checkResponse.json();

    if (!checkResponse.ok) {
      throw new Error(
        checkResult.message ||
        "Failed to check whether the book already exists"
      );
    }

    // ==================================================
    // 같은 책이 이미 존재하는 경우
    // 현재 Library만 기존 책에 추가
    // ==================================================
    if (checkResult.exists) {
      await addCurrentLibraryToBook(
        checkResult.book.id,
        password
      );

      notifyBookUpdated({
        action: "add-library",
        bookId: checkResult.book.id
      });

      // window.dispatchEvent(
      //   new CustomEvent("book-updated", {
      //     detail: {
      //       libraryName: CURRENT_LIBRARY,
      //       action: "add-library",
      //       bookId: checkResult.book.id
      //     }
      //   })
      // );

      // bookUpdateChannel.postMessage({
      //   type: "book-updated",
      //   action: "add-library",
      //   libraryName: CURRENT_LIBRARY,
      //   bookId: checkResult.book.id
      // });

      alert(
        `The existing book has been added to ${CURRENT_LIBRARY}`
      );

      resetBookForm();
      return;
    }

    // ==================================================
    // 같은 책이 없는 경우
    // 새 책으로 등록
    // ==================================================
    await registerNewBook({
      title,
      author,
      url,
      password
    });

    notifyBookUpdated({
      action: "register"
    });

    // // 책 목록 컴포넌트에 변경 알림
    // window.dispatchEvent(
    //   new CustomEvent("book-updated", {
    //     detail: {
    //       libraryName: CURRENT_LIBRARY,
    //       action: "register"
    //     }
    //   })
    // );

    // bookUpdateChannel.postMessage({
    //   type: "book-updated",
    //   action: "register",
    //   libraryName: CURRENT_LIBRARY
    // });

    // alert(
    //   `A new book has been registered in ${CURRENT_LIBRARY}`
    // );

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
checkBookForm();