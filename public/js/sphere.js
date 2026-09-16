// Evolve's half of the SPHERE connection — identical contract to Epic's
// sphere.js (same postMessage types, same widget URL shape), since the
// widget is vendor-agnostic by design. Only the origin differs.
import { state } from "./state.js";

const SPHERE_ORIGIN = "http://localhost:3000";
const EVOLVE_OWN_ORIGIN = "http://localhost:4002";

export function initSphere() {
  document.getElementById("connectSphereBtn").addEventListener("click", () => {
    document.getElementById("sphereModal").style.display = "flex";
  });

  document.getElementById("accessSphereBtn").addEventListener("click", () => {
    const frame = document.getElementById("sphereFrame");
    frame.src = `http://localhost:3000/widget.html?mrn=${encodeURIComponent(state.currentPatientRef)}&origin=${encodeURIComponent(EVOLVE_OWN_ORIGIN)}`;
    document.getElementById("sphereModal").style.display = "flex";
  });

  document.getElementById("closeSphereModalBtn").addEventListener("click", () => {
    document.getElementById("sphereModal").style.display = "none";
    // Reset to a neutral, no-patient URL on close — same fix as Epic's,
    // so reopening via the header badge doesn't show stale patient data.
    const frame = document.getElementById("sphereFrame");
    frame.src = `http://localhost:3000/widget.html?origin=${encodeURIComponent(EVOLVE_OWN_ORIGIN)}`;
  });

  document.getElementById("syncSphereBtn").addEventListener("click", () => {
    const frame = document.getElementById("sphereFrame");
    frame.contentWindow.postMessage(
      { type: "sphere-sync", mrn: state.currentPatientRef },
      SPHERE_ORIGIN
    );
  });

  window.addEventListener("message", (event) => {
    if (event.origin !== SPHERE_ORIGIN) return;

    if (event.data?.type === "sphere-connected") {
      document.getElementById("sphereModal").style.display = "none";
      setConnected();
    }

    if (event.data?.type === "sphere-sync-result") {
      showToast(event.data.success, event.data.message);
    }
  });
}

function showToast(success, message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${success ? "success" : "error"}`;
  toast.style.display = "block";

  setTimeout(() => {
    toast.style.display = "none";
  }, 4000);
}

function setConnected() {
  const btn = document.getElementById("connectSphereBtn");
  btn.textContent = "SPHERE: Connected";
}

export function disconnectSphere() {
  const frame = document.getElementById("sphereFrame");
  frame.contentWindow.postMessage({ type: "sphere-logout" }, SPHERE_ORIGIN);

  const btn = document.getElementById("connectSphereBtn");
  btn.textContent = "SPHERE: Not Connected";
}
