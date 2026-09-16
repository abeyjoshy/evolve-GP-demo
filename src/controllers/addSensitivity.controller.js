import pool from "../db/database.js";

export default async function addSensitivity(req, res) {
  const { patientRef } = req.params;
  const agent = req.body?.agent || null;
  const response = req.body?.response || "";
  const comment = req.body?.comment || "";

  if (!agent) {
    return res.status(400).json({ message: "agent is required" });
  }

  try {
    const patientResult = await pool.query("SELECT * FROM patients WHERE patient_ref = $1", [patientRef]);
    const patient = patientResult.rows[0];

    if (!patient) {
      return res.status(404).json({ message: `No patient with reference '${patientRef}'` });
    }

    await pool.query(
      "INSERT INTO sensitivities (patient_id, agent, response, comment) VALUES ($1, $2, $3, $4)",
      [patient.id, agent, response, comment]
    );

    return res.status(201).json({ message: "Sensitivity added" });
  } catch (error) {
    console.error(`Error adding sensitivity for ${patientRef}: ${error}`);
    return res.status(500).json({ message: "Failed to add sensitivity" });
  }
}
