/**
 * backend/src/intelligence/dealbreaker.ts
 *
 * Rapid Stablecoin Chain-Hop Detector (the "dealbreaker")
 *
 * - Keeps a TTL sliding window of recent events per wallet (stable_in, erc_out, bridge_call)
 * - Heuristically scores temporal patterns (stable_in -> bridge within short window; structuring)
 * - Persists high-risk alerts to MongoDB and updates WalletProfile.risk_seed and tags
 *
 * Usage (example):
 *  - import { recordStableIn, recordErcOut, recordBridgeCall, initDealbreaker } from "./dealbreaker";
 *  - await initDealbreaker(); // ensure Mongo connection already established elsewhere
 *  - When you decode an ERC20 transfer and token ∈ KNOWN_STABLES: await recordStableIn(toWallet, amountBigInt, txHash, ts)
 *  - When you detect outgoing ERC20 transfer: await recordErcOut(fromWallet, amountBigInt, txHash, ts)
 *  - When tx.to ∈ KNOWN_BRIDGES (or receipt logs show bridge event): await recordBridgeCall(txFrom, txHash, ts, bridgeAddress, targetChain)
 */

import { LRUCache as LRU } from "lru-cache";
import mongoose, { Schema } from "mongoose";
import { WalletProfile } from "../db/schemas/WalletProfile.js";
import { KNOWN_BRIDGES } from "../config.js";
import { Document } from "mongoose";

type EventType = "stable_in" | "erc_out" | "bridge_call";

type EventRecord = {
  type: EventType;
  amount: bigint; // raw token units (not normalized); use BigInt for safety
  ts: number; // epoch ms
  tx: string;
  token?: string | undefined; // e.g., "USDT"
  bridgeAddress?: string | undefined;
  targetChain?: string | undefined;
};

type CacheValue = EventRecord[];

/* ---------- CONFIGURABLE HYPERPARAMETERS ---------- */
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes sliding window
const BRIDGE_SHORT_MS = 10 * 60 * 1000; // bridge within 10 minutes after stable_in is strong signal
const LARGE_STABLE_THRESHOLD = BigInt(1_000_000 * 10 ** 6); // example: 1,000,000 * 10^6 smallest units if token decimals=6 (adjust to real decimals)
const SMALL_OUT_THRESHOLD = BigInt(1_000 * 10 ** 6); // e.g., small out = < 1,000 USDT (adjust)
const SMALL_OUT_COUNT_FOR_STRUCTURING = 10; // 10 small outs after stable_in considered structuring
const SCORE_ALERT_THRESHOLD = 60; // final normalized score threshold to emit alert
const MAX_CACHE_SIZE = 10000; // max wallets in LRU cache

/* ---------- IN-MEMORY SLIDING WINDOW (LRU) ---------- */
const cache = new LRU<string, CacheValue>({
  max: MAX_CACHE_SIZE,
  ttl: WINDOW_MS, // ensures entries older than WINDOW_MS removed automatically
});

/* ---------- ALERT SCHEMA (persist to Mongo) ---------- */
interface IAlert extends Document {
  wallet: string;
  score: number;
  reasons: string[];
  events: EventRecord[];
  createdAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    wallet: { type: String, index: true },
    score: Number,
    reasons: [String],
    events: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: { createdAt: "createdAt", updatedAt: false } }
);

const AlertModel = mongoose.models.Alert || mongoose.model<IAlert>("Alert", AlertSchema);

/* ---------- DEDUPLICATION: ensure we don't emit duplicate alerts for same wallet + reason in window ---------- */
const alertDeduper = new LRU<string, number>({ max: 20000, ttl: WINDOW_MS });

function dedupeKey(wallet: string, tag: string) {
  return `${wallet}:${tag}`;
}

/* ---------- HELPERS ---------- */
function nowMs() {
  return Date.now();
}

function pushEvent(wallet: string, ev: EventRecord) {
  wallet = wallet.toLowerCase();
  const arr = cache.get(wallet) || [];
  arr.push(ev);
  // prune old events by explicit filter (LRU ttl will also clean)
  const cutoff = nowMs() - WINDOW_MS;
  const recent = arr.filter((e) => e.ts >= cutoff);
  cache.set(wallet, recent);
}

function getRecent(wallet: string) {
  wallet = wallet.toLowerCase();
  const arr = cache.get(wallet) || [];
  const cutoff = nowMs() - WINDOW_MS;
  return arr.filter((e) => e.ts >= cutoff);
}

