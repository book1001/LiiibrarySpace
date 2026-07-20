// ======================================================
// Config
// ======================================================
const floor = document.querySelector("#floor"); // #room이면 "#room"으로 변경
// const libraryHeader = document.querySelector("#libraryHeader");
const MAX_LENGTH = 30;
const MIN_LINE_WIDTH = 100;

let topZIndex = 10;


// ======================================================
// PlayHTML: Shared Light
// ======================================================
  const presenceChannel =
    new BroadcastChannel(
      "page-presence"
    );

  function normalizePath(path) {
    if (!path || path === "/") {
      return "/";
    }

    return path.replace(/\/+$/, "");
  }

  const currentPath =
    normalizePath(
      window.location.pathname
    );

  function sendPresence() {
    const message = {
      type: "page-presence",
      path: currentPath,
      time: Date.now()
    };

    presenceChannel.postMessage(
      message
    );

    console.log(
      "presence pulse:",
      message.path,
      message.time
    );
  }

  sendPresence();

  setInterval(
    sendPresence,
    4000
  );

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
// Mini Map
// ======================================================
const relocateBtn = document.getElementById("relocate");
const miniMap = document.getElementById("miniMap");
const miniMapFloor = document.getElementById("miniMapFloor");
const miniMapViewport = document.getElementById("miniMapViewport");
const miniMapItems = document.getElementById("miniMapItems");

let isMiniMapOpen = false;

function getFloorSize() {
  return {
    width: floor.offsetWidth,
    height: floor.offsetHeight,
  };
}

function getViewportSize() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/*
  Floor가 화면 밖으로 완전히 벗어나지 않도록 좌표를 제한합니다.

  Floor가 화면보다 클 경우:
  left는 0 ~ -(floorWidth - viewportWidth)
  top은 0 ~ -(floorHeight - viewportHeight)
*/
function clampFloorPosition(left, top) {
  const floorSize = getFloorSize();
  const viewportSize = getViewportSize();

  const minLeft = Math.min(0, viewportSize.width - floorSize.width);
  const minTop = Math.min(0, viewportSize.height - floorSize.height);

  return {
    left: Math.min(0, Math.max(minLeft, left)),
    top: Math.min(0, Math.max(minTop, top)),
  };
}

function setFloorPosition(left, top) {
  const position = clampFloorPosition(left, top);

  floor.style.left = `${position.left}px`;
  floor.style.top = `${position.top}px`;

  updateMiniMapViewport();
}

/*
  미니맵의 사각형 위치와 크기를 현재 Floor 좌표에 맞춰 업데이트합니다.
*/
function updateMiniMapViewport() {
  if (!isMiniMapOpen) return;

  const floorSize = getFloorSize();
  const viewportSize = getViewportSize();

  const mapWidth = miniMapFloor.clientWidth;
  const mapHeight = miniMapFloor.clientHeight;

  if (
    !floorSize.width ||
    !floorSize.height ||
    !mapWidth ||
    !mapHeight
  ) {
    return;
  }

  const floorLeft = parseFloat(getComputedStyle(floor).left) || 0;
  const floorTop = parseFloat(getComputedStyle(floor).top) || 0;

  const visibleX = Math.max(0, -floorLeft);
  const visibleY = Math.max(0, -floorTop);

  const viewportWidthOnMap = Math.min(
    mapWidth,
    (viewportSize.width / floorSize.width) * mapWidth
  );

  const viewportHeightOnMap = Math.min(
    mapHeight,
    (viewportSize.height / floorSize.height) * mapHeight
  );

  const viewportLeftOnMap =
    (visibleX / floorSize.width) * mapWidth;

  const viewportTopOnMap =
    (visibleY / floorSize.height) * mapHeight;

  miniMapViewport.style.width = `${viewportWidthOnMap}px`;
  miniMapViewport.style.height = `${viewportHeightOnMap}px`;

  miniMapViewport.style.left = `${Math.min(
    mapWidth - viewportWidthOnMap,
    viewportLeftOnMap
  )}px`;

  miniMapViewport.style.top = `${Math.min(
    mapHeight - viewportHeightOnMap,
    viewportTopOnMap
  )}px`;
}

