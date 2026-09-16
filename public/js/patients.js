import { API } from "./api.js";
import { state } from "./state.js";
import { resetRxRows } from "./records.js";

export function initPatients() {
  document.getElementById("searchBtn").addEventListener("click", () => loadPatients());
  document.getElementById("searchInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") loadPatients();
  });
  document.getElementById("backBtn").addEventListener("click", () => {
    document.getElementById("patientDetail").style.display = "none";
    document.getElementById("appSection").style.display = "flex";
    loadPatients();
  });

  document.getElementById("openAddPatientModalBtn").addEventListener("click", () => {
    document.getElementById("addPatientModal").style.display = "flex";
  });
  document.getElementById("closeAddPatientModalBtn").addEventListener("click", () => {
    document.getElementById("addPatientModal").style.display = "none";
  });

  document.getElementById("addPatientBtn").addEventListener("click", addPatient);
}

async function addPatient() {
  const firstName = document.getElementById("newPatientFirstName").value;
  const lastName = document.getElementById("newPatientLastName").value;
  const dob = document.getElementById("newPatientDob").value;
  const sex = document.getElementById("newPatientSex").value;
  const phone = document.getElementById("newPatientPhone").value;
  const ppsn = document.getElementById("newPatientPpsn").value;

  if (!firstName || !lastName || !dob) return;

  const res = await fetch(`${API}/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ firstName, lastName, dob, sex, phone, ppsn }),
  });

  if (!res.ok) return;

  const data = await res.json();

  document.getElementById("newPatientFirstName").value = "";
  document.getElementById("newPatientLastName").value = "";
  document.getElementById("newPatientDob").value = "";
  document.getElementById("newPatientSex").value = "";
  document.getElementById("newPatientPhone").value = "";
  document.getElementById("newPatientPpsn").value = "";
  document.getElementById("addPatientModal").style.display = "none";

  showPatient(data.patient.patient_ref);
}

export async function loadPatients() {
  const search = document.getElementById("searchInput").value;
  const res = await fetch(`${API}/patients?search=${encodeURIComponent(search)}`);
  const data = await res.json();

  const list = document.getElementById("patientList");
  list.innerHTML = "";

  if (data.patients.length === 0) {
    list.innerHTML = `<li class="empty-note">No patients found.</li>`;
  }

  data.patients.forEach((p) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${p.first_name} ${p.last_name}</span><span class="ref-tag">Ref: ${p.patient_ref}</span>`;
    li.addEventListener("click", () => showPatient(p.patient_ref));
    list.appendChild(li);
  });
}

// Exported because records.js also calls this, to refresh the detail view
// immediately after saving a consultation or a sensitivity.
export async function showPatient(patientRef) {
  state.currentPatientRef = patientRef;
  const res = await fetch(`${API}/patients/${patientRef}`);
  const data = await res.json();
  const patient = data.patient;
  state.currentPatient = patient;

  document.getElementById("appSection").style.display = "none";
  document.getElementById("patientDetail").style.display = "flex";

  document.getElementById("detailName").textContent = `${patient.first_name} ${patient.last_name}`;
  document.getElementById("detailInfo").textContent = `Ref: ${patient.patient_ref}  |  DOB: ${patient.dob}  |  Sex: ${patient.sex || "-"}`;

  resetRxRows();
  document.getElementById("addSensitivityForm").style.display = "none";

  renderSensitivities(patient);
  renderHistory(patient);
}

function renderSensitivities(patient) {
  const list = document.getElementById("detailSensitivities");
  list.innerHTML = patient.sensitivities.length ? "" : `<li class="empty-note">No known sensitivities.</li>`;
  patient.sensitivities.forEach((s) => {
    const li = document.createElement("li");
    li.className = "sensitivity-item";
    li.innerHTML = `
      <div class="sensitivity-header">
        <span class="sensitivity-agent">&#9888;&#65039; ${s.agent}</span>
      </div>
      ${s.response ? `<div class="sensitivity-response"><strong>Response:</strong> ${s.response}</div>` : ""}
      ${s.comment ? `<div class="sensitivity-note">${s.comment}</div>` : ""}
    `;
    list.appendChild(li);
  });
}

// Concise history: each condition, its date, its clinical note, and any
// prescriptions issued for it nested underneath — mirrors Epic's history
// card exactly, just with GP-flavored field/table names underneath.
function renderHistory(patient) {
  const history = document.getElementById("detailHistory");
  history.innerHTML = "";

  if (patient.conditions.length === 0) {
    history.innerHTML = `<li class="empty-note">No history recorded yet.</li>`;
    return;
  }

  const newestFirst = patient.conditions.slice().reverse();

  newestFirst.forEach((c) => {
    const linkedRx = patient.prescriptions.filter((rx) => rx.linked_condition_id === c.id);

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${c.condition}</strong> <span class="muted">(${c.noted_on})</span>
      ${c.comment ? `<br><span class="muted">${c.comment}</span>` : ""}
      ${linkedRx.length
        ? `<ul class="nested-rx">${linkedRx.map((rx) => `
            <li>
              <div class="rx-name">&#128138; ${rx.drug_name}</div>
              <div class="rx-detail">${rx.instructions || ""}</div>
            </li>
          `).join("")}</ul>`
        : ""}
    `;
    history.appendChild(li);
  });
}
