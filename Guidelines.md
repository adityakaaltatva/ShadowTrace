# ShadowTrace – Team Guidelines

✅ This document defines team responsibilities, contribution workflow, branching strategy, and core deliverables for **ShadowTrace**.
Our mission is to build a robust, modular MVP using microservices, with clear ownership across team members.

---

## 👥 Team Roles & Responsibilities

### 🔹 Aditya (Core – Blockchain, Backend, DevOps, Databases)

- [ ] **Core System Architecture & Design**
- [ ] **Blockchain Integration (Ethereum, Web3.js, Ethers.js, Solidity)**
- [ ] **Backend Microservices (Node.js, Express.js, API Gateway)**
- [ ] **Database Layer (PostgreSQL, MongoDB schema, data pipelines)**
- [ ] **DevOps & Infrastructure (Podman/Docker, AWS EC2/RDS/S3, GitHub Actions CI/CD, Nginx)**
- [ ] **Security Tooling Integration (Mythril, Slither, Echidna)**
- [ ] **Authentication & Access Control**
- [ ] **Core Data Ingestion Service & Transaction Processing Engine**
- [ ] **Smart Contract Reconnaissance Engine**- Static & bytecode analysis with Mythril, Slither, Echidna

- Continuous contract vulnerability monitoring

---

### 🔹 Agrim

- [X] **Frontend Development (React.js, Tailwind CSS)**
- [X] **Analyst Dashboard UI/UX**
- [X] **D3.js Visualizations for Wallet Graphs & Transactions**
- [X] **Routing, State Management & API Integration**

---

### 🔹 Jassi

- [X] **AI/ML Models**
  - Graph Neural Networks (GNNs) for wallet clustering
  - Isolation Forests & Autoencoders for anomaly detection
  - LSTMs/Transformers for sequence-based fraud detection
- [X] **ML Inference Microservice (Flask/FastAPI)**
- [X] **Model Training, Testing, and Deployment**
- [X] **Maintaining ML Pipelines on GPU Server**

---

### 🔹 Shashank

- [ ] **OSINT Correlation Engine**
  - Integration with OpenSanctions, DarkSearch API, and scraped datasets
- [ ] **Intel Fusion Service** (Merges blockchain telemetry + OSINT intelligence)
- [ ] frontend work with agrim

---

### 🔹 Ganesh

- [ ] **Testing & Quality Assurance**
  - Unit Tests & Integration Tests
  - Backend & API test coverage
- [ ] **Load Testing & Benchmarking (JMeter, Locust)**
- [ ] **Monitoring & Logging Integration (ELK / Prometheus-Grafana)**
- [ ] **Documentation**
  - API Docs
  - Deployment Guides
  - User Manuals / Case Studies

---

## 🛠 Core Deliverables

### 1. Microservices Engines

- [X] **Blockchain Ingestion Service** → Streams blocks, txs, events (Aditya)
- [X] **Transaction Analysis Engine** → AI/ML anomaly detection (Jassi)
- [X] **Smart Contract Security Engine** → Vulnerability scanning (Shashank)
- [X] **OSINT Fusion Service** → Sanctions & dark web enrichment (Shashank)
- [X] **API Gateway & Auth** → Unified access layer (Aditya)
- [X] **Frontend Analyst Dashboard** → Real-time console (Agrim)

### 2. DevOps & Infrastructure

- [X] **Containerization** → Podman/Docker for each service (Aditya)
- [X] **CI/CD** → GitHub Actions pipelines (Aditya)
- [X] **Cloud Infra** → AWS EC2, RDS, S3 (Aditya)
- [X] **Logging & Monitoring** → Prometheus, Grafana, ELK stack (Ganesh)

---

## 🌱 Branching Strategy

We follow **GitHub Flow with Feature Branching**:

- **`main`** → Always production-ready
- **`develop`** → Integration branch (all features merge here before release)
- **`feature/*`** → New features (`feature/frontend-dashboard`, `feature/ml-anomaly`)
- **`bugfix/*`** → Bug fixes (`bugfix/fix-db-connection`)
- **`hotfix/*`** → Urgent patches for production
- **`release/*`** → Final testing branch before merging into `main`



## General Guidelines

* Always branch off  **develop** , never directly from `main`.
* Each service should include **tests + docs** before merging.
* Keep PRs small and focused → easier review & CI runs faster.
* No secrets in commits — always use `.env` and `.env.example`.
* Document **all new endpoints, ML models, and pipelines** inside `/docs`.

### Example Workflow

```bash


We use Conventional Commits for clarity:

feat: → New feature

fix: → Bug fix

docs: → Documentation changes only

test: → Adding/updating tests

chore: → Maintenance, configs, cleanup

perf: → Performance improvements

✅ Example:

git commit -m "feat(dashboard): add transaction heatmap visualization"


# Create and switch to new feature branch


git checkout -b feature/ml-anomaly

# Make changes, then commit with conventional commit format
git commit -m "feat(ml): add autoencoder anomaly detection"

# Push to remote
git push origin feature/ml-anomaly

# Open a PR into 'develop'


```
