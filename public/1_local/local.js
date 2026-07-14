// ======================================================
// Config
// ======================================================
const floor = document.querySelector("#floor"); // #room이면 "#room"으로 변경
const libraryHeader = document.querySelector("#libraryHeader");
const MAX_LENGTH = 30;
const MIN_LINE_WIDTH = 100;

let topZIndex = 10;

// ======================================================
// libraryHeader: max length
// ======================================================
libraryHeader.addEventListener("beforeinput", (e) => {
  if (e.inputType.startsWith("delete")) return;

  const selection = window.getSelection();
  const selectedLength = selection?.toString().length || 0;
  const currentLength = libraryHeader.textContent.length;

  if (currentLength - selectedLength >= MAX_LENGTH) {
    e.preventDefault();
  }
});

// ======================================================
// Floor drag
// ======================================================
function initFloorDrag() {
  floor.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".can-drag")) return;

    e.preventDefault();
    document.activeElement?.blur();

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = parseFloat(getComputedStyle(floor).left) || 0;
    const startTop = parseFloat(getComputedStyle(floor).top) || 0;

    floor.setPointerCapture(e.pointerId);
    floor.style.cursor = "grabbing";

    function move(e) {
      floor.style.left = `${startLeft + e.clientX - startX}px`;
      floor.style.top = `${startTop + e.clientY - startY}px`;
    }

    function stop(e) {
      try {
        floor.releasePointerCapture(e.pointerId);
      } catch {}

      floor.style.cursor = "move";

      floor.removeEventListener("pointermove", move);
      floor.removeEventListener("pointerup", stop);
      floor.removeEventListener("pointercancel", stop);
    }

    floor.addEventListener("pointermove", move);
    floor.addEventListener("pointerup", stop);
    floor.addEventListener("pointercancel", stop);
  });
}

// ======================================================
// Addbook
// ======================================================
// const addBookBtn = document.getElementById("addbook");
// const submitField = document.getElementById("addbook-submitField");

// addBookBtn.addEventListener("click", () => {
//   submitField.classList.toggle("is-close");
//   addBookBtn.textContent = "add";
//   // addBookBtn.color = "white";
// });

const addBookBtn = document.getElementById("addbook");
const submitField = document.getElementById("addbook-submitField");

addBookBtn.addEventListener("click", () => {
  const isClosed = submitField.classList.toggle("is-close");

  if (isClosed) {
    addBookBtn.textContent = "add";
  } else {
    addBookBtn.textContent = "close";
  }
});


// ======================================================
// Toolbox: Fetch
// ======================================================
function createToolElement(type, id) {
  const el = document.createElement("div");
  el.id = id;
  el.className = "can-drag";
  el.setAttribute("can-mirror", "");

  if (type === "note") {
    const number = id.replace("note_", "");

    el.innerHTML = `
      <div class="drag-handle"></div>
      <button class="borderSetting">Border On</button>
      <button class="remove">
        <span class="material-symbols-outlined">close</span>
      </button>
      <textarea id="noteContent_${number}" class="note" can-mirror></textarea>
    `;
  }

  if (type === "lineH") {
    el.innerHTML = `
      <button class="remove">
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="resize"></div>
    `;
  }

  if (type === "lineV") {
    el.innerHTML = `
      <button class="remove">
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="resize"></div>
    `;
  }

  if (type === "light") {
    el.innerHTML = `
      <button class="remove">
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="lightSwitch"></div>
    `;
  }

  if (type === "radio") {
    el.innerHTML = `
      <button class="remove">
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="radioSwitch"></div>
      <div class="radioNext"></div>
      <div class="radioDisplay"></div>
    `;
  }

  return el;
}

