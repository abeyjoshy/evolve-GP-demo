import { Router } from "express";
import login from "../controllers/login.controller.js";
import getPatients from "../controllers/getPatients.controller.js";
import getPatientByRef from "../controllers/getPatientByRef.controller.js";
import addCondition from "../controllers/addCondition.controller.js";
import addPrescription from "../controllers/addPrescription.controller.js";
import addSensitivity from "../controllers/addSensitivity.controller.js";
import createPatient from "../controllers/createPatient.controller.js";

const router = Router();

router.post("/login", login);
router.get("/patients", getPatients);
router.get("/patients/:patientRef", getPatientByRef);
router.post("/patients/:patientRef/conditions", addCondition);
router.post("/patients/:patientRef/prescriptions", addPrescription);
router.post("/patients/:patientRef/sensitivities", addSensitivity);
router.post("/patients", createPatient);
export default router;
