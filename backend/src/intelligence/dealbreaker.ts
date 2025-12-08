/**
 * dealbreaker.ts
 *
 * Heuristic, auditable "dealbreaker" algorithm for ShadowTrace.
 * - TypeScript file (ES module / CommonJS friendly)
 * - Pure logic: keeps light in-memory counters and emits persistent events via callbacks
 *
 * Exported functions:
 * - isKnownBridgeAddress(addr): boolean
 * - recordStableIn(to, amountBigInt, txHash, ts, symbol)
 * - recordErcOut(from, amountBigInt, txHash, ts)
 * - recordBridgeCall(from, txHash, ts, to, chain)
 * - evaluateWalletRisk(walletAddr): Promise<{ riskScore, reasons }>
 *
 * Design notes:
 * - Rule-based scoring system that increments risk for high-value stable inflows,
 *   repeated stable inflows in short windows, known bridge interactions, and rapid outflows.
 * - Produces explainable reasons for each risk contributor.
 * - Uses lightweight sliding windows + counters (memory) for fast demo. In prod you'd persist.
 * - Integrates OSINT enrichment to boost risk scores based on external threat intelligence.
 *
 * Complexity:
 * - record* operations: O(1) amortized per event
 * - evaluateWalletRisk: O(k) where k = number of recent events for wallet + OSINT lookup
 *
 * Usage:
 * - Import and call record* methods from the ethListener when transfers happen.
 * - Periodically (or on-demand) call evaluateWalletRisk(address) to get score + reasons (async).
 */

import { resolveOSINTForAddress } from "../osint/taintEngine.js";

type TxRecord = {
  hash: string;
  ts: number;
  amount: bigint;
  symbol?: string;
  from?: string;
  to?: string;
};

type WalletState = {
  stableInEvents: TxRecord[]; // recent stablecoin incoming transfers
  outgoingEvents: TxRecord[];  // recent outgoing transfers
  bridgeEvents: TxRecord[];    // known bridge txs involving wallet (incoming or outgoing)
  accumulatedStableIn: bigint; // sum over time window
  accumulatedOutgoing: bigint;
};

// --------------------------- CONFIG / HYPERPARAMETERS ---------------------------
const CONFIG = {
  STABLE_HIGH_VALUE_THRESHOLD: BigInt(1000) * BigInt(10) ** BigInt(6), // 1000 * 1e6 (eg USDC 6 decimals) => representational
  // windows are in milliseconds
  WINDOW_24H: 24 * 60 * 60 * 1000,
  WINDOW_1H: 60 * 60 * 1000,
  RAPID_INFLOW_COUNT: 3, // more than this many stable inflows in small window -> suspicious
  RAPID_INFLOW_WINDOW: 60 * 60 * 1000, // 1 hour
  OUTFLOW_RATIO_THRESHOLD: 0.8, // if outgoing ~80% of recent inflows => higher risk
  BRIDGE_PENALTY: 30, // fixed score penalty for known bridge involvement
  HIGH_VALUE_PENALTY: 40,
  RAPID_INFLOW_PENALTY: 35,
  OUTFLOW_PATTERN_PENALTY: 25,
  MAX_SCORE: 100
};

