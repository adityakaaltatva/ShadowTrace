// backend/src/graph/worker.ts
import { ensureMongo } from "./graphClient.js";
import { recomputeGraph } from "./compute.js";

let running = false;

export async function startGraphWorker(intervalMs = 1000 * 60 * 5) {
  await ensureMongo();
  if (running) return;
  running = true;
  // run immediately once
  await safeRun();
  setInterval(safeRun, intervalMs);
}

async function safeRun() {
  try {
    console.log("🔷 Graph worker: recomputing graph...");
    const res = await recomputeGraph({ minEdgeWeight: 1 }); // ignore tiny edges
    console.log(`🔷 Graph worker: completed. nodes:${res.nodes} edges:${res.edges}`);
  } catch (err) {
    console.error("🔷 Graph worker error:", err);
  }
}

export async function runOnce() {
  return recomputeGraph();
}
