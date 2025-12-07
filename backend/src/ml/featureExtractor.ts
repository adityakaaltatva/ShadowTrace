import { pg } from "../db/pgClient.js";
import { connectMongo } from "../db/mongoClient.js";
import mongoose from "mongoose";

const MetricsSchema = new mongoose.Schema({
  wallet: { type: String, unique: true },
  tx24h: Number,
  tx7d: Number,
  uniquePeers: Number,
  stableIn24h: Number,
  stableOut24h: Number,
  avgTxValue: Number,
  maxInflow: Number,
  maxOutflow: Number,
  lastActive: Date,
}, { timestamps: true });

export const WalletMetrics =
  mongoose.models.WalletMetrics || mongoose.model("WalletMetrics", MetricsSchema);

export async function computeMetricsFor(wallet: string) {
  const res = await pg.query(`
    SELECT 
      COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours') AS tx24h,
      COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '7 days') AS tx7d,
      AVG(value) AS avgValue,
      MAX(value) AS maxValue
    FROM transactions
    WHERE from_addr = $1 OR to_addr = $1
  `, [wallet]);

  const peers = await pg.query(`
    SELECT COUNT(DISTINCT CASE WHEN from_addr=$1 THEN to_addr ELSE from_addr END) AS peers
    FROM transactions
    WHERE from_addr = $1 OR to_addr = $1
  `, [wallet]);

  const metrics = {
    wallet,
    tx24h: Number(res.rows[0].tx24h),
    tx7d: Number(res.rows[0].tx7d),
    uniquePeers: Number(peers.rows[0].peers),
    avgTxValue: Number(res.rows[0].avgvalue || 0),
    maxInflow: Number(res.rows[0].maxvalue || 0),
    lastActive: new Date(),
  };

  await WalletMetrics.findOneAndUpdate(
    { wallet } as any,
    metrics,
    { upsert: true, new: true }
  );

  return metrics;
}
