import { Router } from "express";
import { pg } from "../../db/pgClient.js";

const router = Router();

// GET /tx/:hash/trace
router.get("/:hash/trace", async (req, res) => {
  try {
    const txHash = req.params.hash.toLowerCase();

    const { rows: txRows } = await pg.query(
      "SELECT * FROM transactions WHERE tx_hash=$1",
      [txHash]
    );

    const { rows: tokenRows } = await pg.query(
      "SELECT * FROM erc20_transfers WHERE tx_hash=$1",
      [txHash]
    );

    if (txRows.length === 0) {
      return res.status(404).json({ error: "tx not found" });
    }

    res.json({
      tx: txRows[0],
      token_transfers: tokenRows
    });
  } catch (err) {
    console.error("tx route error:", err);
    res.status(500).json({ error: "internal error" });
  }
});

export default router;
