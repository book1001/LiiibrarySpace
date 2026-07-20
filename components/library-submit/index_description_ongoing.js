const form = document.getElementById("libraryForm");
const nameStatus = document.getElementById("nameStatus");
const description = document.getElementById("description");
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
  const descriptionText = description.value.trim();

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
    description,
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