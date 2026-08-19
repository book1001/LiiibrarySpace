const form = document.getElementById("libraryForm");
const nameStatus = document.getElementById("nameStatus");
const colorPicker = document.getElementById("colorPicker");
// const colorHex = document.getElementById("colorHex");
const descriptionInput = document.getElementById("description");
const message = document.getElementById("message");
const librarySubmitBtn = document.getElementById("librarySubmitBtn");

const libraryNamePattern = /^(?![._-])(?!.*[._-]{2})[A-Za-z0-9._-]+(?<![._-])$/;
const colorPattern = /^#[0-9A-Fa-f]{6}$/;

let nameAvailable = false;
let nameCheckTimer;
let nameCheckController = null;

// ===============================================
// House
// ===============================================
const houseTextarea = document.getElementById("houseTextarea");
const houseTitle = document.getElementById("houseTitle");
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
    .map(line => {
      return Array.from(line)
        .slice(0, HOUSE_MAX_COLUMNS)
        .join("");
    })
    .join("\n");
}

// houseTextarea.addEventListener("input", () => {
//   const selectionStart = houseTextarea.selectionStart;
//   const before = houseTextarea.value;
//   const normalized = normalizeHouseText(before);

//   if (before !== normalized) {
//     houseTextarea.value = normalized;

//     const nextPosition = Math.min(
//       selectionStart,
//       houseTextarea.value.length
//     );

//     houseTextarea.setSelectionRange(
//       nextPosition,
//       nextPosition
//     );
//   }

//   checkForm();
// });

// houseTextarea.addEventListener(
//   "keydown",
//   event => {
//     if (event.key !== "Enter") {
//       return;
//     }

//     const value = houseTextarea.value;
//     const selectionStart = houseTextarea.selectionStart;
//     const selectionEnd = houseTextarea.selectionEnd;
//     const lines = value.split("\n");

//     const selectedText =
//       value.slice(
//         selectionStart,
//         selectionEnd
//       );

//     const selectedLineBreaks =
//       (selectedText.match(/\n/g) || [])
//         .length;

//     const resultingLineCount =
//       lines.length +
//       1 -
//       selectedLineBreaks;

//     if (
//       resultingLineCount >
//       HOUSE_MAX_ROWS
//     ) {
//       event.preventDefault();
//     }
//   }
// );

// ===============================================
// House Example
// ===============================================
window.setHouseExample = function(index) {
  const example = houseExamples[index];

  if (!example) {
    return;
  }

  houseTextarea.textContent = normalizeHouseText(example.trim());
  // houseTitle.textContent = "";

  checkForm();
};

houseRadios.forEach(radio => {
  radio.addEventListener(
    "change",
    () => {
      window.setHouseExample(
        Number(radio.value)
      );
    }
  );
});

function selectRandomHouse() {
  const randomHouseIndex =
    Math.floor(
      Math.random() *
      houseExamples.length
    );

  const selectedRadio = houseRadios[randomHouseIndex];

  if (selectedRadio) {
    selectedRadio.checked = true;

    window.setHouseExample(
      randomHouseIndex
    );
  }
}

// ===============================================
// Hue Color Picker
// ===============================================
function getColorBrightness(hex) {
  if (!colorPattern.test(hex)) return 0;

  const normalizedHex = hex.replace("#", "");
  const r = parseInt(normalizedHex.slice(0, 2), 16);
  const g = parseInt(normalizedHex.slice(2, 4), 16);
  const b = parseInt(normalizedHex.slice(4, 6), 16);

  return (r * 299 + g * 587 + b * 114) / 1000;
}

function updateHouseColor(color) {
  if (!colorPattern.test(color)) return;

  houseTextarea.style.color = color;
  houseTitle.style.color = color;

  const brightness = getColorBrightness(color);
  const brightnessThreshold = 250;

  if (brightness >= brightnessThreshold) {
    houseTextarea.style.textShadow = "1px 0px black";
  } else {
    houseTextarea.style.textShadow = "none";
  }
}

function normalizeColor(color) {
  const value = String(color || "").trim().toLowerCase();
  return colorPattern.test(value) ? value : null;
}

function setLibraryColor(color) {
  const normalizedColor = normalizeColor(color);

  if (!normalizedColor) {
    checkForm();
    return;
  }

  colorPicker.value = normalizedColor;
  colorPicker.dataset.lastValidColor = normalizedColor;

  updateHouseColor(normalizedColor);
  checkForm();
}

