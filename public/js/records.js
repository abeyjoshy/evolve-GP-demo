import { API } from "./api.js";
import { state } from "./state.js";
import { showPatient } from "./patients.js";

// One consultation = one condition (the "visit label") + a clinical note,
// plus zero or more prescriptions issued for it — same shape as Epic's
// visit/diagnosis/medications flow. The condition is saved first so its id
// exists to link each prescription to.
export function initRecords() {
  document.getElementById("saveConsultationBtn").addEventListener("click", saveConsultation);

  document.getElementById("addRxRowBtn").addEventListener("click", () => {
    document.getElementById("consultationRxRows").appendChild(createRxRow());
  });

  document.getElementById("openAddSensitivityBtn").addEventListener("click", () => {
    const form = document.getElementById("addSensitivityForm");
    form.style.display = form.style.display === "none" ? "flex" : "none";
  });

  document.getElementById("addSensitivityBtn").addEventListener("click", addSensitivity);
}

function createRxRow() {
  const row = document.createElement("div");
  row.className = "add-form rx-row";
  row.innerHTML = `
    <input type="text" class="rx-drug-name" placeholder="Drug name" />
    <input type="text" class="rx-instructions" placeholder="Instructions" />
    <button type="button" class="secondary remove-rx-row">&times;</button>
  `;
  row.querySelector(".remove-rx-row").addEventListener("click", () => row.remove());
  return row;
}

// Exported so patients.js can call it whenever a different patient's page
// opens, so leftover rows from a previous consultation don't carry over.
export function resetRxRows() {
  const container = document.getElementById("consultationRxRows");
  container.innerHTML = "";
  container.appendChild(createRxRow());
}

async function saveConsultation() {
  const condition = document.getElementById("consultationCondition").value;
  const comment = document.getElementById("consultationNote").value;

  if (!condition) return;

  const conditionRes = await fetch(`${API}/patients/${state.currentPatientRef}/conditions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ condition, comment }),
  });

  if (!conditionRes.ok) return;

  const conditionData = await conditionRes.json();
  const newCondition = conditionData.condition; // has .id, from addCondition's RETURNING *

  const rxRows = document.querySelectorAll("#consultationRxRows .rx-row");

  for (const row of rxRows) {
    const drugName = row.querySelector(".rx-drug-name").value;
    if (!drugName) continue; // an empty row is just skipped, not an error

    const instructions = row.querySelector(".rx-instructions").value;

    await fetch(`${API}/patients/${state.currentPatientRef}/prescriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        drugName,
        instructions,
        conditionId: newCondition.id,
      }),
    });
  }

  document.getElementById("consultationCondition").value = "";
  document.getElementById("consultationNote").value = "";
  resetRxRows();

  showPatient(state.currentPatientRef); // refresh so the new consultation appears immediately
}

async function addSensitivity() {
  const agent = document.getElementById("newAgent").value;
  const response = document.getElementById("newResponse").value;
  const comment = document.getElementById("newSensitivityComment").value;

  if (!agent) return;

  const res = await fetch(`${API}/patients/${state.currentPatientRef}/sensitivities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent, response, comment }),
  });

  if (res.ok) {
    document.getElementById("newAgent").value = "";
    document.getElementById("newResponse").value = "";
    document.getElementById("newSensitivityComment").value = "";
    document.getElementById("addSensitivityForm").style.display = "none";
    showPatient(state.currentPatientRef);
  }
}
