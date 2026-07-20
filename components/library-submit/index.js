// const form = document.getElementById("libraryForm");
// const nameStatus = document.getElementById("nameStatus");
// const colorPicker = document.getElementById("colorPicker");
// const colorHex = document.getElementById("colorHex");
// const message = document.getElementById("message");
// const submitBtn = document.getElementById("submitBtn");

// const houseTextarea =
//   document.getElementById("houseTextarea");

// const houseRadios =
//   document.querySelectorAll(
//     'input[name="houseExample"]'
//   );

// const libraryNamePattern =
//   /^(?![._-])(?!.*[._-]{2})[A-Za-z0-9._-]+(?<![._-])$/;

// const colorPattern =
//   /^#[0-9A-Fa-f]{6}$/;

// let nameAvailable = false;
// let nameCheckTimer = null;
// let nameCheckController = null;


// // ======================================================
// // House
// // ======================================================

// const houseExamples = [
// `
// ▒▒▒▒▒▒▒▒▒▒▒▒
// ▒▒▒▒▒▒▒▒▒▒▒▒
// ████████████
// █░░██████░░█
// ████░░░░████
// ████░░░░████
// `,

// `
// ▒▒▒▒▒▒▒▒▒▒▒▒
// ▒▒▒▒▒▒▒▒▒▒▒▒
// █▓▓█▓▓█▓▓█▓▓
// ▓▓█▓▓█▓▓█▓▓█
// █▓▓█▓▓█▓▓█▓▓
// ▓▓█▓▓█▓▓█▓▓█
// `
// ];

// const HOUSE_MAX_COLUMNS = 12;
// const HOUSE_MAX_ROWS = 6;


// function normalizeHouseText(text) {
//   return text
//     .replace(/\r\n?/g, "\n")
//     .split("\n")
//     .slice(0, HOUSE_MAX_ROWS)
//     .map(line => {
//       return Array
//         .from(line)
//         .slice(0, HOUSE_MAX_COLUMNS)
//         .join("");
//     })
//     .join("\n");
// }


// function setHouseExample(index) {
//   const example = houseExamples[index];

//   if (typeof example !== "string") {
//     return;
//   }

//   houseTextarea.value =
//     normalizeHouseText(example.trim());

//   checkForm();
// }


// window.setHouseExample = setHouseExample;


// houseTextarea.addEventListener("input", () => {
//   const originalValue = houseTextarea.value;
//   const selectionStart =
//     houseTextarea.selectionStart;

//   const normalizedValue =
//     normalizeHouseText(originalValue);

//   if (originalValue !== normalizedValue) {
//     houseTextarea.value = normalizedValue;

//     const nextPosition = Math.min(
//       selectionStart,
//       normalizedValue.length
//     );

//     houseTextarea.setSelectionRange(
//       nextPosition,
//       nextPosition
//     );
//   }

//   checkForm();
// });


// houseTextarea.addEventListener("keydown", event => {
//   if (event.key !== "Enter") {
//     return;
//   }

//   const value = houseTextarea.value;

//   const selectionStart =
//     houseTextarea.selectionStart;

//   const selectionEnd =
//     houseTextarea.selectionEnd;

//   const currentLines = value.split("\n");

//   const selectedText = value.slice(
//     selectionStart,
//     selectionEnd
//   );

//   const selectedLineBreaks =
//     (selectedText.match(/\n/g) || []).length;

//   const resultingLineCount =
//     currentLines.length +
//     1 -
//     selectedLineBreaks;

//   if (resultingLineCount > HOUSE_MAX_ROWS) {
//     event.preventDefault();
//   }
// });


// houseRadios.forEach(radio => {
//   radio.addEventListener("change", () => {
//     if (!radio.checked) {
//       return;
//     }

//     setHouseExample(Number(radio.value));
//   });
// });


// // ======================================================
// // Color
// // ======================================================

// function getColorBrightness(hex) {
//   if (!colorPattern.test(hex)) {
//     return 0;
//   }

//   const normalizedHex = hex.replace("#", "");

//   const red = parseInt(
//     normalizedHex.slice(0, 2),
//     16
//   );

//   const green = parseInt(
//     normalizedHex.slice(2, 4),
//     16
//   );

//   const blue = parseInt(
//     normalizedHex.slice(4, 6),
//     16
//   );

//   return (
//     red * 299 +
//     green * 587 +
//     blue * 114
//   ) / 1000;
// }


