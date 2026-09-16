import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// A real client-server database, unlike SQLite — this pool holds open
// network connections to a separately running Postgres server, instead of
// just opening a local file. Same relational design as before (separate
// tables joined by patient_id, not embedded arrays), different transport.
const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});

// Called once at startup (see server.js) — creates the tables if they don't
// already exist yet, so nobody has to run CREATE TABLE by hand. This still
// needs the database and user themselves to already exist in Postgres
// first; that part isn't something the app can do for itself.
export async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS doctors (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS patients (
      id SERIAL PRIMARY KEY,
      patient_ref TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      dob TEXT NOT NULL,
      sex TEXT,
      phone TEXT,
      ppsn TEXT
    );

    CREATE TABLE IF NOT EXISTS conditions (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL REFERENCES patients(id),
      condition TEXT NOT NULL,
      noted_on TEXT,
      comment TEXT
    );

    CREATE TABLE IF NOT EXISTS sensitivities (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL REFERENCES patients(id),
      agent TEXT NOT NULL,
      response TEXT,
      comment TEXT
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL REFERENCES patients(id),
      drug_name TEXT NOT NULL,
      instructions TEXT,
      comment TEXT,
      issued_on TEXT,
      linked_condition_id INTEGER REFERENCES conditions(id)
    );
  `);
}

export default pool;
