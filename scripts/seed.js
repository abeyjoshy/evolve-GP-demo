import pool, { initSchema } from "../src/db/database.js";

async function seed() {
  await initSchema();

  await pool.query("DELETE FROM prescriptions");
  await pool.query("DELETE FROM sensitivities");
  await pool.query("DELETE FROM conditions");
  await pool.query("DELETE FROM patients");
  await pool.query("DELETE FROM doctors");

  await pool.query("INSERT INTO doctors (email, password, name) VALUES ($1, $2, $3)", ["grace@evolve.com", "Evolve@123", "Dr. Grace"]);
  await pool.query("INSERT INTO doctors (email, password, name) VALUES ($1, $2, $3)", ["liam@evolve.com", "Evolve@123", "Dr. Liam"]);

  // Same person as Epic's MRN-9001 (Abey Joshy, dob 1998-04-12) — no shared
  // identifier on purpose, so SPHERE has to match them by demographics
  // (findPatientByDemographics), the fallback matcher that's otherwise
  // never actually exercised in the demo.
  const p1 = await pool.query(
    `INSERT INTO patients (patient_ref, first_name, last_name, dob, sex, phone, ppsn)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    ["GP-5001", "Abey", "Joshy", "1998-04-12", "M", "0851234567", ""]
  );
  await pool.query(
    "INSERT INTO conditions (patient_id, condition, noted_on, comment) VALUES ($1,$2,$3,$4)",
    [p1.rows[0].id, "Seasonal allergic rhinitis", "2024-03-10", "worse in spring"]
  );
  await pool.query(
    "INSERT INTO sensitivities (patient_id, agent, response, comment) VALUES ($1,$2,$3,$4)",
    [p1.rows[0].id, "Ibuprofen", "Stomach upset", "avoid NSAIDs"]
  );

  const p2 = await pool.query(
    `INSERT INTO patients (patient_ref, first_name, last_name, dob, sex, phone, ppsn)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    ["GP-5002", "Sara", "Byrne", "1990-11-02", "F", "0861234567", ""]
  );
  await pool.query(
    "INSERT INTO conditions (patient_id, condition, noted_on, comment) VALUES ($1,$2,$3,$4)",
    [p2.rows[0].id, "Type 2 Diabetes", "2022-09-01", "diet-controlled"]
  );

  console.log("Evolve local DB seeded.");
  process.exit(0);
}

seed().catch((error) => {
  console.error(`Seed failed: ${error}`);
  process.exit(1);
});