// function updateHouseColor(color) {
//   if (!colorPattern.test(color)) {
//     return;
//   }

//   houseTextarea.style.color = color;

//   const brightness =
//     getColorBrightness(color);

//   const brightnessThreshold = 200;

//   if (brightness >= brightnessThreshold) {
//     houseTextarea.style.textShadow =
//       "1px 0px gray";
//   } else {
//     houseTextarea.style.textShadow =
//       "none";
//   }
// }


// colorPicker.addEventListener("input", () => {
//   const color = colorPicker.value;

//   colorHex.value = color;

//   updateHouseColor(color);
//   checkForm();
// });


// colorHex.addEventListener("input", () => {
//   const color = colorHex.value.trim();

//   if (colorPattern.test(color)) {
//     colorPicker.value = color;
//     updateHouseColor(color);
//   }

//   checkForm();
// });


// // ======================================================
// // Form Validation
// // ======================================================

// function checkForm() {
//   const libraryName =
//     form.elements.libraryName.value.trim();

//   const password =
//     form.elements.password.value.trim();

//   const color =
//     colorHex.value.trim();

//   const bookSharing =
//     form.querySelector(
//       'input[name="bookSharing"]:checked'
//     );

//   const nameValid =
//     libraryNamePattern.test(libraryName);

//   const colorValid =
//     /^#[0-9A-Fa-f]{6}$/.test(color);

//   const allFieldsValid =
//     libraryName.length > 0 &&
//     nameValid &&
//     nameAvailable &&
//     password.length > 0 &&
//     colorValid &&
//     bookSharing !== null;

//   if (allFieldsValid) {
//     submitBtn.removeAttribute("disabled");
//   } else {
//     submitBtn.setAttribute("disabled", "");
//   }
// }

// // function checkForm() {
// //   const libraryName =
// //     form.elements.libraryName.value.trim();

// //   const password =
// //     form.elements.password.value.trim();

// //   const color =
// //     colorHex.value.trim();

// //   const bookSharing =
// //     form.querySelector(
// //       'input[name="bookSharing"]:checked'
// //     );

// //   const libraryNameEntered =
// //     libraryName.length > 0;

// //   const nameValid =
// //     libraryNamePattern.test(libraryName);

// //   const passwordValid =
// //     password.length > 0;

// //   const colorValid =
// //     colorPattern.test(color);

// //   const bookSharingValid =
// //     bookSharing !== null;

// //   const formValid =
// //     libraryNameEntered &&
// //     nameValid &&
// //     passwordValid &&
// //     colorValid &&
// //     bookSharingValid &&
// //     nameAvailable;

// //   submitBtn.disabled = !formValid;

// //   // Submit 버튼이 계속 disabled일 때
// //   // Console에서 어떤 값이 false인지 확인할 수 있습니다.
// //   console.log("Library form validation:", {
// //     libraryNameEntered,
// //     nameValid,
// //     passwordValid,
// //     colorValid,
// //     bookSharingValid,
// //     nameAvailable,
// //     formValid
// //   });
// // }


// // ======================================================
// // Library Name Check
// // ======================================================

// form.elements.libraryName.addEventListener(
//   "input",
//   () => {
//     clearTimeout(nameCheckTimer);

//     if (nameCheckController) {
//       nameCheckController.abort();
//       nameCheckController = null;
//     }

//     const name =
//       form.elements.libraryName.value.trim();

//     nameAvailable = false;
//     checkForm();

//     if (!name) {
//       nameStatus.textContent = "";
//       return;
//     }

//     if (!libraryNamePattern.test(name)) {
//       nameStatus.textContent =
//         "Only letters, numbers, hyphens (-), underscores (_), and periods (.) are allowed";

//       nameStatus.style.color = "red";
//       return;
//     }

//     nameStatus.textContent =
//       "Checking availability...";

//     nameStatus.style.color = "gray";

//     nameCheckTimer = setTimeout(async () => {
//       nameCheckController =
//         new AbortController();

//       try {
//         const response = await fetch(
//           `/check-library-name?name=${encodeURIComponent(name)}`,
//           {
//             cache: "no-store",
//             signal: nameCheckController.signal
//           }
//         );

//         if (!response.ok) {
//           throw new Error(
//             `Name check failed: ${response.status}`
//           );
//         }

//         const result = await response.json();

