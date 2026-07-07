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