/*
  Floor 내부의 .can-drag 요소를 미니맵에 작은 박스로 표시합니다.
*/
function updateMiniMapItems() {
  if (!isMiniMapOpen) return;

  const floorSize = getFloorSize();
  const mapWidth = miniMapFloor.clientWidth;
  const mapHeight = miniMapFloor.clientHeight;

  if (!floorSize.width || !floorSize.height) return;

  miniMapItems.innerHTML = "";

  floor.querySelectorAll(":scope > .can-drag").forEach((item) => {
    const marker = document.createElement("div");
    marker.className = "miniMap-item";

    const itemLeft = parseFloat(getComputedStyle(item).left) || 0;
    const itemTop = parseFloat(getComputedStyle(item).top) || 0;

    const markerLeft =
      (itemLeft / floorSize.width) * mapWidth;

    const markerTop =
      (itemTop / floorSize.height) * mapHeight;

    const markerWidth = Math.max(
      2,
      (item.offsetWidth / floorSize.width) * mapWidth
    );

    const markerHeight = Math.max(
      2,
      (item.offsetHeight / floorSize.height) * mapHeight
    );

    marker.style.left = `${markerLeft}px`;
    marker.style.top = `${markerTop}px`;
    marker.style.width = `${markerWidth}px`;
    marker.style.height = `${markerHeight}px`;

    miniMapItems.appendChild(marker);
  });
}

/*
  미니맵의 좌표를 실제 Floor 좌표로 변환합니다.
*/
function moveFloorFromMiniMap(viewportLeft, viewportTop) {
  const floorSize = getFloorSize();

  const mapWidth = miniMapFloor.clientWidth;
  const mapHeight = miniMapFloor.clientHeight;

  const viewportRectWidth = miniMapViewport.offsetWidth;
  const viewportRectHeight = miniMapViewport.offsetHeight;

  const maxViewportLeft = Math.max(
    0,
    mapWidth - viewportRectWidth
  );

  const maxViewportTop = Math.max(
    0,
    mapHeight - viewportRectHeight
  );

  const clampedLeft = Math.min(
    maxViewportLeft,
    Math.max(0, viewportLeft)
  );

  const clampedTop = Math.min(
    maxViewportTop,
    Math.max(0, viewportTop)
  );

  /*
    미니맵에서 사각형이 이동 가능한 비율과
    실제 Floor에서 화면이 이동 가능한 비율을 맞춥니다.
  */
  const floorScrollableWidth = Math.max(
    0,
    floorSize.width - window.innerWidth
  );

  const floorScrollableHeight = Math.max(
    0,
    floorSize.height - window.innerHeight
  );

  const xRatio =
    maxViewportLeft === 0
      ? 0
      : clampedLeft / maxViewportLeft;

  const yRatio =
    maxViewportTop === 0
      ? 0
      : clampedTop / maxViewportTop;

  setFloorPosition(
    -floorScrollableWidth * xRatio,
    -floorScrollableHeight * yRatio
  );
}

// ======================================================
// Mini Map: Relocate Btn
// ======================================================
relocateBtn.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  isMiniMapOpen = !isMiniMapOpen;

  miniMap.classList.toggle("is-hidden", !isMiniMapOpen);

  relocateBtn.textContent = isMiniMapOpen
    ? "close"
    : "explore";

  if (isMiniMapOpen) {
    requestAnimationFrame(() => {
      updateMiniMapItems();
      updateMiniMapViewport();
    });
  }
});


// ======================================================
// Mini Map: 뷰포트 사각형 드래그
// ======================================================
miniMapViewport.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();

  const startX = e.clientX;
  const startY = e.clientY;

  const startLeft =
    parseFloat(getComputedStyle(miniMapViewport).left) || 0;

  const startTop =
    parseFloat(getComputedStyle(miniMapViewport).top) || 0;

  miniMapViewport.setPointerCapture(e.pointerId);

  function move(e) {
    const nextLeft = startLeft + e.clientX - startX;
    const nextTop = startTop + e.clientY - startY;

    moveFloorFromMiniMap(nextLeft, nextTop);
  }

  function stop(e) {
    try {
      miniMapViewport.releasePointerCapture(e.pointerId);
    } catch {}

    miniMapViewport.removeEventListener("pointermove", move);
    miniMapViewport.removeEventListener("pointerup", stop);
    miniMapViewport.removeEventListener("pointercancel", stop);
  }

  miniMapViewport.addEventListener("pointermove", move);
  miniMapViewport.addEventListener("pointerup", stop);
  miniMapViewport.addEventListener("pointercancel", stop);
});