colorPicker.addEventListener("input", event => {
  const color = normalizeColor(event.target.value);

  if (color) {
    colorPicker.dataset.lastValidColor = color;
    updateHouseColor(color);
  }

  checkForm();
});

colorPicker.addEventListener("change", event => {
  setLibraryColor(event.target.value);
});

colorPicker.addEventListener("blur", event => {
  const color = normalizeColor(event.target.value);

  if (color) {
    setLibraryColor(color);
    return;
  }

  setLibraryColor(colorPicker.dataset.lastValidColor || "#d35838");
});

// function setLibraryColor(color) {
//   const normalizedColor = color.trim().toLowerCase();

//   if (!colorPattern.test(normalizedColor)) {
//     checkForm();
//     return;
//   }

//   colorPicker.value = normalizedColor;
//   colorHex.value = normalizedColor;

//   const colorisField = colorPicker.closest(".clr-field");

//   if (colorisField) {
//     colorisField.style.color = normalizedColor;
//   }

//   updateHouseColor(normalizedColor);
//   checkForm();
// }

// colorPicker.addEventListener("input", event => {
//   setLibraryColor(event.target.value);
// });

// colorPicker.addEventListener("change", event => {
//   setLibraryColor(event.target.value);
// });

// colorHex.addEventListener("input", event => {
//   const color = event.target.value.trim();

//   if (colorPattern.test(color)) {
//     setLibraryColor(color);
//     return;
//   }

//   checkForm();
// });

// colorHex.addEventListener("blur", event => {
//   const color = event.target.value.trim();

//   if (colorPattern.test(color)) {
//     setLibraryColor(color);
//     return;
//   }

//   colorHex.value = colorPicker.value;
//   checkForm();
// });

// ===============================================
// Form Validation
// ===============================================
function checkForm() {
  const libraryName = form.libraryName.value.trim();
  const password = form.password.value.trim();
  const color = colorPicker.value.trim().toLowerCase();
  // const color = colorHex.value.trim();
  const selectedBookSharing = form.querySelector('input[name="bookSharing"]:checked');

  const nameValid = libraryName.length > 0 && libraryNamePattern.test(libraryName);
  const passwordValid = password.length > 0;
  const colorValid = colorPattern.test(color);
  const bookSharingValid = selectedBookSharing !== null;
  const houseValid = houseTextarea.textContent.trim().length > 0;

  const formValid =
    nameValid &&
    nameAvailable &&
    passwordValid &&
    colorValid &&
    bookSharingValid &&
    houseValid;

  librarySubmitBtn.disabled = !formValid;

  // console.log({
  //   libraryName,
  //   nameValid,
  //   nameAvailable,
  //   passwordValid,
  //   color,
  //   colorValid,
  //   bookSharingValid,
  //   houseValid,
  //   formValid
  // });
}

// ===============================================
// Library Name Check
// ===============================================
form.libraryName.addEventListener("input", () => {
    // houseTitle.innerHTML = "";

    // const span = document.createElement("span");
    // span.textContent = form.libraryName.value;

    // houseTitle.appendChild(span);
    
    houseTitle.textContent = form.libraryName.value;

    clearTimeout(nameCheckTimer);

    if (nameCheckController) {
      nameCheckController.abort();
      nameCheckController = null;
    }

    const name = form.libraryName.value.trim();
    nameAvailable = false;
    checkForm();

    if (!name) {
      nameStatus.textContent = "";
      return;
    }

    if (
      !libraryNamePattern.test(name)
    ) {
      nameStatus.textContent = "Only letters, numbers, hyphens (-), underscores (_), and periods (.) are allowed";
      nameStatus.style.color = "red";
      return;
    }

    nameStatus.textContent = "Checking availability...";
    nameStatus.style.color = "gray";

    nameCheckTimer =
      setTimeout(
        async () => {
          nameCheckController =
            new AbortController();

          try {
            const response =
              await fetch(
                `/check-library-name?name=${encodeURIComponent(name)}`,
                {
                  signal:
                    nameCheckController
                      .signal,

                  cache: "no-store"
                }
              );

            if (!response.ok) {
              throw new Error(
                `Name check failed: ${response.status}`
              );
            }

            const result = await response.json();

            const currentName =
              form.libraryName
                .value
                .trim();

            if (
              currentName !== name
            ) {
              return;
            }

            nameAvailable =
              result.available === true;

            if (nameAvailable) {
              nameStatus.textContent = "This name is available";
              nameStatus.style.color = "green";
            } else {
              nameStatus.textContent = "This name is already taken";
              nameStatus.style.color =  "red";
            }

            checkForm();
          } catch (error) {
            if (
              error.name === "AbortError"
            ) {
              return;
            }

            console.error( "Library name check error:", error);

            const currentName =
              form.libraryName
                .value
                .trim();

            if (
              currentName !== name
            ) {
              return;
            }

            nameAvailable = false;

            nameStatus.textContent =
              "Unable to check this name";

            nameStatus.style.color =
              "red";

            checkForm();
          } finally {
            nameCheckController =
              null;
          }
        },
        300
      );
  }
);

