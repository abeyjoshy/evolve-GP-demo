import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import routes from "./src/routes/routes.js";
import { initSchema } from "./src/db/database.js";

dotenv.config();

const app = express();
app.use(bodyParser.json({ type: ["application/json", "application/fhir+json"] }));
app.use(cors());
app.use(express.static("public"));

app.use("/evolve/", routes);

// Postgres is a real network service, so — unlike the SQLite version —
// there's an async connection/schema-setup step to await before the server
// can safely start accepting requests.
async function initializeServer() {
  try {
    await initSchema();
    console.log("Postgres connected, schema ready.");

    const port = process.env.PORT || 4002;
    app.listen(port, () => {
      console.log(`Evolve GP local server is now listening at Port: ${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize Evolve GP server:", error);
    process.exit(1);
  }
}

initializeServer();
