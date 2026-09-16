import pool from "../db/database.js";

// Minimal on purpose — no pagination, a GP practice's patient list is small
// enough to just show in full; a plain search filters it further.
export default async function getPatients(req, res) {
  const search = req.query?.search || "";

  try {
    // ILIKE, not LIKE — Postgres's plain LIKE is case-sensitive, unlike
    // SQLite's, so a case-insensitive search needs the Postgres-specific form.
    const result = search
      ? await pool.query(
          `SELECT * FROM patients WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR patient_ref ILIKE $1 ORDER BY last_name`,
          [`%${search}%`]
        )
      : await pool.query(`SELECT * FROM patients ORDER BY last_name`);

    return res.status(200).json({ patients: result.rows });
  } catch (error) {
    console.error(`Error fetching patients: ${error}`);
    return res.status(500).json({ message: "Failed to fetch patients" });
  }
}
