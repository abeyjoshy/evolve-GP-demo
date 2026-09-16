import pool from "../db/database.js";

export default async function createPatient(req, res) {
  const firstName = req.body?.firstName || null;
  const lastName = req.body?.lastName || null;
  const dob = req.body?.dob || null;
  const sex = req.body?.sex || "";
  const phone = req.body?.phone || "";
  const ppsn = req.body?.ppsn || "";

  if (!firstName || !lastName || !dob) {
    return res.status(400).json({ message: "firstName, lastName and dob are required" });
  }

  try {
    // Postgres returns COUNT(*) as a bigint, which the pg driver hands back
    // as a string, not a number — Number(...) is required or the template
    // literal below would concatenate text instead of adding.
    const countResult = await pool.query("SELECT COUNT(*) AS count FROM patients");
    const patientRef = `GP-${5000 + Number(countResult.rows[0].count) + 1}`;

    const result = await pool.query(
      `INSERT INTO patients (patient_ref, first_name, last_name, dob, sex, phone, ppsn)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [patientRef, firstName, lastName, dob, sex, phone, ppsn]
    );

    return res.status(201).json({ patient: result.rows[0] });
  } catch (error) {
    console.error(`Error creating patient: ${error}`);
    return res.status(500).json({ message: "Failed to create patient" });
  }
}
