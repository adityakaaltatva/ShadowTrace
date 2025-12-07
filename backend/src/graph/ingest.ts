// backend/src/graph/ingest.ts
import { GraphNode, GraphEdge } from "./graphClient.js";

/**
 * Update graph with a transfer event.
 * - increments edge weight (from -> to)
 * - upserts nodes lastSeen
 */
export async function ingestTransfer(from: string, to: string, amount: bigint | number, timestamp: number | Date) {
  const ts = timestamp ? new Date(timestamp) : new Date();
  // normalize addresses
  const f = from.toLowerCase();
  const t = to.toLowerCase();

  // upsert nodes
  await GraphNode.updateOne({ address: f }, { $set: { lastSeen: ts } }, { upsert: true });
  await GraphNode.updateOne({ address: t }, { $set: { lastSeen: ts } }, { upsert: true });

  // upsert edge weight (atomic)
  const w = typeof amount === "bigint" ? Number(amount) : Number(amount || 0);
  await GraphEdge.updateOne(
    { from: f, to: t },
    {
      $inc: { weight: w },
      $set: { lastSeen: ts }
    },
    { upsert: true }
  );
}
