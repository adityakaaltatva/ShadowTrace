import express from "express";
// @ts-ignore
import cors from "cors";

import walletRouter from "./routes/wallet.js";
import alertRouter from "./routes/alerts.js";
import txRouter from "./routes/tx.js";

import { startListener } from "../ingestion/ethListener.js";
import { startGraphWorker } from "../graph/worker.js";
import { connectMongo } from "../db/mongoClient.js";
import { initPg } from "../db/pgClient.js";

const app = express();
app.use(express.json());
app.use(cors());

// --- Routes ---
app.use("/wallet", walletRouter);
app.use("/alerts", alertRouter);
app.use("/tx", txRouter);

// --- Health Endpoint ---
app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = 3000;

app.listen(PORT, async () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);

  await connectMongo();
  await initPg();

  // Start Ethereum listener
  startListener().catch(console.error);

  // Start graph worker (recompute every 5 minutes)
  startGraphWorker(1000 * 60 * 5).catch(err => console.error("Graph worker failed to start", err));
});