// ======================================================
// Mini Map: 미니맵 빈 공간 클릭으로 바로 이동
// ======================================================
miniMapFloor.addEventListener("pointerdown", (e) => {
  if (e.target === miniMapViewport) return;

  e.preventDefault();
  e.stopPropagation();

  const mapRect = miniMapFloor.getBoundingClientRect();

  const clickedX = e.clientX - mapRect.left;
  const clickedY = e.clientY - mapRect.top;

  const nextLeft =
    clickedX - miniMapViewport.offsetWidth / 2;

  const nextTop =
    clickedY - miniMapViewport.offsetHeight / 2;

  moveFloorFromMiniMap(nextLeft, nextTop);
});


// ======================================================
// Floor drag
// ======================================================
function initFloorDrag() {
  floor.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".can-drag")) return;

    if (
      e.target.closest("#miniMap") ||
      e.target.closest("#relocate")
    ) {
      return;
    }

    e.preventDefault();
    document.activeElement?.blur();

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = parseFloat(getComputedStyle(floor).left) || 0;
    const startTop = parseFloat(getComputedStyle(floor).top) || 0;

    floor.setPointerCapture(e.pointerId);
    floor.style.cursor = "grabbing";

    function move(e) {
      const nextLeft = startLeft + e.clientX - startX;
      const nextTop = startTop + e.clientY - startY;

      setFloorPosition(nextLeft, nextTop);
    }

    function stop(e) {
      try {
        floor.releasePointerCapture(e.pointerId);
      } catch {}

      floor.style.cursor = "move";

      floor.removeEventListener("pointermove", move);
      floor.removeEventListener("pointerup", stop);
      floor.removeEventListener("pointercancel", stop);

      updateMiniMapViewport();
    }

    floor.addEventListener("pointermove", move);
    floor.addEventListener("pointerup", stop);
    floor.addEventListener("pointercancel", stop);
  });
}

// ======================================================
// Toolbox: Fetch
// ======================================================
function createToolElement(type, id) {
  const el = document.createElement("div");
  el.id = id;
  el.className = "can-drag";
  el.setAttribute("can-mirror", "");
  el.tabIndex = 0;

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

  requestAnimationFrame(() => {
    const floorLeft = parseFloat(getComputedStyle(floor).left) || 0;
    const floorTop = parseFloat(getComputedStyle(floor).top) || 0;

    // 현재 화면 중앙을 Floor 좌표로 변환
    const centerX = -floorLeft + window.innerWidth / 2;
    const centerY = -floorTop + window.innerHeight / 2;

    // 요소 자체도 중앙 정렬
    el.style.left = `${centerX - el.offsetWidth / 2}px`;
    el.style.top = `${centerY - el.offsetHeight / 2}px`;
  });

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

      if (type === "radio") {
        updateRadioDisplays();
      }
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

}


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

  const isRadioTool = el.id.startsWith("radio_");
  const toolId = el.id.replace(/_on$/, "");


  try {
    const res = await fetch(
      `/libraries/${encodeURIComponent(
        CURRENT_LIBRARY
      )}/tools/${encodeURIComponent(toolId)}`,
      {
        method: "DELETE"
      }
    );

    if (!res.ok) {
      throw new Error(
        `Delete failed: ${res.status}`
      );
    }

    const result = await res.json();

    if (!result.success) {
      throw new Error(
        result.message || "Failed to remove tool"
      );
    }

    if (isRadioTool) {
      stopRadio();
    }
    
    /*
      cleanup 전에 원래 element와
      내부 can-mirror ID를 저장합니다.
    */
    const ids = getPlayhtmlIds(el);

    el.remove();

    requestAnimationFrame(() => {
      setTimeout(() => {
        cleanupPlayhtmlDataByIds(ids);
      }, 50);
    });
  } catch (error) {
    console.error(
      "Failed to remove tool:",
      error
    );

    alert(
      error.message ||
      "Failed to remove tool"
    );
  }
});


