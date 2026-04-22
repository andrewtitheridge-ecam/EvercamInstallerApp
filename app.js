const STORAGE_KEY = "evercam-saved-camera-ids";
const MAX_SAVED = 8;

const form = document.getElementById("snapshot-form");
const cameraInput = document.getElementById("camera-id");
const savedCameras = document.getElementById("saved-cameras");
const clearHistoryButton = document.getElementById("clear-history");
const refreshButton = document.getElementById("refresh-button");
const statusText = document.getElementById("status");
const currentCameraText = document.getElementById("current-camera");
const snapshotImage = document.getElementById("snapshot-image");
const snapshotPlaceholder = document.getElementById("snapshot-placeholder");

let currentCameraId = "";

function getSavedCameraIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function setSavedCameraIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

function rememberCameraId(cameraId) {
  const normalized = cameraId.trim();
  if (!normalized) return;

  const next = [normalized, ...getSavedCameraIds().filter((id) => id !== normalized)].slice(0, MAX_SAVED);
  setSavedCameraIds(next);
  renderSavedCameraIds();
}

function removeCameraId(cameraId) {
  const next = getSavedCameraIds().filter((id) => id !== cameraId);
  setSavedCameraIds(next);
  renderSavedCameraIds();
}

function renderSavedCameraIds() {
  const ids = getSavedCameraIds();
  savedCameras.innerHTML = "";
  clearHistoryButton.disabled = ids.length === 0;

  if (ids.length === 0) {
    const empty = document.createElement("p");
    empty.className = "helper-text";
    empty.textContent = "No saved camera IDs yet.";
    savedCameras.appendChild(empty);
    return;
  }

  ids.forEach((cameraId) => {
    const chip = document.createElement("div");
    chip.className = "saved-camera";

    const loadButton = document.createElement("button");
    loadButton.type = "button";
    loadButton.className = "saved-camera-load";
    loadButton.textContent = cameraId;
    loadButton.addEventListener("click", () => {
      cameraInput.value = cameraId;
      loadSnapshot(cameraId);
    });

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "saved-camera-remove";
    removeButton.textContent = "x";
    removeButton.setAttribute("aria-label", `Remove ${cameraId}`);
    removeButton.addEventListener("click", () => removeCameraId(cameraId));

    chip.append(loadButton, removeButton);
    savedCameras.appendChild(chip);
  });
}

function setStatus(message, tone = "") {
  statusText.textContent = message;
  statusText.className = `status${tone ? ` ${tone}` : ""}`;
}

function buildSnapshotUrl(cameraId) {
  const encodedId = encodeURIComponent(cameraId);
  return `https://media.evercam.io/v2/cameras/${encodedId}/live/snapshot?t=${Date.now()}`;
}

function loadSnapshot(cameraId) {
  const normalized = cameraId.trim();
  if (!normalized) {
    setStatus("Enter a camera ID first.", "error");
    return;
  }

  currentCameraId = normalized;
  cameraInput.value = normalized;
  refreshButton.disabled = false;
  currentCameraText.textContent = `Current camera: ${normalized}`;
  setStatus("Loading snapshot...", "");
  rememberCameraId(normalized);

  snapshotImage.hidden = true;
  snapshotPlaceholder.hidden = false;
  snapshotPlaceholder.textContent = "Loading latest snapshot...";

  const nextUrl = buildSnapshotUrl(normalized);
  snapshotImage.onload = () => {
    setStatus("Snapshot loaded.", "success");
    snapshotImage.hidden = false;
    snapshotPlaceholder.hidden = true;
    snapshotImage.alt = `Live snapshot for ${normalized}`;
  };

  snapshotImage.onerror = () => {
    setStatus("Could not load that camera. It may be private, unavailable, or the ID may be incorrect.", "error");
    snapshotImage.hidden = true;
    snapshotPlaceholder.hidden = false;
    snapshotPlaceholder.textContent = "Snapshot unavailable for this camera ID.";
  };

  snapshotImage.src = nextUrl;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  loadSnapshot(cameraInput.value);
});

refreshButton.addEventListener("click", () => {
  if (currentCameraId) {
    loadSnapshot(currentCameraId);
  }
});

clearHistoryButton.addEventListener("click", () => {
  setSavedCameraIds([]);
  renderSavedCameraIds();
});

renderSavedCameraIds();
