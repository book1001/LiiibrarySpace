const form = document.getElementById("bookForm");
const authorList = document.getElementById("authorList");
const addAuthorBtn = document.getElementById("addAuthorBtn");

const libraryDropdown = document.getElementById("submitLibraryDropdown");
const libraryDropdownBtn = document.getElementById("submitLibraryDropdownBtn");
const libraryCheckboxList = document.getElementById("submitLibraryCheckboxList");
// const libraryDropdown = document.getElementById("libraryDropdown");
// const libraryDropdownBtn = document.getElementById("libraryDropdownBtn");
// const libraryCheckboxList = document.getElementById("libraryCheckboxList");

const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const duplicateBookCard = document.getElementById("duplicateBookCard");
const duplicateTitle = document.getElementById("duplicateTitle");
const duplicateAuthor = document.getElementById("duplicateAuthor");
const duplicateUrl = document.getElementById("duplicateUrl");
const duplicateLibrary = document.getElementById("duplicateLibrary");
const addLibraryToExistingBookBtn = document.getElementById("addLibraryToExistingBookBtn");
const cancelDuplicateBtn = document.getElementById("cancelDuplicateBtn");

let duplicateBook = null;

function checkBookForm() {
  const title = form.title.value.trim();
  const url = form.url.value.trim();

  submitBtn.disabled = !(title && url);
}

form.title.addEventListener("input", checkBookForm);
form.url.addEventListener("input", checkBookForm);


addAuthorBtn.addEventListener("click", () => {
  const row = document.createElement("div");
  row.className = "author-row";

  row.innerHTML = `
    <input type="text" class="authorInput" required />
    <button type="button" class="removeAuthorBtn">-</button>
  `;

  row.querySelector(".removeAuthorBtn").addEventListener("click", () => {
    row.remove();
  });

  authorList.appendChild(row);
});

libraryDropdownBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  e.stopPropagation();

  // if (!librariesLoaded) {
  //   await loadLibraries();
  //   librariesLoaded = true;
  // }

  libraryDropdown.classList.toggle("is-open");
});

// libraryDropdownBtn.addEventListener("click", () => {
//   libraryDropdown.classList.toggle("open");
// });


async function loadLibraries() {
  try {
    const res = await fetch("/libraries");

    if (!res.ok) {
      throw new Error("라이브러리 목록을 불러오지 못했습니다.");
    }

    const libraries = await res.json();

    // 중복 생성을 막기 위해 먼저 비우기
    libraryCheckboxList.innerHTML = "";

    // =========================================
    // Central Library
    // 항상 표시되고 체크 해제 불가능
    // =========================================
    const centralLabel = document.createElement("label");
    centralLabel.className = "library-checkbox-item";

    const centralCheckbox = document.createElement("input");
    centralCheckbox.type = "checkbox";
    centralCheckbox.value = "Central Library";
    centralCheckbox.checked = true;
    centralCheckbox.disabled = true;

    centralLabel.append(
      centralCheckbox,
      document.createTextNode(" Central Library")
    );

    libraryCheckboxList.appendChild(centralLabel);

    // =========================================
    // libraries.json의 라이브러리
    // =========================================
    libraries.forEach(library => {
      const libraryName = library.libraryName;

      if (!libraryName) {
        return;
      }

      // JSON 안에도 Central Library가 있으면 중복 방지
      if (libraryName === "Central Library") {
        return;
      }

      const label = document.createElement("label");
      label.className = "library-checkbox-item";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = libraryName;
      checkbox.dataset.sharing = library.bookSharing || "";
      checkbox.dataset.password = "";

      const nameText = document.createTextNode(
        ` ${libraryName}`
      );

      label.append(
        checkbox,
        nameText
      );

      if (library.bookSharing === "패스워드 필요") {
        const lockMark = document.createElement("span");
        lockMark.textContent = " 🔒";
        lockMark.title =
          "이 라이브러리는 패스워드가 필요합니다.";

        label.appendChild(lockMark);
      }

      libraryCheckboxList.appendChild(label);
    });

    updateLibraryButton();
  } catch (error) {
    console.error(error);

    libraryCheckboxList.textContent =
      "라이브러리 목록을 불러오지 못했습니다.";
  }
}

loadLibraries();

// async function loadLibraries() {
//   const res = await fetch("/libraries");
//   const libraries = await res.json();

//   libraries.forEach(library => {
//     const label = document.createElement("label");
//     label.innerHTML = `
//       <input 
//         type="checkbox" 
//         value="${library.libraryName}" 
//         data-sharing="${library.bookSharing}"
//       />
//       ${library.libraryName}
//     `;

//     libraryCheckboxList.appendChild(label);
//     libraryCheckboxList.appendChild(document.createElement("br"));
//   });

//   updateLibraryButton();
// }
function getSelectedLibraryObjects() {
  const selected = [
    ...libraryCheckboxList.querySelectorAll(
      'input[type="checkbox"]:checked'
    )
  ].map(input => ({
    libraryName: input.value,
    password: input.dataset.password || ""
  }));

  if (
    !selected.some(
      item => item.libraryName === "Central Library"
    )
  ) {
    selected.unshift({
      libraryName: "Central Library",
      password: ""
    });
  }

  return selected;
}

function getSelectedLibraries() {
  return getSelectedLibraryObjects().map(
    item => item.libraryName
  );
}