//         // 입력값이 요청을 보냈을 때와 달라졌다면
//         // 이전 요청의 결과를 무시합니다.
//         const currentName =
//           form.elements.libraryName.value.trim();

//         if (currentName !== name) {
//           return;
//         }

//         nameAvailable =
//           result.available === true;

//         if (nameAvailable) {
//           nameStatus.textContent =
//             "This name is available";

//           nameStatus.style.color = "green";
//         } else {
//           nameStatus.textContent =
//             "This name is already taken";

//           nameStatus.style.color = "red";
//         }
//       } catch (error) {
//         if (error.name === "AbortError") {
//           return;
//         }

//         console.error(error);

//         nameAvailable = false;

//         nameStatus.textContent =
//           "Unable to check this name";

//         nameStatus.style.color = "red";
//       } finally {
//         checkForm();
//       }
//     }, 300);
//   }
// );


// // ======================================================
// // Other Form Events
// // ======================================================

// form.elements.password.addEventListener(
//   "input",
//   checkForm
// );


// document
//   .querySelectorAll(
//     'input[name="bookSharing"]'
//   )
//   .forEach(radio => {
//     radio.addEventListener(
//       "change",
//       checkForm
//     );
//   });


// // ======================================================
// // Submit
// // ======================================================

// form.addEventListener("submit", async event => {
//   event.preventDefault();

//   checkForm();

//   if (submitBtn.disabled) {
//     return;
//   }

//   const libraryName =
//     form.elements.libraryName.value.trim();

//   const password =
//     form.elements.password.value.trim();

//   const color =
//     colorHex.value.trim();

//   const selectedBookSharing =
//     form.querySelector(
//       'input[name="bookSharing"]:checked'
//     );

//   const bookSharing =
//     selectedBookSharing
//       ? selectedBookSharing.value
//       : "";

//   const house =
//     normalizeHouseText(houseTextarea.value);


//   if (!libraryName) {
//     alert("Please enter a library name");
//     return;
//   }


//   if (!libraryNamePattern.test(libraryName)) {
//     alert(
//       "The library name may contain only letters, numbers, hyphens (-), underscores (_), and periods (.)."
//     );

//     return;
//   }


//   if (!nameAvailable) {
//     alert(
//       "Please choose an available library name"
//     );

//     return;
//   }


//   if (!password) {
//     alert("Please enter a password");
//     return;
//   }


//   if (!colorPattern.test(color)) {
//     alert("Please enter a valid color");
//     return;
//   }


//   if (!bookSharing) {
//     alert(
//       "Please select a book-sharing option"
//     );

//     return;
//   }


//   const data = {
//     libraryName,
//     password,
//     color,
//     bookSharing,
//     house
//   };


//   submitBtn.disabled = true;

//   if (message) {
//     message.textContent =
//       "Creating library...";
//   }


//   try {
//     const response = await fetch(
//       "/register-library",
//       {
//         method: "POST",

//         headers: {
//           "Content-Type":
//             "application/json;charset=UTF-8"
//         },

//         body: JSON.stringify(data)
//       }
//     );


//     const result = await response.json();


//     if (!response.ok || !result.success) {
//       throw new Error(
//         result.message ||
//         "Failed to create the library"
//       );
//     }


//     form.reset();

//     const defaultColor = "#d35838";

//     colorPicker.value = defaultColor;
//     colorHex.value = defaultColor;

//     updateHouseColor(defaultColor);


//     nameAvailable = false;
//     nameStatus.textContent = "";


//     const randomHouseIndex =
//       Math.floor(
//         Math.random() *
//         houseExamples.length
//       );

//     if (houseRadios[randomHouseIndex]) {
//       houseRadios.forEach(radio => {
//         radio.checked = false;
//       });

//       houseRadios[
//         randomHouseIndex
//       ].checked = true;

//       setHouseExample(randomHouseIndex);
//     }


//     if (message) {
//       message.textContent =
//         "Library created successfully";
//     }

//     checkForm();
//   } catch (error) {
//     console.error(error);

//     if (message) {
//       message.textContent = error.message;
//     } else {
//       alert(error.message);
//     }

//     checkForm();
//   }
// });


// // ======================================================
// // Initial State
// // ======================================================

// const initialColor =
//   colorPattern.test(colorHex.value.trim())
//     ? colorHex.value.trim()
//     : "#d35838";

// colorPicker.value = initialColor;
// colorHex.value = initialColor;

// updateHouseColor(initialColor);


