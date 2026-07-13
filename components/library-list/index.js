const libraryList = document.getElementById("libraryList");
const libraryStreet = document.getElementById("libraryStreet");

async function loadLibraries() {
  const res = await fetch("/libraries");
  const libraries = await res.json();

  libraryStreet.innerHTML = "";
  libraryList.innerHTML = '<option value="">Open Library...</option>';

  [...libraries].reverse().forEach(library => {

    // ---------- Street ----------
    const container = document.createElement("div");
    container.className = "library";

    const house = document.createElement("pre");
    house.className = "library-house";
    house.textContent = library.house || "";
    // house.style.color = library.color || "inherit";

    const color = library.color || "inherit";
    house.style.color = color;
    if (library.color && getColorBrightness(library.color) >= 200) {
      house.style.textShadow = "1px 0px gray";
    }

    const name = document.createElement("h5");
    name.className = "library-name";
    name.textContent = library.libraryName;

    const link = document.createElement("a");
    link.href = `/${library.libraryName}/`;
    link.className = "library-link";

    link.addEventListener("click", (e) => {
      e.preventDefault();

      openLibrary(library.libraryName);
    });

    link.appendChild(house);
    link.appendChild(name);
    container.appendChild(link);

    libraryStreet.appendChild(container);

    // ---------- Dropdown ----------
    const option = document.createElement("option");
    option.value = library.libraryName;
    option.textContent = library.libraryName;

    libraryList.appendChild(option);
  });
}

function openLibrary(libraryName) {
  window.open(
    `/${libraryName}/`,
    libraryName,
    "width=1280,height=900,left=200,top=100,resizable=yes,scrollbars=yes"
  );
}

libraryList.addEventListener("change", () => {
  if (!libraryList.value) return;

  openLibrary(libraryList.value);

  // 다시 placeholder로 돌아가게 하고 싶으면
  libraryList.selectedIndex = 0;
});

loadLibraries();


// ===============================================
// Color
// ===============================================
function getColorBrightness(hex) {
  if (!hex) return 0;

  const normalizedHex = hex.replace("#", "");

  const r = parseInt(normalizedHex.slice(0, 2), 16);
  const g = parseInt(normalizedHex.slice(2, 4), 16);
  const b = parseInt(normalizedHex.slice(4, 6), 16);

  return (r * 299 + g * 587 + b * 114) / 1000;
}
// const libraryList = document.getElementById("libraryList");

// async function loadLibraries() {
//   const res = await fetch("/libraries");
//   const libraries = await res.json();

//   libraries.forEach(library => {
//     const link = document.createElement("a");

//     link.textContent = library.libraryName;
//     link.href = `/${library.libraryName}/`;
//     link.className = "library-link";

//     link.addEventListener("click", (e) => {
//       e.preventDefault();

//       window.open(
//         `/${library.libraryName}/`,
//         library.libraryName,
//         "width=1280,height=900,left=200,top=100,resizable=yes,scrollbars=yes"
//       );
//     });

//     libraryList.appendChild(link);
//   });
// }

// loadLibraries();