async function loadLibraryTools() {
  const res = await fetch(`/libraries/${encodeURIComponent(CURRENT_LIBRARY)}`);
  const library = await res.json();

  const toolTypes = ["note", "lineH", "lineV", "light", "radio"];

  const idsFromJson = new Set();

  toolTypes.forEach(type => {
    if (!Array.isArray(library[type])) return;

    library[type].forEach(id => {
      idsFromJson.add(id);

      // if (document.getElementById(id)) return;
      const exists = [...document.querySelectorAll("#floor > .can-drag")]
        .some(el => el.id.replace(/_on$/, "") === id);

      if (exists) return;

      const el = createToolElement(type, id);

      const itemImages = document.getElementById("itemImages");
      floor.insertBefore(el, itemImages);
      window.setupPlayhtmlElement?.(el);
      // initMirrorForNewElement(el);
    });
  });

  document.querySelectorAll("#floor > .can-drag").forEach(el => {
    const id = el.id.replace(/_on$/, "");

    if (!idsFromJson.has(id)) {
      cleanupPlayhtmlData(el);
      el.remove();
    }
  });

  // document.querySelectorAll("#floor > .can-drag").forEach(el => {
  //   if (!idsFromJson.has(el.id)) {
  //     el.remove();
  //   }
  // });
}

// loadLibraryTools();
// setInterval(loadLibraryTools, 1000);

// ======================================================
// Toolbox: Add
// ======================================================
const toolbox = document.getElementById("toolbox");

toolbox.querySelectorAll("button[data-tool]").forEach(button => {
  button.addEventListener("click", async () => {
    const type = button.dataset.tool;

    const res = await fetch(
      `/libraries/${encodeURIComponent(CURRENT_LIBRARY)}/tools`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json;charset=UTF-8"
        },
        body: JSON.stringify({ type })
      }
    );

    const result = await res.json();

    if (result.success) {
      await loadLibraryTools();
    } else {
      alert(result.message);
    }
  });
});

// ======================================================
// Toolbox: can-mirror 동기화
// ======================================================
function initMirrorForNewElement(el) {
  el.querySelectorAll("[can-mirror]").forEach(node => {
    node.dispatchEvent(new Event("input", { bubbles: true }));
    node.dispatchEvent(new Event("change", { bubbles: true }));
  });
}


// ======================================================
// Remove
// ======================================================
document.addEventListener("click", async (e) => {
  const removeBtn = e.target.closest(".remove");
  if (!removeBtn) return;

  e.preventDefault();
  e.stopPropagation();

  const el = removeBtn.closest(".can-drag");
  if (!el) return;

  const toolId = el.id;

  const res = await fetch(
    `/libraries/${encodeURIComponent(CURRENT_LIBRARY)}/tools/${encodeURIComponent(toolId)}`,
    {
      method: "DELETE"
    }
  );

  const result = await res.json();

  if (result.success) {
    const ids = getPlayhtmlIds(el);

    el.remove();

    requestAnimationFrame(() => {
      setTimeout(() => {
        cleanupPlayhtmlDataByIds(ids);
      }, 50);
    });
  } else {
    alert(result.message);
  }

  // if (result.success) {
  //   const removedEl = el;

  //   el.remove();

  //   setTimeout(() => {
  //     cleanupPlayhtmlData(removedEl);
  //   }, 0);
  // } else {
  //   alert(result.message);
  // }

});

function getPlayhtmlIds(el) {
  return [el, ...el.querySelectorAll("[can-mirror]")]
    .map(node => node.id)
    .filter(Boolean);
}

function cleanupPlayhtmlDataByIds(ids) {
  ids.forEach(id => {
    window.deletePlayhtmlElementData?.("can-mirror", id);
  });
}

function cleanupPlayhtmlData(el) {
  const elements = [
    el,
    ...el.querySelectorAll("*")
  ];

  elements.forEach(node => {
    const ids = [
      node.id
    ].filter(Boolean);

    ids.forEach(id => {
      window.deletePlayhtmlElementData?.("can-mirror", id);
    });
  });
}

// function cleanupPlayhtmlData(el) {
//   const elements = [
//     el,
//     ...el.querySelectorAll("[can-mirror], [can-move], [can-play]")
//   ];

//   elements.forEach(node => {
//     const elementId =
//       node.getAttribute("selector-id") ||
//       node.id;

//     if (!elementId) return;

//     window.deletePlayhtmlElementData?.("can-mirror", elementId);
//     window.deletePlayhtmlElementData?.("can-move", elementId);
//     window.deletePlayhtmlElementData?.("can-play", elementId);
//   });
// }
// document.addEventListener("click", (e) => {
//   const removeBtn = e.target.closest(".remove");
//   if (!removeBtn) return;

