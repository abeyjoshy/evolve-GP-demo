# Evolve GP System (demo)

A mock GP practice system, built as part of the **SPHERE** health information exchange prototype — a conceptual framework for exchanging patient records across independently-run healthcare systems without replacing any of them.

Evolve is the second of two mock local systems in the SPHERE demo, standing in for a GP practice alongside [epic-hospital-demo](https://github.com/abeyjoshy/epic-hospital-demo)'s hospital. It's deliberately built on a different stack (PostgreSQL instead of MongoDB) with different native field names for the same clinical concepts, so the mapping work the [interconnect](https://github.com/abeyjoshy/sphre-interconnect) does is real translation, not a rename.

Full write-up of the SPHERE framework and prototype: **https://abeyjoshy.com/sphere.html**

## Role in the SPHERE ecosystem

| Repo | Role |
|---|---|
| **evolve-gp-demo** (this repo) | Mock GP practice system (PostgreSQL), Node.js/Express |
| [sphere-gateway](https://github.com/abeyjoshy/sphere-gateway) | The cloud SPHERE service this system connects to |
| [epic-hospital-demo](https://github.com/abeyjoshy/epic-hospital-demo) | The first mock system (a hospital), on MongoDB |
| [sphre-interconnect](https://github.com/abeyjoshy/sphre-interconnect) | Maps Evolve's native records to/from HL7 FHIR and syncs them with SPHERE |

## Deliberately different from Epic

Where Epic calls things `diagnoses`, `medications`, and `allergies`, Evolve calls the same concepts `conditions`, `prescriptions`, and `sensitivities` — different field names, different resource shapes, and a different database entirely. This is intentional: it's what makes the interconnect's FHIR mapping a genuine piece of translation work rather than a trivial pass-through.

## API surface

```
POST   /evolve/login
GET    /evolve/patients
GET    /evolve/patients/:patientRef
POST   /evolve/patients
POST   /evolve/patients/:patientRef/conditions
POST   /evolve/patients/:patientRef/prescriptions
POST   /evolve/patients/:patientRef/sensitivities
```

Same as Epic, authentication here is intentionally minimal — this stands in for "a GP practice's own login already exists"; SPHERE's own JWT auth is the real security boundary in this prototype.

## Tech stack

Node.js · Express · PostgreSQL

## Running locally

```bash
npm install
# create the Postgres database/user referenced in .env, then set:
cp .env .env.local   # or edit .env directly with your own Postgres credentials and SPHERE_BASE_URL
npm run seed           # creates demo doctors and patients
npm start               # listens on PORT
```

## Status

A research prototype demonstrating one half of a two-hospital SPHERE exchange scenario. See [epic-hospital-demo](https://github.com/abeyjoshy/epic-hospital-demo) for the first system, and the [full write-up](https://abeyjoshy.com/sphere.html) for the complete architecture.
