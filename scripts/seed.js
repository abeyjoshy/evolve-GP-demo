import pool, { initSchema } from "../src/db/database.js";

// Small local helper so each patient below is just data, not repeated
// insert/RETURNING-id plumbing.
async function addPatient({ patientRef, firstName, lastName, dob, sex, phone, ppsn, conditions = [], sensitivities = [], prescriptions = [] }) {
  const patientResult = await pool.query(
    `INSERT INTO patients (patient_ref, first_name, last_name, dob, sex, phone, ppsn)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [patientRef, firstName, lastName, dob, sex, phone, ppsn]
  );
  const patientId = patientResult.rows[0].id;

  // Keyed so a prescription below can link back to the condition it was
  // issued for, the same linked_condition_id pattern the app itself uses.
  const conditionIds = {};
  for (const c of conditions) {
    const result = await pool.query(
      "INSERT INTO conditions (patient_id, condition, noted_on, comment) VALUES ($1,$2,$3,$4) RETURNING id",
      [patientId, c.condition, c.noted_on, c.comment || ""]
    );
    if (c.key) conditionIds[c.key] = result.rows[0].id;
  }

  for (const s of sensitivities) {
    await pool.query(
      "INSERT INTO sensitivities (patient_id, agent, response, comment) VALUES ($1,$2,$3,$4)",
      [patientId, s.agent, s.response || "", s.comment || ""]
    );
  }

  for (const p of prescriptions) {
    await pool.query(
      `INSERT INTO prescriptions (patient_id, drug_name, instructions, comment, issued_on, linked_condition_id)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [patientId, p.drug_name, p.instructions || "", p.comment || "", p.issued_on, p.linkedConditionKey ? conditionIds[p.linkedConditionKey] : null]
    );
  }
}

async function seed() {
  await initSchema();

  await pool.query("DELETE FROM prescriptions");
  await pool.query("DELETE FROM sensitivities");
  await pool.query("DELETE FROM conditions");
  await pool.query("DELETE FROM patients");
  await pool.query("DELETE FROM doctors");

  await pool.query(
    "INSERT INTO doctors (email, password, name) VALUES ($1, $2, $3)",
    ["joshy@evolve.com", "Evolve@123", "Dr. Joshy"]
  );

  // Also present in Epic (same name, dob, ppsn) — syncing both should merge
  // onto one SPHERE Patient, matched by the shared PPSN identifier. Evolve
  // contributes different clinical data than Epic does for this same person,
  // so $everything genuinely shows an aggregated record from two sources.
  await addPatient({
    patientRef: "GP-5001", firstName: "Arjun", lastName: "Mehta", dob: "1985-03-22", sex: "M", phone: "0851000001", ppsn: "1234567A",
    conditions: [{ key: "rhinitis", condition: "Seasonal allergic rhinitis", noted_on: "2023-04-02", comment: "worse in spring" }],
    prescriptions: [{ drug_name: "Cetirizine", instructions: "10mg once daily during flare-ups", issued_on: "2023-04-02", linkedConditionKey: "rhinitis" }],
  });

  // Also present in Epic (same name, dob, ppsn) — second shared patient.
  await addPatient({
    patientRef: "GP-5002", firstName: "Priya", lastName: "Nair", dob: "1990-11-08", sex: "F", phone: "0851000002", ppsn: "2345678B",
    conditions: [{ key: "vitd", condition: "Vitamin D deficiency", noted_on: "2023-06-18", comment: "routine bloodwork finding" }],
    prescriptions: [{ drug_name: "Vitamin D3", instructions: "1000 IU once daily", issued_on: "2023-06-18", linkedConditionKey: "vitd" }],
  });

  // Evolve-only — no matching record in Epic.
  await addPatient({
    patientRef: "GP-5003", firstName: "Ananya", lastName: "Reddy", dob: "1995-04-30", sex: "F", phone: "0861000002", ppsn: "4567890D",
    conditions: [{ key: "anemia", condition: "Iron deficiency anemia", noted_on: "2023-08-12", comment: "dietary counselling given" }],
    prescriptions: [{ drug_name: "Ferrous sulfate", instructions: "200mg once daily", issued_on: "2023-08-12", linkedConditionKey: "anemia" }],
  });

  console.log("Evolve local DB seeded with 3 patients and 1 doctor.");
  process.exit(0);
}

seed().catch((error) => {
  console.error(`Seed failed: ${error}`);
  process.exit(1);
});