// ===============================================
// Other Form Events
// ===============================================
form.password.addEventListener(
  "input",
  checkForm
);

document
  .querySelectorAll(
    'input[name="bookSharing"]'
  )
  .forEach(radio => {
    radio.addEventListener(
      "change",
      checkForm
    );
  });

// ===============================================
// Submit
// ===============================================
form.addEventListener("submit", async event => {
  event.preventDefault();

  const libraryName = form.libraryName.value.trim();
  const password = form.password.value.trim();
  const color = colorPicker.value.trim().toLowerCase();
  // const color = colorHex.value.trim();
  const description = descriptionInput.value.trim();
  const selectedBookSharing = form.querySelector('input[name="bookSharing"]:checked');
  const bookSharing = selectedBookSharing ? selectedBookSharing.value : "";
  const house = normalizeHouseText(houseTextarea.textContent);
  const houseTitleText = houseTitle.innerText.trim();

  if (!libraryName) {
    alert("Please enter a library name");
    return;
  }

  if (!libraryNamePattern.test(libraryName)) {
    alert(
      "The library name may contain only letters, numbers, hyphens (-), underscores (_), and periods (.). It cannot begin or end with punctuation, and punctuation cannot appear twice in a row."
    );
    return;
  }

  if (!nameAvailable) {
    alert("Please choose an available library name");
    return;
  }

  if (!password) {
    alert("Please enter a password");
    return;
  }

  if (!colorPattern.test(color)) {
    alert("Please enter a valid color");
    return;
  }

  if (!bookSharing) {
    alert("Please select a book-sharing option");
    return;
  }

  if (!house.trim()) {
    alert("Please enter a house");
    return;
  }

  const data = {
    libraryName,
    editableName: `${libraryName} Liiibrary`,
    password,
    description,
    color,
    bookSharing,
    house,
    houseTitle: houseTitleText
  };

  try {
    librarySubmitBtn.disabled = true;

    if (message) {
      message.textContent = "Registering...";
    }

    const response = await fetch("/register-library", {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=UTF-8"
      },
      body: JSON.stringify(data)
    });

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error("The server returned an invalid response");
    }

    if (!response.ok) {
      throw new Error(
        result.message ||
        `Registration failed: ${response.status}`
      );
    }

    if (result.success) {
      alert("Done!");

      form.reset();

      const defaultColor = "#d35838";
      setLibraryColor(defaultColor);

      nameAvailable = false;
      nameStatus.textContent = "";

      if (message) {
        message.textContent = "";
      }

      selectRandomHouse();
      checkForm();
    } else {
      alert(
        result.message ||
        "Failed to register the library"
      );

      if (message) {
        message.textContent = result.message || "";
      }

      checkForm();
    }
  } catch (error) {
    console.error("Library registration error:", error);

    alert(
      error.message ||
      "Failed to register the library"
    );

    if (message) {
      message.textContent =
        error.message ||
        "Failed to register the library";
    }

    checkForm();
  }
});

// ===============================================
// Initial State
// ===============================================
function initializeForm() {
  const initialColor = normalizeColor(colorPicker.value) || "#d35838";

  setLibraryColor(initialColor);

  if (!houseTextarea.textContent.trim()) {
    selectRandomHouse();
  }

  nameAvailable = false;
  librarySubmitBtn.disabled = true;

  checkForm();
}

// function initializeForm() {
//   const colorFromPicker = colorPicker.value.trim();
//   const colorFromHex = colorHex.value.trim();

//   const initialColor =
//     colorPattern.test(colorFromHex)
//       ? colorFromHex
//       : colorPattern.test(colorFromPicker)
//         ? colorFromPicker
//         : "#d35838";

//   setLibraryColor(initialColor);

//   if (!houseTextarea.textContent.trim()) {
//     selectRandomHouse();
//   }

//   nameAvailable = false;
//   librarySubmitBtn.disabled = true;

//   checkForm();
// }


initializeForm();

