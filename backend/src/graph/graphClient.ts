// backend/src/graph/graphClient.ts
import { connectMongo } from "../db/mongoClient.js";
import mongoose from "mongoose";

const NodeSchema = new mongoose.Schema({
  address: { type: String, unique: true },
  lastSeen: Date,
  metadata: Object,
  pagerank: { type: Number, default: 0 },
  clusterId: { type: String, default: null },
}, { timestamps: true });

const EdgeSchema = new mongoose.Schema({
  from: { type: String, index: true },
  to: { type: String, index: true },
  weight: { type: Number, default: 0 },
  lastSeen: Date
}, { timestamps: true });

export const GraphNode = mongoose.models.GraphNode || mongoose.model("GraphNode", NodeSchema);
export const GraphEdge = mongoose.models.GraphEdge || mongoose.model("GraphEdge", EdgeSchema);

export async function ensureMongo() {
  await connectMongo();
}