// --------------------------- KNOWN LISTS (example) ---------------------------
// In production these would be loaded from config/DB/OSINT feeds.
const KNOWN_STABLES = [
  // --- Major Stablecoins ---
  { addr: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", symbol: "USDC", decimals: 6 },
  { addr: "0xdac17f958d2ee523a2206206994597c13d831ec7", symbol: "USDT", decimals: 6 },
  { addr: "0x6b175474e89094c44da98b954eedeac495271d0f", symbol: "DAI", decimals: 18 },

  // --- FRAX ecosystem ---
  { addr: "0x853d955acef822db058eb8505911ed77f175b99e", symbol: "FRAX", decimals: 18 },
  { addr: "0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0", symbol: "FXS", decimals: 18 }, // governance token (optional)

  // --- BUSD (legacy Paxos) ---
  { addr: "0x4fabb145d64652a948d72533023f6e7a623c7c53", symbol: "BUSD", decimals: 18 },

  // --- Liquity USD stable ---
  { addr: "0x5f98805a4e8be255a32880fdec7f6728c6568ba0", symbol: "LUSD", decimals: 18 },

  // --- Pax Dollar (USDP) ---
  { addr: "0x8e870d67f660d95d5be530380d0ec0bd388289e1", symbol: "USDP", decimals: 18 },

  // --- TrueUSD ---
  { addr: "0x0000000000085d4780b73119b644ae5ecd22b376", symbol: "TUSD", decimals: 18 },

  // --- Synthetic USD (sUSD) ---
  { addr: "0x57ab1ec28d129707052df4df418d58a2d46d5f51", symbol: "sUSD", decimals: 18 },

  // --- Gemini Dollar (GUSD) ---
  { addr: "0x056fd409e1d7a124bd7017459dfea2f387b6d5cd", symbol: "GUSD", decimals: 2 },

  // --- PayPal USD (PYUSD) ---
  { addr: "0x6c3ea9036406852006290770bebb3a1e7c638c1d", symbol: "PYUSD", decimals: 6 },

  // --- Curve's crvUSD stablecoin ---
  { addr: "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e", symbol: "crvUSD", decimals: 18 },

  // --- Ethena synthetic USD (USDe) ---
  { addr: "0x4c9edd5852cd905f086c759e8383e09bff1e68b3", symbol: "USDe", decimals: 18 },

  // --- Lybra Finance eUSD ---
  { addr: "0x168e4498ee218becdf565fd250eeba588c56a907", symbol: "eUSD", decimals: 18 }
];


const KNOWN_BRIDGES = new Set<string>([
  // sample
  "0x1111111254fb6c44bac0bed2854e76f90643097d".toLowerCase(), // example : 1inch? (example only)
  // add real bridge addresses here...
]);

// --------------------------- IN-MEMORY STATE (demo) ---------------------------
// For demo / interview this is fine. Production: use time-series DB (Redis/mongo) + TTL.
const walletStore: Map<string, WalletState> = new Map();

/** helper: get or create wallet state */
function getWalletState(addr: string): WalletState {
  const key = addr.toLowerCase();
  let w = walletStore.get(key);
  if (!w) {
    w = {
      stableInEvents: [],
      outgoingEvents: [],
      bridgeEvents: [],
      accumulatedStableIn: BigInt(0),
      accumulatedOutgoing: BigInt(0),
    };
    walletStore.set(key, w);
  }
  return w;
}

/** helper: purge old events outside a window */
function purgeOld(events: TxRecord[], windowMs: number, now = Date.now()) {
  let i = 0;
  while (i < events.length && events[i].ts < now - windowMs) i++;
  if (i > 0) events.splice(0, i);
}

// --------------------------- EXPORTS ---------------------------

export function isKnownBridgeAddress(addr: string): boolean {
  if (!addr) return false;
  return KNOWN_BRIDGES.has(addr.toLowerCase());
}

/**
 * getRecentEvents: returns all recent events for a wallet (for graph/stats)
 */
export function getRecentEvents(wallet: string) {
  const state = walletStore.get(wallet.toLowerCase());
  if (!state) return [];
  // combine all events and sort by timestamp descending
  const allEvents = [
    ...state.stableInEvents,
    ...state.outgoingEvents,
    ...state.bridgeEvents,
  ].sort((a, b) => b.ts - a.ts);
  return allEvents;
}

/**
 * Cache-like object for backward compatibility (for recentEvents.ts)
 */
export const cache = {
  get: (wallet: string) => getRecentEvents(wallet),
};

/**
 * recordStableIn: called when a stablecoin transfer is detected as incoming to `to`.
 * - amount is BigInt (raw token units)
 * - symbol & decimals are optional; if present we assume decimals known (for display)
 */
export function recordStableIn(
  to: string,
  amount: bigint,
  txHash: string,
  ts = Date.now(),
  symbol?: string
) {
  if (!to) return;
  const wallet = getWalletState(to);
  wallet.stableInEvents.push({ hash: txHash, ts, amount, symbol, to });
  wallet.accumulatedStableIn += amount;

  // keep events sorted by ts ascending (push usually ok)
  // purge very old beyond 24h to limit memory
  purgeOld(wallet.stableInEvents, CONFIG.WINDOW_24H, ts);
}

/**
 * recordErcOut: called when an ERC transfer from `from` is detected (outgoing).
 */
export function recordErcOut(from: string, amount: bigint, txHash: string, ts = Date.now()) {
  if (!from) return;
  const wallet = getWalletState(from);
  wallet.outgoingEvents.push({ hash: txHash, ts, amount, from });
  wallet.accumulatedOutgoing += amount;
  purgeOld(wallet.outgoingEvents, CONFIG.WINDOW_24H, ts);
}

/**
 * recordBridgeCall: record a bridge interaction for later scoring.
 */
export function recordBridgeCall(from: string, txHash: string, ts = Date.now(), to?: string, chain?: string) {
  // record for both sides if provided
  if (from) {
    const w = getWalletState(from);
    w.bridgeEvents.push({ hash: txHash, ts, from, to: to, amount: BigInt(0) });
    purgeOld(w.bridgeEvents, CONFIG.WINDOW_24H, ts);
  }
  if (to) {
    const w2 = getWalletState(to);
    w2.bridgeEvents.push({ hash: txHash, ts, from, to, amount: BigInt(0) });
    purgeOld(w2.bridgeEvents, CONFIG.WINDOW_24H, ts);
  }
}

/**
 * computeHeuristicScore: compute dealbreaker heuristic risk score (synchronous).
 * Internal helper used by evaluateWalletRisk.
 */
function computeHeuristicScore(addr: string, now = Date.now()): { riskScore: number; reasons: string[] } {
  const key = (addr || "").toLowerCase();
  const state = walletStore.get(key);
  if (!state) return { riskScore: 0, reasons: [] };

  const reasons: string[] = [];
  let score = 0;

  // purge outside windows for accurate snapshots
  purgeOld(state.stableInEvents, CONFIG.WINDOW_24H, now);
  purgeOld(state.outgoingEvents, CONFIG.WINDOW_24H, now);
  purgeOld(state.bridgeEvents, CONFIG.WINDOW_24H, now);

  // 1) High single stable inflow
  const recentLargeIns = state.stableInEvents.filter(ev => ev.amount >= CONFIG.STABLE_HIGH_VALUE_THRESHOLD);
  if (recentLargeIns.length > 0) {
    score += CONFIG.HIGH_VALUE_PENALTY;
    reasons.push(`High-value stable inflow(s) (${recentLargeIns.length}) in 24h`);
  }

  // 2) Rapid repeated stable inflows in small window
  const windowStart = now - CONFIG.RAPID_INFLOW_WINDOW;
  const rapidIns = state.stableInEvents.filter(ev => ev.ts >= windowStart);
  if (rapidIns.length >= CONFIG.RAPID_INFLOW_COUNT) {
    score += CONFIG.RAPID_INFLOW_PENALTY;
    reasons.push(`Rapid stable inflow burst: ${rapidIns.length} transfers within ${CONFIG.RAPID_INFLOW_WINDOW / 60000}m`);
  }

  // 3) Known bridge involvement
  if (state.bridgeEvents.length > 0) {
    score += CONFIG.BRIDGE_PENALTY;
    reasons.push(`Involved in bridge calls (${state.bridgeEvents.length})`);
  }

  // 4) Outflow pattern: outgoing roughly equals inflows (possible laundering)
  // compute sums in 24h window
  const sumIn24 = state.stableInEvents.reduce((s, e) => s + e.amount, BigInt(0));
  const sumOut24 = state.outgoingEvents.reduce((s, e) => s + e.amount, BigInt(0));
  // avoid division by zero
  if (sumIn24 > BigInt(0)) {
    // compute ratio as float safely
    const ratio = Number(sumOut24) / Number(sumIn24); // OK for demo; switch to bigfloat in prod
    if (ratio >= CONFIG.OUTFLOW_RATIO_THRESHOLD) {
      score += CONFIG.OUTFLOW_PATTERN_PENALTY;
      reasons.push(`High outflow ratio: ${(ratio * 100).toFixed(1)}% of recent stable inflows`);
    }
  }

  // 5) Frequency heuristic: lots of activity small amounts (micropattern) -> suspicious but lower weight
  const txCount24 = state.stableInEvents.length + state.outgoingEvents.length + state.bridgeEvents.length;
  if (txCount24 > 50) {
    score += 8;
    reasons.push(`High transaction count in 24h: ${txCount24}`);
  }

  // 6) Cap and normalize to 0-100
  if (score > CONFIG.MAX_SCORE) score = CONFIG.MAX_SCORE;

  // If no reasons but some small activity -> give small base score (low noise)
  if (reasons.length === 0 && txCount24 > 0) {
    score = Math.min(score + 5, CONFIG.MAX_SCORE);
    reasons.push("Low-level activity detected (no major rules triggered)");
  }

  return { riskScore: Math.round(score), reasons };
}

/**
 * evaluateWalletRisk: async wrapper that combines heuristic scoring with OSINT enrichment.
 * Calls resolveOSINTForAddress to fetch threat intelligence tags and risk boosts,
 * then merges scores and appends OSINT tags as reasons.
 */
export async function evaluateWalletRisk(
  addr: string
): Promise<{ riskScore: number; reasons: string[] }> {
  // Get heuristic score first
  const heuristic = computeHeuristicScore(addr);

  // Fetch OSINT enrichment (may fail gracefully if service unavailable)
  let osintData: { riskBoost: number; tags: string[] } = { riskBoost: 0, tags: [] };
  try {
    osintData = await resolveOSINTForAddress(addr, process.env.MONGO_URI);
  } catch (err) {
    console.warn(`OSINT enrichment failed for ${addr}:`, err);
    // Continue with heuristic score only
  }

  // Combine scores (cap at 100)
  const finalScore = Math.min(100, heuristic.riskScore + osintData.riskBoost);

  // Append OSINT tags as reasons
  const osintReasons = osintData.tags.map((tag) => `OSINT_TAG:${tag}`);

  return {
    riskScore: finalScore,
    reasons: [...heuristic.reasons, ...osintReasons],
  };
}

// --------------------------- SMALL DEMO HARNESS (ESM SAFE) ---------------------------


// Determine if this file is being run directly via: `node dealbreaker.ts`
const isMain =
  import.meta.url === new URL(process.argv[1], "file://" + process.cwd() + "/").href;

if (isMain) {
  (async () => {
    console.log("Demo: Dealbreaker algorithm (ESM)");

    // sample addresses
    const alice = "0xAlice000000000000000000000000000000000000".toLowerCase();
    const bob = "0xbob0000000000000000000000000000000000000".toLowerCase();

    const big = CONFIG.STABLE_HIGH_VALUE_THRESHOLD + BigInt(5000);
    const t0 = Date.now() - 1000 * 60 * 30; // 30m ago

    // Bob: 3 large inflows rapidly
    recordStableIn(bob, big, "tx1", t0, "USDC");
    recordStableIn(bob, big, "tx2", t0 + 1000 * 60 * 5, "USDC");
    recordStableIn(bob, big, "tx3", t0 + 1000 * 60 * 10, "USDC");

    // Bob: 90% out
    const outAmt = (big * BigInt(9)) / BigInt(10);
    recordErcOut(bob, outAmt, "txout1", t0 + 1000 * 60 * 12);

    // Bob: bridge call
    recordBridgeCall(bob, "bridge1", t0 + 1000 * 60 * 15, "0xbridge", "unknown");

    console.log("Bob risk:", evaluateWalletRisk(bob));

    // Alice low activity
    recordStableIn(alice, BigInt(10) * BigInt(10) ** BigInt(6), "txsmall", Date.now() - 1000 * 60 * 60 * 10, "USDC");
    console.log("Alice risk:", evaluateWalletRisk(alice));
  })();
}