// function getSelectedLibraryObjects() {
//   return [...libraryCheckboxList.querySelectorAll("input:checked")]
//     .map(input => ({
//       libraryName: input.value,
//       password: input.dataset.password || ""
//     }));
// }

function getSelectedLibraryNames() {
  return getSelectedLibraryObjects().map(item => item.libraryName);
}

// function getSelectedLibraries() {
//   return [...libraryCheckboxList.querySelectorAll("input:checked")]
//     .map(input => input.value);
// }

function updateLibraryButton() {
  const selected = getSelectedLibraries();

  libraryDropdownBtn.textContent =
    selected.length > 0 ? selected.join(", ") : "선택하기";
}

libraryCheckboxList.addEventListener("change", (e) => {
  const checkbox = e.target.closest(
    'input[type="checkbox"]'
  );

  if (!checkbox) {
    return;
  }

  if (checkbox.value === "Central Library") {
    checkbox.checked = true;
    updateLibraryButton();
    return;
  }

  if (
    checkbox.checked &&
    checkbox.dataset.sharing === "패스워드 필요"
  ) {
    const password = prompt(
      `Enter the password for ${checkbox.value}`
    );

    if (password === null || password.trim() === "") {
      checkbox.checked = false;
      checkbox.dataset.password = "";

      updateLibraryButton();
      return;
    }

    checkbox.dataset.password = password.trim();
  }

  if (!checkbox.checked) {
    checkbox.dataset.password = "";
  }

  updateLibraryButton();
});


libraryDropdown.addEventListener("click", (e) => {
  e.stopPropagation();
});

document.addEventListener("click", (e) => {
  if (
    !libraryDropdown.contains(e.target) &&
    e.target !== libraryDropdownBtn
  ) {
    libraryDropdown.classList.remove("is-open");
  }
});

// libraryCheckboxList.addEventListener("change", (e) => {
//   const checkbox = e.target;

//   if (checkbox.value === "Central Library") {
//     checkbox.checked = true;
//     updateLibraryButton();
//     return;
//   }

//   if (
//     checkbox.checked &&
//     checkbox.dataset.sharing === "패스워드 필요"
//   ) {
//     const password = prompt(`Enter the password for ${checkbox.value}`);

//     if (!password) {
//       checkbox.checked = false;
//       updateLibraryButton();
//       return;
//     }

//     checkbox.dataset.password = password;
//   }

//   updateLibraryButton();
// });

// ================================================
addLibraryToExistingBookBtn.addEventListener("click", async () => {
  if (!duplicateBook) return;

  const library = getSelectedLibraryObjects();

  const response = await fetch(`/books/${duplicateBook.id}/add-library`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8"
    },
    body: JSON.stringify({ library })
  });

  const result = await response.json();

  if (result.success) {
    alert("기존 책에 library가 추가되었습니다.");

    duplicateBookCard.style.display = "none";
    duplicateBook = null;
    form.reset();
  } else {
    alert(result.message);
  }
});

// ================================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = form.title.value.trim();
  const url = form.url.value.trim();

  const author = [...document.querySelectorAll(".authorInput")]
    .map(input => input.value.trim())
    .filter(Boolean);

  const library = getSelectedLibraryObjects();

  if (!title || !url) {
    alert("Title과 URL을 입력해주세요.");
    return;
  }

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

  if (checkResult.exists) {
    duplicateBook = checkResult.book;

    duplicateTitle.textContent = duplicateBook.title;
    duplicateAuthor.textContent = Array.isArray(duplicateBook.author)
      ? duplicateBook.author.join(", ")
      : "";
    duplicateUrl.textContent = duplicateBook.url;
    duplicateLibrary.textContent = Array.isArray(duplicateBook.library)
      ? duplicateBook.library.join(", ")
      : "";

    duplicateBookCard.style.display = "block";
    return;
  }

  const response = await fetch("/register-book", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8"
    },
    body: JSON.stringify({
      title,
      author,
      url,
      library
    })
  });

  const result = await response.json();

  if (result.success) {
    alert("Done!");
    form.reset();
    duplicateBookCard.style.display = "none";
    duplicateBook = null;
  } else {
    alert(result.message);
  }
});

// form.addEventListener("submit", async (e) => {
//   e.preventDefault();

//   const title = form.title.value.trim();
//   const url = form.url.value.trim();

//   const author = [...document.querySelectorAll(".authorInput")]
//     .map(input => input.value.trim())
//     .filter(Boolean);

//   const library = [...libraryCheckboxList.querySelectorAll("input:checked")]
//   .map(input => ({
//     libraryName: input.value,
//     password: input.dataset.password || ""
//   }));

//   const submitTime = new Date().toISOString();

//   const data = {
//     title,
//     author,
//     url,
//     library
//   };

//   const response = await fetch("/register-book", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json;charset=UTF-8"
//     },
//     body: JSON.stringify(data)
//   });

//   const result = await response.json();

//   if (result.success) {
//     alert("Done!");

//     form.reset();

//     libraryCheckboxList
//       .querySelectorAll("input")
//       .forEach(input => {
//         input.checked = input.value === "Central Library";
//       });

//     updateLibraryButton();

//     // Author를 하나만 남김
//     authorList.innerHTML = `
//       <div class="author-row">
//         <input type="text" class="authorInput" required />
//       </div>
//     `;

//     submitBtn.disabled = true;
//   } else {
//     alert(result.message);
//   }
// });

// loadLibraries();