// const randomHouseIndex =
//   Math.floor(
//     Math.random() *
//     houseExamples.length
//   );

// if (houseRadios[randomHouseIndex]) {
//   houseRadios[randomHouseIndex].checked = true;
//   setHouseExample(randomHouseIndex);
// }


// checkForm();

const form = document.getElementById("libraryForm");
const nameStatus = document.getElementById("nameStatus");
const colorPicker = document.getElementById("colorPicker");
const colorHex = document.getElementById("colorHex");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const libraryNamePattern = /^(?![._-])(?!.*[._-]{2})[A-Za-z0-9._-]+(?<![._-])$/;

let nameAvailable = false;

// ===============================================
// House
// ===============================================
const houseTextarea = document.getElementById("houseTextarea");
const houseRadios = document.querySelectorAll('input[name="houseExample"]');

const houseExamples = [
`
▒▒▒▒▒▒▒▒▒▒▒▒
▒▒▒▒▒▒▒▒▒▒▒▒
████████████
█░░██████░░█
████░░░░████
████░░░░████
`,

`
▒▒▒▒▒▒▒▒▒▒▒▒
▒▒▒▒▒▒▒▒▒▒▒▒
█▓▓█▓▓█▓▓█▓▓
▓▓█▓▓█▓▓█▓▓█
█▓▓█▓▓█▓▓█▓▓
▓▓█▓▓█▓▓█▓▓█
`
];

const HOUSE_MAX_COLUMNS = 12;
const HOUSE_MAX_ROWS = 6;

function normalizeHouseText(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .slice(0, HOUSE_MAX_ROWS)
    .map(line =>
      Array.from(line)
        .slice(0, HOUSE_MAX_COLUMNS)
        .join("")
    )
    .join("\n");
}

houseTextarea.addEventListener("input", () => {
  const start = houseTextarea.selectionStart;
  const before = houseTextarea.value;

  const normalized = normalizeHouseText(before);

  if (before !== normalized) {
    houseTextarea.value = normalized;

    const nextPosition = Math.min(
      start,
      houseTextarea.value.length
    );

    houseTextarea.setSelectionRange(
      nextPosition,
      nextPosition
    );
  }
});

houseTextarea.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") {
    return;
  }

  const value = houseTextarea.value;
  const selectionStart = houseTextarea.selectionStart;
  const selectionEnd = houseTextarea.selectionEnd;

  const lines = value.split("\n");

  // 선택 영역에 줄바꿈이 포함되면 새 줄 수가 줄어들 수 있으므로 허용
  const selectedText = value.slice(
    selectionStart,
    selectionEnd
  );

  const selectedLineBreaks =
    (selectedText.match(/\n/g) || []).length;

  const resultingLineCount =
    lines.length + 1 - selectedLineBreaks;

  if (resultingLineCount > HOUSE_MAX_ROWS) {
    e.preventDefault();
  }
});

// ===============================================
// Hue Color Picker
// ===============================================
// function updateHouseColor(color) {
//   houseTextarea.style.color = color;
// }

