import { Router } from "express";
import { WalletProfile } from "../../db/schemas/WalletProfile.js";
import { pg } from "../../db/pgClient.js";
import { getRecentEvents } from "../../intelligence/recentEvents.js"; 
// we'll generate this helper below

const router = Router();

// GET /wallet/:address/intel
router.get("/:address/intel", async (req, res) => {
  try {
    const addr = req.params.address.toLowerCase();

    const profile = await WalletProfile.findOne({ wallet: addr }).lean();

    // fetch basic stats from Postgres
    const { rows: incomingTx } = await pg.query(
      "SELECT COUNT(*)::int AS c FROM transactions WHERE to_addr=$1",
      [addr]
    );
    const { rows: outgoingTx } = await pg.query(
      "SELECT COUNT(*)::int AS c FROM transactions WHERE from_addr=$1",
      [addr]
    );

    const { rows: stableFlows } = await pg.query(
      "SELECT COUNT(*)::int AS c FROM erc20_transfers WHERE (from_addr=$1 OR to_addr=$1)",
      [addr]
    );

    const events = getRecentEvents(addr); // from dealbreaker sliding window

    res.json({
      wallet: addr,
      profile,
      stats: {
        incoming_txs: incomingTx[0]?.c || 0,
        outgoing_txs: outgoingTx[0]?.c || 0,
        stablecoin_flows: stableFlows[0]?.c || 0
      },
      recent_events: events || [],
      risk: profile?.risk_seed || 0,
      tags: profile?.tags || []
    });
  } catch (err) {
    console.error("wallet route error:", err);
    res.status(500).json({ error: "internal error" });
  }
});

export default router;