function getPlayhtmlIds(el) {
  return [
    el,
    ...el.querySelectorAll("[can-mirror]")
  ]
    .map(node => node.id)
    .filter(Boolean)
    .flatMap(id => {
      const baseId = id.replace(/_on$/, "");

      return id === baseId
        ? [id]
        : [id, baseId];
    });
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
    url: "https://ice7.securenetsystems.net/KCSM2"
  },
  {
    name: "Dance",
    url: "https://myhouseradiofm.out.airtime.pro:8000/myhouseradiofm_a"
  },
  {
    name: "Jukebox",
    url: "https://eagle.streemlion.com/proxy/psychedelicj?mp=/stream"
  }
];

const radioAudio = new Audio();
radioAudio.preload = "none";

let currentRadioIndex = 0;
let isRadioPlaying = false;
let currentRadioName = "";
let radioRequestId = 0;

function updateRadioDisplays() {
  const text =
    isRadioPlaying && currentRadioName
      ? currentRadioName
      : "";

  document.documentElement.style.setProperty(
    "--radio-display-text",
    JSON.stringify(text)
  );
}



async function playRadio(index) {
  if (!radioStations.length) return;

  const safeIndex =
    ((index % radioStations.length) +
      radioStations.length) %
    radioStations.length;

  const station = radioStations[safeIndex];
  if (!station?.url) return;

  const requestId = ++radioRequestId;

  radioAudio.pause();
  radioAudio.src = station.url;
  radioAudio.load();

  currentRadioIndex = safeIndex;
  currentRadioName = station.name;
  isRadioPlaying = true;

  document.body.classList.add(
    "is-radio-playing"
  );

  updateRadioDisplays();

  try {
    await radioAudio.play();

    if (requestId !== radioRequestId) {
      return;
    }
  } catch (error) {
    if (requestId !== radioRequestId) {
      return;
    }

    isRadioPlaying = false;
    currentRadioName = "";

    document.body.classList.remove(
      "is-radio-playing"
    );

    updateRadioDisplays();

    console.error(
      `Radio playback failed: ${station.name}`,
      error
    );
  }
}

function stopRadio() {
  radioRequestId += 1;
  radioAudio.pause();

  radioAudio.removeAttribute("src");
  radioAudio.load();

  isRadioPlaying = false;
  currentRadioName = "";

  document.body.classList.remove(
    "is-radio-playing"
  );

  updateRadioDisplays();
}

function playRandomRadio() {
  if (!radioStations.length) return;

  const randomIndex =
    Math.floor(
      Math.random() * radioStations.length
    );

  playRadio(randomIndex);
}


function playNextRadio() {
  if (!radioStations.length) return;

  const nextIndex =
    (currentRadioIndex + 1) %
    radioStations.length;

  playRadio(nextIndex);
}


// ======================================================
// Radio: On / Off
// ======================================================
document.addEventListener("pointerdown", (e) => {
  const radioSwitch =
    e.target.closest(".radioSwitch");

  if (!radioSwitch) return;

  e.preventDefault();
  e.stopPropagation();

  const item =
    radioSwitch.closest(".can-drag");

  if (item) {
    item.focus({
      preventScroll: true
    });
  }

  if (isRadioPlaying) {
    stopRadio();
  } else {
    playRandomRadio();
  }
}, true);


// ======================================================
// Radio: Next station
// ======================================================
document.addEventListener("pointerdown", (e) => {
  const radioNext =
    e.target.closest(".radioNext");

  if (!radioNext) return;

  e.preventDefault();
  e.stopPropagation();

  const item =
    radioNext.closest(".can-drag");

  if (item) {
    item.focus({
      preventScroll: true
    });
  }

  playNextRadio();
}, true);


radioAudio.addEventListener("error", () => {
  isRadioPlaying = false;
  currentRadioName = "";

  document.body.classList.remove(
    "is-radio-playing"
  );

  updateRadioDisplays();

  console.error(
    "The selected radio stream could not be loaded."
  );
});