// 초기 색상 적용
function getColorBrightness(hex) {
  const normalizedHex = hex.replace("#", "");

  const r = parseInt(normalizedHex.slice(0, 2), 16);
  const g = parseInt(normalizedHex.slice(2, 4), 16);
  const b = parseInt(normalizedHex.slice(4, 6), 16);

  // 0~255 사이의 밝기 값
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function updateHouseColor(color) {
  houseTextarea.style.color = color;

  const brightness = getColorBrightness(color);
  const brightnessThreshold = 200;

  if (brightness >= brightnessThreshold) {
    houseTextarea.style.textShadow = "1px 0px gray";
  } else {
    houseTextarea.style.textShadow = "none";
  }
}
// updateHouseColor(colorPicker.value);

colorPicker.addEventListener("input", () => {
  colorHex.value = colorPicker.value;
  updateHouseColor(colorPicker.value);
  checkForm();
});

colorHex.addEventListener("input", () => {
  if (/^#[0-9A-Fa-f]{6}$/.test(colorHex.value)) {
    colorPicker.value = colorHex.value;
    updateHouseColor(colorHex.value);
  }

  checkForm();
});


window.setHouseExample = function(index) {
  houseTextarea.value = houseExamples[index]
    .trim()
    .split("\n")
    .slice(0, HOUSE_MAX_ROWS)
    .map(line =>
      Array.from(line)
        .slice(0, HOUSE_MAX_COLUMNS)
        .join("")
    )
    .join("\n");
};

// window.setHouseExample = function(index) {
//   houseTextarea.innerText = houseExamples[index]
//     .trim()
//     .split("\n")
//     .slice(0, HOUSE_MAX_ROWS)
//     .map(line =>
//       Array.from(line)
//         .slice(0, HOUSE_MAX_COLUMNS)
//         .join("")
//     )
//     .join("\n");
//   // houseTextarea.textContent = houseExamples[index];
// };

houseRadios.forEach(radio => {
  radio.addEventListener("change", () => {
    window.setHouseExample(Number(radio.value));
  });
});

const randomHouseIndex = Math.floor(Math.random() * houseExamples.length);

if (houseRadios[randomHouseIndex]) {
  houseRadios[randomHouseIndex].checked = true;
  window.setHouseExample(randomHouseIndex);
}


// function setHouseExample(index) {
//   houseTextarea.value = houseExamples[index];
// }

// houseRadios.forEach(radio => {
//   radio.addEventListener("change", () => {
//     setHouseExample(Number(radio.value));
//   });
// });

// const randomHouseIndex = Math.floor(Math.random() * houseExamples.length);

// houseRadios[randomHouseIndex].checked = true;
// setHouseExample(randomHouseIndex);


// ===============================================
// Form Validation
// ===============================================
function checkForm() {
  const libraryName = form.libraryName.value.trim();
  const password = form.password.value;
  const color = form.color.value.trim();

  const bookSharing = form.querySelector(
    'input[name="bookSharing"]:checked'
  );

  const colorValid = /^#[0-9A-Fa-f]{6}$/.test(color);
  const nameValid = libraryNamePattern.test(libraryName);

  submitBtn.disabled = !(
    libraryName &&
    nameValid &&
    password &&
    colorValid &&
    bookSharing &&
    nameAvailable
  );
}


// ===============================================
// Library Name Check
// ===============================================
let timer;
form.libraryName.addEventListener("input", () => {
  clearTimeout(timer);

  const name = form.libraryName.value.trim();

  nameAvailable = false;
  checkForm();

  if (!name) {
    nameStatus.textContent = "";
    return;
  }

  if (!libraryNamePattern.test(name)) {
    nameStatus.textContent =
      "Only letters, numbers, hyphens (-), underscores (_), and periods (.) are allowed";
    nameStatus.style.color = "red";
    return;
  }

  timer = setTimeout(async () => {
    const res = await fetch(
      `/check-library-name?name=${encodeURIComponent(name)}`
    );

    const result = await res.json();

    nameAvailable = result.available;

    if (result.available) {
      nameStatus.textContent = "This name is available";
      nameStatus.style.color = "green";
    } else {
      nameStatus.textContent = "This name is already taken";
      nameStatus.style.color = "red";
    }

    checkForm();
  }, 300);
});


form.password.addEventListener("input", checkForm);

document.querySelectorAll('input[name="bookSharing"]').forEach(radio => {
    radio.addEventListener("change", checkForm);
});


// ===============================================
// Submit
// ===============================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const libraryName = form.libraryName.value.trim();
  const password = form.password.value;
  const color = form.color.value.trim();
  const bookSharing = form.bookSharing.value;
  // const house = houseTextarea.textContent;
  // const house = getHouseTextForSave();
  const house = houseTextarea.value;

  if (!libraryName) {
    alert("Please enter a library name");
    return;
  }

  if (!libraryNamePattern.test(libraryName)) {
    alert("The library name may contain only letters, numbers, hyphens (-), underscores (_), and periods (.)The library name may contain only letters, numbers, hyphens (-), underscores (_), and periods (.)");
    return;
  }

  if (!password) {
    alert("Please enter a password");
    return;
  }

  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    alert("Please enter a valid color");
    return;
  }

  if (!bookSharing) {
    alert("Please select a book-sharing option");
    return;
  }

  const data = {
    libraryName,
    password,
    color,
    bookSharing,
    house
  };

  const response = await fetch("/register-library", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=UTF-8"
    },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (result.success) {
    alert("Done!");

    form.reset();
    
    const defaultColor = "#d35838";
    colorPicker.value = defaultColor;
    colorHex.value = defaultColor;
    updateHouseColor(defaultColor);

    nameAvailable = false;
    nameStatus.textContent = "";
    submitBtn.disabled = true;
  } else {
    alert(result.message);
  }
});