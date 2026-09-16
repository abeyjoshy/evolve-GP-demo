import pool from "../db/database.js";

export default async function addCondition(req, res) {
  const { patientRef } = req.params;
  const condition = req.body?.condition || null;
  const comment = req.body?.comment || "";

  if (!condition) {
    return res.status(400).json({ message: "condition is required" });
  }

  try {
    const patientResult = await pool.query("SELECT * FROM patients WHERE patient_ref = $1", [patientRef]);
    const patient = patientResult.rows[0];

    if (!patient) {
      return res.status(404).json({ message: `No patient with reference '${patientRef}'` });
    }

    const notedOn = new Date().toISOString().slice(0, 10);
    // RETURNING * — the UI needs the new row's id back to link any
    // prescriptions from the same consultation to this condition.
    const result = await pool.query(
      "INSERT INTO conditions (patient_id, condition, noted_on, comment) VALUES ($1, $2, $3, $4) RETURNING *",
      [patient.id, condition, notedOn, comment]
    );

    return res.status(201).json({ condition: result.rows[0] });
  } catch (error) {
    console.error(`Error adding condition for ${patientRef}: ${error}`);
    return res.status(500).json({ message: "Failed to add condition" });
  }
}
