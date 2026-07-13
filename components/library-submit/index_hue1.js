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


window.setHouseExample = function(index) {
  houseTextarea.textContent = houseExamples[index];
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
// Hue Color Picker
// ===============================================

const FIXED_SATURATION = 70;
const FIXED_LIGHTNESS = 55;
const DEFAULT_HUE = 12;

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;

  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x =
    chroma * (1 - Math.abs((h / 60) % 2 - 1));

  const m = l - chroma / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = chroma;
    g = x;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = chroma;
  } else if (h >= 120 && h < 180) {
    g = chroma;
    b = x;
  } else if (h >= 180 && h < 240) {
    g = x;
    b = chroma;
  } else if (h >= 240 && h < 300) {
    r = x;
    b = chroma;
  } else {
    r = chroma;
    b = x;
  }

  function toHex(value) {
    return Math.round((value + m) * 255)
      .toString(16)
      .padStart(2, "0");
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function updateHouseColor(color) {
  houseTextarea.style.color = color;
}

function updateColorFromHue() {
  const hue = Number(colorPicker.value);

  const hexColor = hslToHex(
    hue,
    FIXED_SATURATION,
    FIXED_LIGHTNESS
  );

  colorHex.value = hexColor;
  updateHouseColor(hexColor);

  checkForm();
}

colorPicker.addEventListener("input", updateColorFromHue);


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

colorPicker.value = DEFAULT_HUE;
updateColorFromHue();

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
      "영문, 숫자, -, _, . 만 사용할 수 있습니다.";
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
  const house = houseTextarea.textContent;

  if (!libraryName) {
    alert("도서관 이름을 입력해주세요.");
    return;
  }

  if (!libraryNamePattern.test(libraryName)) {
    alert("도서관 이름은 영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.");
    return;
  }

  if (!password) {
    alert("Enter the password");
    return;
  }

  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    alert("올바른 색상을 입력해주세요.");
    return;
  }

  if (!bookSharing) {
    alert("책 공유 방식을 선택해주세요.");
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

    colorPicker.value = DEFAULT_HUE;
    updateColorFromHue();

    const newRandomIndex = Math.floor(
      Math.random() * houseExamples.length
    );

    if (houseRadios[newRandomIndex]) {
      houseRadios[newRandomIndex].checked = true;
      window.setHouseExample(newRandomIndex);
    }
    
    // const defaultColor = "#d35838";
    // colorPicker.value = defaultColor;
    // colorHex.value = defaultColor;
    // updateHouseColor(defaultColor);

    nameAvailable = false;
    nameStatus.textContent = "";
    submitBtn.disabled = true;
  } else {
    alert(result.message);
  }
});