/* ---------- SCORING LOGIC ---------- */
async function evaluateWallet(wallet: string) {
  wallet = wallet.toLowerCase();
  const events = getRecent(wallet);
  if (events.length === 0) return;

  // partition events
  const stableIns = events.filter((e) => e.type === "stable_in");
  const bridgeCalls = events.filter((e) => e.type === "bridge_call");
  const ercOuts = events.filter((e) => e.type === "erc_out");

  // If no stable incoming -> low baseline risk from this detector
  if (stableIns.length === 0) return;

  // compute heuristic score
  let score = 0;
  const reasons: string[] = [];

  // 1. Large stable inflow
  const largeStable = stableIns.some((s) => s.amount >= LARGE_STABLE_THRESHOLD);
  if (largeStable) {
    score += 40;
    reasons.push("large_stable_in");
  }

  // 2. Bridge call within BRIDGE_SHORT_MS after ANY stable_in
  // find if any pair exists such that bridge.ts - stable.ts < BRIDGE_SHORT_MS and > 0
  let bridgeSoon = false;
  for (const s of stableIns) {
    for (const b of bridgeCalls) {
      if (b.ts >= s.ts && b.ts - s.ts <= BRIDGE_SHORT_MS) {
        bridgeSoon = true;
        break;
      }
    }
    if (bridgeSoon) break;
  }
  if (bridgeSoon) {
    score += 45;
    reasons.push("bridge_within_short_window");
  }

  // 3. Structuring: many small outs after the most recent stable_in
  const lastStable = stableIns.reduce((a, b) => (a.ts > b.ts ? a : b));
  const outsAfter = ercOuts.filter((o) => o.ts >= lastStable.ts);
  const smallOuts = outsAfter.filter((o) => o.amount <= SMALL_OUT_THRESHOLD);
  if (smallOuts.length >= SMALL_OUT_COUNT_FOR_STRUCTURING) {
    score += 30;
    reasons.push("structuring_many_small_outs");
  }

  // 4. Quick chain of transfers (many outs + immediate bridge) - amplify
  if (bridgeSoon && smallOuts.length >= Math.floor(SMALL_OUT_COUNT_FOR_STRUCTURING / 2)) {
    score += 15;
    reasons.push("amplified_bridge_structuring");
  }

  // 5. Optional: cluster amplification placeholder (requires cluster service)
  // if (await inSuspiciousCluster(wallet)) { score += 10; reasons.push("cluster_amplification"); }

  // normalize score to 0..100 (cap)
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  // Emit alert if crossing threshold
  if (score >= SCORE_ALERT_THRESHOLD) {
    // dedupe by wallet + reason set
    const tag = reasons.sort().join("|") || "rapid_chain_hop";
    const key = dedupeKey(wallet, tag);

    if (!alertDeduper.has(key)) {
      alertDeduper.set(key, nowMs());
      await persistAlert(wallet, score, reasons, events);
      // update wallet profile
      await WalletProfile.updateOne(
        { wallet },
        { $set: { risk_seed: score, last_seen: new Date() }, $addToSet: { tags: { $each: ["rapid_chain_hop", ...reasons] } } },
        { upsert: true }
      );
      console.log(`[DEALBREAKER] ALERT: ${wallet} score=${score} reasons=${reasons.join(",")}`);
    } else {
      // already alerted recently for same signature
    }
  } else {
    // For lower scores, update risk_seed lightly (non-urgent)
    await WalletProfile.updateOne({ wallet }, { $set: { risk_seed: Math.max(0, score) }, $setOnInsert: { last_seen: new Date() } }, { upsert: true });
  }
}

/* ---------- PERSIST ALERT ---------- */
async function persistAlert(wallet: string, score: number, reasons: string[], events: EventRecord[]) {
  try {
    const doc = new AlertModel({ wallet, score, reasons, events });
    await doc.save();
  } catch (e) {
    console.error("persistAlert error:", e);
  }
}

/* ---------- EXPORTS: functions to be called from ingestion pipeline ---------- */

/**
 * recordStableIn
 * - wallet: destination address (receiver)
 * - amount: BigInt (raw token units)
 * - tx: tx hash
 * - ts: epoch ms (optional; defaults to now)
 */
export async function recordStableIn(wallet: string, amount: bigint, tx: string, ts?: number, token?: string) {
  try {
    const ev: EventRecord = { type: "stable_in", amount, ts: ts || nowMs(), tx, token };
    pushEvent(wallet, ev);
    await evaluateWallet(wallet);
  } catch (e) {
    console.error("recordStableIn error", e);
  }
}

/**
 * recordErcOut
 * - wallet: sender address
 * - amount: BigInt (raw token units)
 */
export async function recordErcOut(wallet: string, amount: bigint, tx: string, ts?: number) {
  try {
    const ev: EventRecord = { type: "erc_out", amount, ts: ts || nowMs(), tx };
    pushEvent(wallet, ev);
    await evaluateWallet(wallet);
  } catch (e) {
    console.error("recordErcOut error", e);
  }
}

/**
 * recordBridgeCall
 * - wallet: tx.from (who called the bridge)
 * - tx: tx hash
 * - ts: epoch ms
 * - bridgeAddress: contract address called
 * - targetChain: optional target chain identifier
 */
export async function recordBridgeCall(wallet: string, tx: string, ts?: number, bridgeAddress?: string, targetChain?: string) {
  try {
    const ev: EventRecord = { type: "bridge_call", amount: BigInt(0), ts: ts || nowMs(), tx, bridgeAddress, targetChain };
    pushEvent(wallet, ev);
    await evaluateWallet(wallet);
  } catch (e) {
    console.error("recordBridgeCall error", e);
  }
}

/* ---------- Utility: attempt to detect bridge txs from tx.to or logs (ingestion should call) ---------- */
export function isKnownBridgeAddress(addr?: string) {
  if (!addr) return false;
  try {
    return KNOWN_BRIDGES.some((b) => b.toLowerCase() === addr.toLowerCase());
  } catch {
    return false;
  }
}

/* ---------- Init helper (optional) ---------- */
export async function initDealbreaker() {
  // No-op currently. Kept for future initialization (e.g., load persistent recent events)
  // Ensure mongoose connection is active before using (connectMongo elsewhere)
  if (mongoose.connection.readyState !== 1) {
    console.warn("initDealbreaker: mongoose not connected (call connectMongo first)");
  }
}

/* ---------- Export types for tests or external usage ---------- */
export type { EventRecord };
