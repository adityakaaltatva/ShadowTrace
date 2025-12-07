// backend/src/graph/apiRoutes.ts
import express from "express";
import { GraphNode, GraphEdge } from "./graphClient.js";
import { runOnce } from "./worker.js";

const router = express.Router();

router.get("/graph/nodes/:addr", async (req, res) => {
  const addr = req.params.addr.toLowerCase();
  const node = await GraphNode.findOne({ address: addr } as any).lean();
  if (!node) return res.status(404).json({ error: "not found" });
  res.json(node);
});

router.get("/graph/cluster/:id", async (req, res) => {
  const id = req.params.id;
  const nodes = await GraphNode.find({ clusterId: id } as any).lean();
  res.json({ clusterSize: nodes.length, nodes });
});

router.post("/graph/recompute", async (req, res) => {
  const r = await runOnce();
  res.json({ ok: true, ...r });
});

export default router;