// ======================================================
// Item drag
// - 클릭하면 remove 토글
// - 드래그하면 remove 표시
// - 롱프레스하면 remove 표시
// ======================================================
document.addEventListener("pointerdown", (e) => {
  if (
    e.target.closest(".remove") ||
    e.target.closest("textarea") ||
    e.target.closest(".resize") ||
    e.target.closest(".radioSwitch") ||
    e.target.closest(".radioNext") ||
    e.target.closest(".borderSetting") ||
    e.target.closest("[contenteditable='true']")
  ) {
    return;
  }

  const item = e.target.closest(".can-drag");
  if (!item) return;


  const handle = item.querySelector(".drag-handle");

  if (
    handle &&
    !e.target.closest(".drag-handle")
  ) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  item.focus({
    preventScroll: true
  });

  const startX = e.clientX;
  const startY = e.clientY;

  const startLeft = parseFloat(getComputedStyle(item).left) || 0;
  const startTop = parseFloat(getComputedStyle(item).top) || 0;

  let moved = false;

  item.style.zIndex = ++topZIndex;
  document.body.classList.add("is-dragging");
  item.classList.add("is-dragging");

  try {
    item.setPointerCapture(e.pointerId);
  } catch {}

  function move(moveEvent) {
    const dx = moveEvent.clientX - startX;

    const dy = moveEvent.clientY - startY;

    if (
      Math.abs(dx) > 3 ||
      Math.abs(dy) > 3
    ) {
      moved = true;
    }

    item.style.left = `${startLeft + dx}px`;
    item.style.top = `${startTop + dy}px`;

    if (isMiniMapOpen) {
      updateMiniMapItems();
    }
  }


  function stop(stopEvent) {
    document.body.classList.remove("is-dragging");
    item.classList.remove("is-dragging");

    try {
      if (item.hasPointerCapture(stopEvent.pointerId)) {
        item.releasePointerCapture(stopEvent.pointerId);
      }
    } catch {}

    item.removeEventListener("pointermove", move);
    item.removeEventListener("pointerup", stop);
    item.removeEventListener("pointercancel", stop);

    item.focus({
      preventScroll: true
    });

    updateRadioDisplays();

    if (isMiniMapOpen && moved) {
      updateMiniMapItems();
    }
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

document.addEventListener("pointerdown", (e) => {
  const lightSwitch = e.target.closest(".lightSwitch");
  if (!lightSwitch) return;

  e.preventDefault();
  e.stopPropagation();

  const item = lightSwitch.closest(".can-drag");
  if (!item) return;

  item.focus({
    preventScroll: true
  });

  toggleLight(item);
}, true);

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
// Book List: 실시간 업데이트
// ======================================================
const bookUpdateChannel = new BroadcastChannel("book-updates");

let bookRefreshTimer = null;

function refreshBookList() {
  clearTimeout(bookRefreshTimer);

  bookRefreshTimer = setTimeout(async () => {
    try {
      if (typeof window.loadBooks === "function") {
        await window.loadBooks();
      } else {
        console.warn(
          "window.loadBooks가 설정되어 있지 않습니다."
        );
      }

      if (isMiniMapOpen) {
        requestAnimationFrame(() => {
          updateMiniMapItems();
          updateMiniMapViewport();
        });
      }
    } catch (error) {
      console.error(
        "Failed to refresh the book list:",
        error
      );
    }
  }, 50);
}

// 현재 페이지에서 책이 등록되거나 제거된 경우
window.addEventListener("book-updated", (e) => {
  const message = e.detail;

  if (
    !message ||
    message.type !== "book-updated"
  ) {
    return;
  }

  refreshBookList();
});

// 다른 탭 또는 팝업에서 책이 등록되거나 제거된 경우
bookUpdateChannel.addEventListener(
  "message",
  (e) => {
    const message = e.data;

    if (
      !message ||
      message.type !== "book-updated"
    ) {
      return;
    }

    refreshBookList();
  }
);

// window.open()으로 연결된 창에서 전달된 경우
window.addEventListener("message", (e) => {
  if (e.origin !== window.location.origin) {
    return;
  }

  const message = e.data;

  if (
    !message ||
    message.type !== "book-updated"
  ) {
    return;
  }

  refreshBookList();
});


// ======================================================
// Mini map: 화면 크기가 바뀔 때 업데이트
// ======================================================
window.addEventListener("resize", () => {
  const currentLeft =
    parseFloat(getComputedStyle(floor).left) || 0;

  const currentTop =
    parseFloat(getComputedStyle(floor).top) || 0;

  setFloorPosition(currentLeft, currentTop);

  if (isMiniMapOpen) {
    updateMiniMapItems();
    updateMiniMapViewport();
  }
});

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

// playhtml.init();

// playhtml.init({
//   cursors: {
//     enabled: true,
//   },
// });

playhtml.init({
  developmentMode: true
});

setInterval(window.loadLibraryTools, 1000);