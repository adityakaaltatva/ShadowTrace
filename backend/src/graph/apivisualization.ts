import express from "express";
import { exportCluster, exportEgoNetwork } from "./export.js";

const router = express.Router();

router.get("/graph/export/cluster/:id", async (req, res) => {
  const json = await exportCluster(req.params.id);
  res.json(json);
});

router.get("/graph/export/ego/:wallet", async (req, res) => {
  const depth = Number(req.query.depth || 1);
  const json = await exportEgoNetwork(req.params.wallet, depth);
  res.json(json);
});

export default router;