//   e.preventDefault();
//   e.stopPropagation();

//   removeBtn.closest(".can-drag")?.remove();
// });


// ======================================================
// Note: Border Setting Toggle
// ======================================================
document.querySelectorAll(".borderSetting").forEach(button => {
  const textarea = button.closest(".can-drag").querySelector("textarea");

  button.textContent = textarea.classList.contains("note")
    ? "Border On"
    : "Border Off";
});

document.addEventListener("click", (e) => {
  const button = e.target.closest(".borderSetting");
  if (!button) return;

  e.preventDefault();
  e.stopPropagation();

  const textarea = button.closest(".can-drag").querySelector("textarea");

  if (textarea.classList.contains("note")) {
    textarea.classList.replace("note", "note_borderless");
    button.textContent = "Border Off";
  } else {
    textarea.classList.replace("note_borderless", "note");
    button.textContent = "Border On";
  }
});


// ======================================================
// Line: Resize X,Y
// ======================================================
document.addEventListener("pointerdown", (e) => {
  const resizeHandle = e.target.closest(".resize");
  if (!resizeHandle) return;

  e.preventDefault();
  e.stopPropagation();

  const target = resizeHandle.closest(".can-drag");
  if (!target) return;

  const isHorizontalLine = target.id.startsWith("lineH_");
  const isVerticalLine = target.id.startsWith("lineV_");

  if (!isHorizontalLine && !isVerticalLine) return;

  const startX = e.clientX;
  const startY = e.clientY;
  const startWidth = target.offsetWidth;
  const startHeight = target.offsetHeight;

  document.body.classList.add("is-resizing");
  document.body.style.cursor = isHorizontalLine ? "ew-resize" : "ns-resize";

  resizeHandle.setPointerCapture(e.pointerId);

  function move(e) {
    if (isHorizontalLine) {
      const nextWidth = Math.max(100, startWidth + e.clientX - startX);
      target.style.width = `${nextWidth}px`;
    }

    if (isVerticalLine) {
      const nextHeight = Math.max(100, startHeight + e.clientY - startY);
      target.style.height = `${nextHeight}px`;
    }
  }

  function stop(e) {
    document.body.classList.remove("is-resizing");
    document.body.style.cursor = "";

    try {
      resizeHandle.releasePointerCapture(e.pointerId);
    } catch {}

    resizeHandle.removeEventListener("pointermove", move);
    resizeHandle.removeEventListener("pointerup", stop);
    resizeHandle.removeEventListener("pointercancel", stop);
  }

  resizeHandle.addEventListener("pointermove", move);
  resizeHandle.addEventListener("pointerup", stop);
  resizeHandle.addEventListener("pointercancel", stop);
}, true);


// ======================================================
// Radio
// ======================================================
const radioStations = [
  {
    name: "Jazz",
    url: "https://ice7.securenetsystems.net/KCSM2",
  },
  {
    name: "Dance",
    url: "https://myhouseradiofm.out.airtime.pro:8000/myhouseradiofm_a",
  },
  {
    name: "Jukebox",
    url: "https://eagle.streemlion.com/proxy/psychedelicj?mp=/stream",
  },
];

const radioAudio = new Audio();
radioAudio.preload = "none";

let currentRadioIndex = 0;
let isRadioPlaying = false;
let currentRadioName = "";

function updateRadioDisplays() {
  document.querySelectorAll(".radioDisplay").forEach(display => {
    display.textContent = isRadioPlaying ? currentRadioName : "";
  });
}

function playRadio(index) {
  currentRadioIndex = index;
  currentRadioName = radioStations[index].name;

  radioAudio.src = radioStations[index].url;
  radioAudio.play();

  isRadioPlaying = true;

  updateRadioDisplays();

  document.body.classList.add("is-radio-playing");
}

function stopRadio() {
  radioAudio.pause();
  radioAudio.src = "";

  isRadioPlaying = false;
  currentRadioName = "";

  updateRadioDisplays();

  document.body.classList.remove("is-radio-playing");
}

function playRandomRadio() {
  const randomIndex = Math.floor(Math.random() * radioStations.length);
  playRadio(randomIndex);
}

function playNextRadio() {
  const nextIndex = (currentRadioIndex + 1) % radioStations.length;
  playRadio(nextIndex);
}

