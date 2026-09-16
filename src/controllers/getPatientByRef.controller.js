import pool from "../db/database.js";

export default async function getPatientByRef(req, res) {
  const { patientRef } = req.params;

  try {
    const patientResult = await pool.query("SELECT * FROM patients WHERE patient_ref = $1", [patientRef]);
    const patient = patientResult.rows[0];

    if (!patient) {
      return res.status(404).json({ message: `No patient with reference '${patientRef}'` });
    }

    const [conditions, sensitivities, prescriptions] = await Promise.all([
      pool.query("SELECT * FROM conditions WHERE patient_id = $1", [patient.id]),
      pool.query("SELECT * FROM sensitivities WHERE patient_id = $1", [patient.id]),
      pool.query("SELECT * FROM prescriptions WHERE patient_id = $1", [patient.id]),
    ]);

    patient.conditions = conditions.rows;
    patient.sensitivities = sensitivities.rows;
    patient.prescriptions = prescriptions.rows;

    return res.status(200).json({ patient });
  } catch (error) {
    console.error(`Error fetching patient ${patientRef}: ${error}`);
    return res.status(500).json({ message: "Failed to fetch patient" });
  }
}
