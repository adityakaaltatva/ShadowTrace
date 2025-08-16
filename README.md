# ShadowTrace: Blockchain Intelligence & Threat Detection Platform

!(https://img.shields.io/badge/status-in%20development-blue.svg)

!(https://www.google.com/search?q=https://img.shields.io/badge/contributions-welcome-brightgreen.svg)

**ShadowTrace** is an intelligence-grade platform for blockchain forensics, real-time threat detection, and operational security. It is designed to combat the rising tide of illicit on-chain activities by providing actionable intelligence to security analysts, DeFi developers, and institutional risk managers.

---

## Table of Contents

1. (#the-problem)
2. (#the-solution-shadowtrace)
3. [Key Features](https://www.google.com/search?q=%23key-features)
4. (#technology-stack)
5. (#system-architecture)
6. (#getting-started)
   * [Prerequisites](https://www.google.com/search?q=%23prerequisites)
   * [Installation](https://www.google.com/search?q=%23installation)
7. [Usage](https://www.google.com/search?q=%23usage)
8. (#project-roadmap)
9. [Contributing](https://www.google.com/search?q=%23contributing)
10. [License](https://www.google.com/search?q=%23license)
11. [Acknowledgments](https://www.google.com/search?q=%23acknowledgments)

---

## The Problem

The cryptocurrency ecosystem, while innovative, has become a significant vector for illicit finance. The scale and complexity of on-chain crime are escalating rapidly:

* **Massive Illicit Volume:** An estimated **$51 billion** flowed to illicit crypto wallets in 2024.^1^
* **Evolving Laundering Tactics:** Criminals have strategically shifted from volatile assets to stablecoins, which now account for  **63% of all illicit crypto laundering** .^1^
* **Sophisticated Obfuscation:** The use of cross-chain bridges and decentralized exchanges (DEXs) to "chain-hop" and launder funds surged past **$21 billion** in 2025, a threefold increase from 2023.^2^

Traditional blockchain explorers are passive tools, and many professional forensic platforms are reactive, focusing on post-mortem investigation. This leaves a critical gap for a proactive, real-time operational security platform that can detect and prevent threats as they emerge.

## The Solution: ShadowTrace

ShadowTrace is engineered to be the "windshield" for on-chain security, providing the real-time situational awareness needed to combat modern threats. It moves beyond historical analysis to provide live, actionable intelligence.

Our unique value proposition is built on three pillars ^3^:

1. **Real-Time Situational Awareness:** Live telemetry and an operational dashboard provide a common operating picture of on-chain activity.
2. **Proactive Threat Detection:** Advanced AI/ML models predict and flag suspicious activity before funds are lost.
3. **Integrated Context:** We fuse on-chain data with a deep layer of off-chain intelligence (OSINT) to provide a complete, actionable picture.

## Key Features

* **Live Blockchain Telemetry:** Real-time ingestion and parsing of on-chain transactions, blocks, and smart contract events for immediate analysis.
* **AI/ML Anomaly Detection:** A sophisticated suite of models to identify complex illicit activities:
  * **Graph Neural Networks (GNNs):** Uncover hidden relationships and detect sophisticated money laundering networks.^5^
  * **Isolation Forest:** Efficiently detects rare and unusual wallet behaviors that deviate from the norm.^8^
  * **Autoencoders:** Learn "normal" transaction patterns to flag novel threats and deviations with high accuracy.^14^
  * **LSTM/Transformer Models:** Analyze transaction sequences over time to predict fraud and identify attack preparation stages.
* **Smart Contract Reconnaissance:** Automated scanning of smart contracts using industry-standard tools like **Mythril** and **Slither** to detect vulnerabilities such as reentrancy, integer overflows, and malicious logic.^18^
* **OSINT Correlation:** Enriches on-chain data by linking addresses to sanctioned entities (OFAC, EU), leaked databases, and dark web intelligence feeds.^24^
* **Operational Analyst Dashboard:** An intuitive, role-based web console built with React and D3.js for real-time alerts, interactive graph visualization, investigation workflows, and case reporting.

## Technology Stack

| Layer                          | Technology                                                |
| ------------------------------ | --------------------------------------------------------- |
| **Frontend**             | React.js, Tailwind CSS, D3.js, Axios, React Router        |
| **Backend API**          | Node.js + Express.js                                      |
| **ML Inference Service** | Python, Flask/FastAPI                                     |
| **Blockchain Layer**     | Ethers.js, Web3.js, Solidity                              |
| **Databases**            | PostgreSQL (Structured Data), MongoDB (Graph/Intel Store) |
| **AI/ML Libraries**      | Scikit-learn, Pandas, NumPy, PyTorch                      |
| **Security Tools**       | Mythril, Slither, Echidna                                 |
| **DevOps**               | Docker, AWS (EC2/RDS/S3), GitHub Actions, Nginx           |
| **OSINT Tools**          | OpenSanctions API, DarkSearch API, Custom Scripts         |

## System Architecture

ShadowTrace employs a multi-layered, service-oriented architecture designed for scalability and performance. At its core is a **hybrid database model** that leverages the strengths of both SQL and NoSQL.^29^

* **PostgreSQL:** Stores immutable, structured data such as blocks, transactions, and token transfers, ensuring ACID compliance and data integrity.
* **MongoDB:** Stores flexible, unstructured data like OSINT tags, wallet cluster metadata, and investigation notes, allowing for rapid evolution of our intelligence models.

The data flows through a pipeline:

1. **Acquisition Layer:** Ingests raw data from blockchain nodes.
2. **Processing & Analysis Layer:** Enriches and analyzes the data using our AI/ML models and heuristics.
3. **Presentation Layer:** Delivers actionable intelligence to the user via the Analyst Dashboard and APIs.

## Getting Started

### Prerequisites

* Node.js (v18.x or later)
* Python (v3.9 or later)
* Docker and Docker Compose
* PostgreSQL (v15 or later)
* MongoDB (v6 or later)
* An Infura or Alchemy API key for blockchain data access.

### Installation

1. **Clone the repository:**
   **Bash**

   ```
   git clone https://github.com/your-username/shadowtrace.git
   cd shadowtrace
   ```
2. Set up environment variables:
   Create a .env file in the root directory and populate it with your database credentials and blockchain API keys. A .env.example file is provided.
   **Bash**

   ```
   cp.env.example.env
   # Edit.env with your keys and credentials
   ```
3. **Install dependencies:**

   * **Backend (Node.js):**
     **Bash**

     ```
     cd server
     npm install
     ```
   * **Frontend (React):**
     **Bash**

     ```
     cd client
     npm install
     ```
   * **ML Service (Python):**
     **Bash**

     ```
     cd ml-service
     pip install -r requirements.txt
     ```
4. Launch with Docker Compose:
   From the root directory, run:
   **Bash**

   ```
   docker-compose up --build
   ```

   This will build the images and start all the services, including the databases.

## Usage

Once the application is running, you can access the Analyst Dashboard at `http://localhost:3000`.

* **Dashboard:** View real-time alerts and high-level metrics.
* **Investigation:** Enter a wallet address or transaction hash to begin an investigation.
* **Graph View:** Interact with the transaction graph to trace the flow of funds and explore wallet clusters.

## Project Roadmap

* **Phase 1 (MVP): Real-Time Situational Awareness (Ethereum)**
  * [X] Core data ingestion pipeline for Ethereum.
  * [X] Operational dashboard with D3.js visualizations.
  * [ ] GNN-based wallet clustering engine.
  * [ ] Basic OFAC sanctions list integration.
* **Phase 2: Proactive Detection & Multi-Chain Support**
  * [ ] Add support for **Binance Smart Chain (BSC)** and  **Polygon** .
  * [ ] Deploy Autoencoder and Isolation Forest models for anomaly detection.
  * [ ] Launch "Continuous Vulnerability Monitoring" with Mythril & Slither.
  * [ ] Release V1 of the public API for wallet risk scores.
* **Phase 3: Enterprise Readiness & Advanced Intelligence**
  * [ ] Implement **SIEM integration** (Splunk, Elasticsearch).
  * [ ] Expand OSINT capabilities to include leak datasets and dark web monitoring.
  * [ ] Begin R&D for **Bitcoin (UTXO)** support.
* **Long-Term Vision: The Privacy Frontier**
  * [ ] Research and develop nove**l forensic techniques for privacy-focused networks like ** **Monero** **, tackling challenges like Ring Signatures and Stealth Addresses.**^32^

## Contributing

**Contributions are welcome! Please follow these steps:**

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature/your-feature-name`).
6. Open a Pull Request.

Please read `CONTRIBUTING.md` for more details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the(LICENSE.md) file for details.

## Acknowledgments

* Special thanks to the open-source community for the powerful tools and libraries that make ShadowTrace possible.
* Inspired by the work of leading blockchain intelligence firms and academic researchers in the field.