document.addEventListener("pointerdown", (e) => {
  const radioSwitch = e.target.closest(".radioSwitch");
  if (!radioSwitch) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  if (isRadioPlaying) {
    stopRadio();
  } else {
    playRandomRadio();
  }
}, true);

document.addEventListener("pointerdown", (e) => {
  const radioNext = e.target.closest(".radioNext");
  if (!radioNext) return;

  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  playNextRadio();
}, true);


// ======================================================
// Item drag
// - .drag-handle 있으면 그것만 드래그 핸들
// - 없으면 .can-drag 전체가 드래그 영역
// ======================================================
document.addEventListener("pointerdown", (e) => {
  if (
    e.target.closest(".remove") ||
    e.target.closest("textarea") ||
    e.target.closest(".resize") ||
    e.target.closest(".radioSwitch") ||
    e.target.closest(".radioNext") ||
    e.target.closest("[contenteditable='true']")
  ) {
    return;
  }

  const item = e.target.closest(".can-drag");
  if (!item) return;

  const handle = item.querySelector(".drag-handle");

  if (handle && !e.target.closest(".drag-handle")) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  const clickedSwitch = e.target.closest(".lightSwitch");

  let moved = false;

  const startX = e.clientX;
  const startY = e.clientY;
  const startLeft = parseFloat(getComputedStyle(item).left) || 0;
  const startTop = parseFloat(getComputedStyle(item).top) || 0;

  item.style.zIndex = ++topZIndex;
  document.body.classList.add("is-dragging");

  item.setPointerCapture(e.pointerId);

  function move(e) {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      moved = true;
    }

    item.style.left = `${startLeft + dx}px`;
    item.style.top = `${startTop + dy}px`;
  }

  function stop(e) {
    document.body.classList.remove("is-dragging");

    try {
      item.releasePointerCapture(e.pointerId);
    } catch {}

    item.removeEventListener("pointermove", move);
    item.removeEventListener("pointerup", stop);
    item.removeEventListener("pointercancel", stop);

    if (!moved && clickedSwitch) {
      toggleLight(item);
    }
    updateRadioDisplays();  
  }

  item.addEventListener("pointermove", move);
  item.addEventListener("pointerup", stop);
  item.addEventListener("pointercancel", stop);
}, true);

// ======================================================
// Light toggle
// light_1 -> light_1_on
// light_1_on -> light_1
// light_2, light_3... 도 대응
// ======================================================
function toggleLight(item) {
  if (!item.id.startsWith("light_")) return;

  item.id = item.id.endsWith("_on")
    ? item.id.replace("_on", "")
    : `${item.id}_on`;
}

// ======================================================
// Note width sync
// note_0, note_1, note_2... 대응
// ======================================================
function syncNoteWidth(item) {
  const content = item.querySelector(".note, .note_borderless");
  if (!content) return;

  const update = () => {
    item.style.width = `${content.offsetWidth}px`;
  };

  update();

  const observer = new ResizeObserver(update);
  observer.observe(content);
}

document.querySelectorAll(".can-drag").forEach(syncNoteWidth);

// 나중에 note_, line_, light_ 요소가 추가되어도 자동 대응
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;

      if (node.matches(".can-drag")) {
        syncNoteWidth(node);
      }

      node.querySelectorAll?.(".can-drag").forEach(syncNoteWidth);
    });
  });
});

observer.observe(floor, {
  childList: true,
  subtree: true,
});

initFloorDrag();


// ======================================================
// can-mirror 동기화 수정
// ======================================================
window.loadLibraryTools = loadLibraryTools;


// ======================================================
// playHTML
// ======================================================
import { playhtml } from "https://unpkg.com/playhtml";

window.setupPlayhtmlElement = function (el) {
  if (!el) return;
  playhtml.setupPlayElement(el);
  el.querySelectorAll("[can-mirror]").forEach(child => {
    playhtml.setupPlayElement(child);
  });
};

window.deletePlayhtmlElementData = function (type, id) {
  playhtml.deleteElementData(type, id);
};

await window.loadLibraryTools();

playhtml.init();

// playhtml.init({
//   developmentMode: true
// });

setInterval(window.loadLibraryTools, 1000);