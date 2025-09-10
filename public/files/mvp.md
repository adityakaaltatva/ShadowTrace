# ShadowTrace – MVP Prototype Roadmap

## 🎯 Prototype Objectives

The **12-day MVP** will deliver a **thin vertical slice** of ShadowTrace across all core modules:

* **Blockchain Ingestion Engine** : Pull Ethereum wallet transactions and store in database.
* **Transaction Graph Builder** : Generate and visualize wallet → transaction → entity graphs.
* **Smart Contract Scanner** : Run Mythril/Slither audits on smart contracts.
* **AI/ML Threat Detection** : Train and deploy anomaly detection (Isolation Forest).
* **OSINT Integration** : Match wallet addresses against sanctions lists and public fraud DBs.
* **Analyst Dashboard** : Secure web UI for wallet lookup, visualization, alerts, and reporting.
* **DevOps/CI-CD** : Microservices setup, Podman/Docker deployment, GitHub Actions pipeline.

---

## 📦 Prototype Deliverables

By the end of the sprint, the prototype should provide:

* Ethereum transaction tracker (API + DB storage).
* Wallet linkage + graph visualization service.
* Smart contract audit engine (basic vulnerability detection).
* AI-based anomaly scoring endpoint.
* OSINT matching engine (sanctions/fraud DBs).
* Integrated dashboard (React + D3.js).
* PDF reporting export (investigation summary).
* CI/CD pipeline for automated testing, build, and deployment.

---

## 📆 12-Day Development Plan

### **Day 1–2: Setup & Core Infrastructure**

* Setup repo structure (backend, ML, OSINT, blockchain, frontend).
* Environment configs (`.env`, DB connections).
* Add Podman/Docker configs for backend, ML, DB.
* Initialize GitHub Actions (lint + tests).

**Deliverable:** Working repo skeleton with CI enabled.

---

### **Day 3–4: Blockchain Ingestion Engine**

* Implement Ethereum transaction ingestion (Ethers.js + Infura/Alchemy).
* Store transactions in PostgreSQL (structured) + MongoDB (graph).
* API: `/wallet/:address` → return transactions.

**Deliverable:** Basic blockchain ingestion microservice.

---

### **Day 5–6: Transaction Graph & Visualization**

* Implement graph builder (NetworkX/Neo4j).
* API: `/graph/:wallet` → return JSON graph.
* D3.js component for wallet transaction network.

**Deliverable:** Wallet transaction graph visualization.

---

### **Day 7: Smart Contract Scanner**

* Integrate Mythril + Slither for contract analysis.
* Fetch contracts via Etherscan API or bytecode decompilation.
* API: `/audit/:contractAddress` → structured vulnerabilities JSON.

**Deliverable:** Smart contract audit engine.

---

### **Day 8–9: AI/ML Threat Detection**

* Prepare sample wallet dataset (normal + suspicious).
* Train **Isolation Forest** anomaly detection model.
* Expose API: `/ai/score/:wallet` → risk score.
* Store results for dashboard visualization.

**Deliverable:** AI microservice with anomaly detection.

---

### **Day 10: OSINT Integration**

* Ingest sanctions/fraud datasets (OFAC, scam DBs).
* API: `/osint/check/:wallet`.
* Store OSINT matches in DB + link to wallet profiles.

**Deliverable:** OSINT correlation engine.

---

### **Day 11: Analyst Dashboard**

* Build React dashboard:
  * Wallet search bar
  * Graph visualization (D3.js)
  * Smart contract audit view
  * Risk score & OSINT status
  * Export PDF reports

**Deliverable:** Functional analyst dashboard prototype.

---

### **Day 12: Integration & Final Polish**

* Connect all microservices.
* Deploy with Podman Compose.
* Finalize CI/CD pipeline (test → build → deploy).
* Create demo report of MVP results.

**Deliverable:** End-to-end running ShadowTrace MVP.

---

## 🔀 Branching Strategy

* `main` → stable release branch.
* `dev` → active integration branch.
* `feature/<module>` → short-lived branches (e.g., `feature/blockchain-ingestion`).
* `hotfix/<issue>` → emergency fixes.

**Commit Guidelines (Conventional Commits):**

* `feat: add blockchain ingestion service`
* `fix: resolve DB connection issue`
* `docs: update API usage guide`
* `test: add unit tests for OSINT parser`
