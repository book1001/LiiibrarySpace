const form = document.getElementById("libraryForm");
const nameStatus = document.getElementById("nameStatus");
const colorPicker = document.getElementById("colorPicker");
const colorHex = document.getElementById("colorHex");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const libraryNamePattern = /^(?![._-])(?!.*[._-]{2})[A-Za-z0-9._-]+(?<![._-])$/;

let nameAvailable = false;

// ===============================================
const houseTextarea = document.getElementById("houseTextarea");
const houseRadios = document.querySelectorAll('input[name="houseExample"]');

const houseExamples = [
`   /\\
  /  \\
 /____\\
 | [] |
 |____|`,

`    ____
   /    \\
  /______\\
  |  __  |
  | |  | |
  |_|__|_|`,

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

colorPicker.addEventListener("input", () => {
  colorHex.value = colorPicker.value;
  checkForm();
});

colorHex.addEventListener("input", () => {
  if (/^#[0-9A-Fa-f]{6}$/.test(colorHex.value)) {
    colorPicker.value = colorHex.value;
  }
  checkForm();
});

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
    colorPicker.value = "#d35838";
    colorHex.value = "#d35838";
    nameAvailable = false;
    nameStatus.textContent = "";
    submitBtn.disabled = true;
  } else {
    alert(result.message);
  }
});