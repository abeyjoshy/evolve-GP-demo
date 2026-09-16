import pool from "../db/database.js";

export default async function addPrescription(req, res) {
  const { patientRef } = req.params;
  const drugName = req.body?.drugName || null;
  const instructions = req.body?.instructions || "";
  const comment = req.body?.comment || "";
  const conditionId = req.body?.conditionId || null;

  if (!drugName) {
    return res.status(400).json({ message: "drugName is required" });
  }

  try {
    const patientResult = await pool.query("SELECT * FROM patients WHERE patient_ref = $1", [patientRef]);
    const patient = patientResult.rows[0];

    if (!patient) {
      return res.status(404).json({ message: `No patient with reference '${patientRef}'` });
    }

    const issuedOn = new Date().toISOString().slice(0, 10);
    await pool.query(
      `INSERT INTO prescriptions (patient_id, drug_name, instructions, comment, issued_on, linked_condition_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [patient.id, drugName, instructions, comment, issuedOn, conditionId]
    );

    return res.status(201).json({ message: "Prescription added" });
  } catch (error) {
    console.error(`Error adding prescription for ${patientRef}: ${error}`);
    return res.status(500).json({ message: "Failed to add prescription" });
  }
}
