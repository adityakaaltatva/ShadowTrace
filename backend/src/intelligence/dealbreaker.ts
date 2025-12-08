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
  stableInEvents: TxRecord[];
  outgoingEvents: TxRecord[];
  bridgeEvents: TxRecord[];
  accumulatedStableIn: bigint;
  accumulatedOutgoing: bigint;
};

const CONFIG = {
  STABLE_HIGH_VALUE_THRESHOLD: BigInt(1000) * BigInt(10) ** BigInt(6),
  WINDOW_24H: 24 * 60 * 60 * 1000,
  WINDOW_1H: 60 * 60 * 1000,
  RAPID_INFLOW_COUNT: 3, 
  RAPID_INFLOW_WINDOW: 60 * 60 * 1000,
  OUTFLOW_RATIO_THRESHOLD: 0.8,
  BRIDGE_PENALTY: 30,
  HIGH_VALUE_PENALTY: 40,
  RAPID_INFLOW_PENALTY: 35,
  OUTFLOW_PATTERN_PENALTY: 25,
  MAX_SCORE: 100
};

const KNOWN_STABLES = [
  { addr: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", symbol: "USDC", decimals: 6 },
  { addr: "0xdac17f958d2ee523a2206206994597c13d831ec7", symbol: "USDT", decimals: 6 },
  { addr: "0x6b175474e89094c44da98b954eedeac495271d0f", symbol: "DAI", decimals: 18 },
  { addr: "0x853d955acef822db058eb8505911ed77f175b99e", symbol: "FRAX", decimals: 18 },
  { addr: "0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0", symbol: "FXS", decimals: 18 },
  { addr: "0x4fabb145d64652a948d72533023f6e7a623c7c53", symbol: "BUSD", decimals: 18 },
  { addr: "0x5f98805a4e8be255a32880fdec7f6728c6568ba0", symbol: "LUSD", decimals: 18 },
  { addr: "0x8e870d67f660d95d5be530380d0ec0bd388289e1", symbol: "USDP", decimals: 18 },
  { addr: "0x0000000000085d4780b73119b644ae5ecd22b376", symbol: "TUSD", decimals: 18 },
  { addr: "0x57ab1ec28d129707052df4df418d58a2d46d5f51", symbol: "sUSD", decimals: 18 },
  { addr: "0x056fd409e1d7a124bd7017459dfea2f387b6d5cd", symbol: "GUSD", decimals: 2 },
  { addr: "0x6c3ea9036406852006290770bebb3a1e7c638c1d", symbol: "PYUSD", decimals: 6 },
  { addr: "0xf939e0a03fb07f59a73314e73794be0e57ac1b4e", symbol: "crvUSD", decimals: 18 },
  { addr: "0x4c9edd5852cd905f086c759e8383e09bff1e68b3", symbol: "USDe", decimals: 18 },
  { addr: "0x168e4498ee218becdf565fd250eeba588c56a907", symbol: "eUSD", decimals: 18 }
];

const KNOWN_BRIDGES = new Set<string>([
  "0x8731d54e9d02c286767d56ac03e8037c07e01e98",
  "0xafc0e0adf0e1f2a4079dfd1a92fa1862f33e1e2c",
  "0x401f6c983ea34274ec46f84d70b31c151321188b",
  "0xa0ed0d811d59e480e3cccb8d686d8f79f9e2a1c3",
  "0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f",
  "0x1c479675ad559dc151b4a7e1cfa33c6c8b1fabcdef",
  "0x25ace71c97b33cc4729cf772ae268934f7ab5fa1",
  "0x99c9fc46f92e8a1c0dec1b1747d010903e884be1",
  "0x1908e2bf4a88f91e9e4bccc8e8a3dd059cbf03b0",
  "0x32400084c286cf3e17e7b677ea9583e60a000324",
  "0xb8901acb165ed027e32754e0ffe830802919727f",
  "0x914c35c0b203f9c8efb0e4dd15189c13ad2451e2",
  "0x5d3fd4d874b64b1a71adabf643b2b8f401ef86a1",
  "0x8898b472c54c31894e3b9bb83c3bc2a55c2af2ad",
  "0x5427fefa711eff984124bfbb1ab6fbf5e3da1820",
  "0x636af16bf2f682d060823b9a58591c6d384457d0",
  "0x10a99f4c2cb74c3ce00c8e531bd76dbb7279f2c5",
  "0x069cb7eaed4fed938bb3393dfb10adf8a0b1a0c0",
  "0x3ee18b2214aff97000d974cf647e7c347e8fa585",
  "0x98a5737749490856b401db5dc27f522fc314a4e1",
  "0xf951e335afb289353dc249e82926178eac7ded78",
  "0x2796317b0ff8538f253012862c06787adfb8ceb6",
  "0x6c6bc977e13df9b0de53b251522280bb72383700",
  "0xd00ae08403b9bbb9124bb305c09058e32cc39a56",
  "0x8f8a8b84a0d5d8bcee66216c0da8ceab89cb40e4",
  "0x5e5fdb0a41d5b0d6cf6bb6ba34fa8ac5e60f06b1",
  "0x65f2aa291e0a97e06fb0fe3fae5a2db16c0e19b6",
  "0x0fc3657899693648bba4dbd2d5d73f39e4f72822",
]);

const walletStore: Map<string, WalletState> = new Map();

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

function purgeOld(events: TxRecord[], windowMs: number, now = Date.now()) {
  let i = 0;
  while (i < events.length && events[i].ts < now - windowMs) i++;
  if (i > 0) events.splice(0, i);
}

export function isKnownBridgeAddress(addr: string): boolean {
  if (!addr) return false;
  return KNOWN_BRIDGES.has(addr.toLowerCase());
}

export function getRecentEvents(wallet: string) {
  const state = walletStore.get(wallet.toLowerCase());
  if (!state) return [];
  const allEvents = [
    ...state.stableInEvents,
    ...state.outgoingEvents,
    ...state.bridgeEvents,
  ].sort((a, b) => b.ts - a.ts);
  return allEvents;
}

export const cache = {
  get: (wallet: string) => getRecentEvents(wallet),
};

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
  purgeOld(wallet.stableInEvents, CONFIG.WINDOW_24H, ts);
}

export function recordErcOut(from: string, amount: bigint, txHash: string, ts = Date.now()) {
  if (!from) return;
  const wallet = getWalletState(from);
  wallet.outgoingEvents.push({ hash: txHash, ts, amount, from });
  wallet.accumulatedOutgoing += amount;
  purgeOld(wallet.outgoingEvents, CONFIG.WINDOW_24H, ts);
}

export function recordBridgeCall(from: string, txHash: string, ts = Date.now(), to?: string, chain?: string) {
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
 * Compute heuristic risk score (synchronous).
 */
function computeHeuristicScore(addr: string, now = Date.now()): { riskScore: number; reasons: string[] } {
  const key = (addr || "").toLowerCase();
  const state = walletStore.get(key);
  if (!state) return { riskScore: 0, reasons: [] };

  const reasons: string[] = [];
  let score = 0;

  purgeOld(state.stableInEvents, CONFIG.WINDOW_24H, now);
  purgeOld(state.outgoingEvents, CONFIG.WINDOW_24H, now);
  purgeOld(state.bridgeEvents, CONFIG.WINDOW_24H, now);

  const recentLargeIns = state.stableInEvents.filter(ev => ev.amount >= CONFIG.STABLE_HIGH_VALUE_THRESHOLD);
  if (recentLargeIns.length > 0) {
    score += CONFIG.HIGH_VALUE_PENALTY;
    reasons.push(`High-value stable inflow(s) (${recentLargeIns.length}) in 24h`);
  }

  const windowStart = now - CONFIG.RAPID_INFLOW_WINDOW;
  const rapidIns = state.stableInEvents.filter(ev => ev.ts >= windowStart);
  if (rapidIns.length >= CONFIG.RAPID_INFLOW_COUNT) {
    score += CONFIG.RAPID_INFLOW_PENALTY;
    reasons.push(`Rapid stable inflow burst: ${rapidIns.length} transfers within ${CONFIG.RAPID_INFLOW_WINDOW / 60000}m`);
  }

  if (state.bridgeEvents.length > 0) {
    score += CONFIG.BRIDGE_PENALTY;
    reasons.push(`Involved in bridge calls (${state.bridgeEvents.length})`);
  }

  const sumIn24 = state.stableInEvents.reduce((s, e) => s + e.amount, BigInt(0));
  const sumOut24 = state.outgoingEvents.reduce((s, e) => s + e.amount, BigInt(0));
  if (sumIn24 > BigInt(0)) {
    const ratio = Number(sumOut24) / Number(sumIn24);
    if (ratio >= CONFIG.OUTFLOW_RATIO_THRESHOLD) {
      score += CONFIG.OUTFLOW_PATTERN_PENALTY;
      reasons.push(`High outflow ratio: ${(ratio * 100).toFixed(1)}% of recent stable inflows`);
    }
  }

  const txCount24 = state.stableInEvents.length + state.outgoingEvents.length + state.bridgeEvents.length;
  if (txCount24 > 50) {
    score += 8;
    reasons.push(`High transaction count in 24h: ${txCount24}`);
  }

  if (score > CONFIG.MAX_SCORE) score = CONFIG.MAX_SCORE;

  if (reasons.length === 0 && txCount24 > 0) {
    score = Math.min(score + 5, CONFIG.MAX_SCORE);
    reasons.push("Low-level activity detected (no major rules triggered)");
  }

  return { riskScore: Math.round(score), reasons };
}

/**
 * Async wrapper combining heuristic scoring with OSINT enrichment.
 */
export async function evaluateWalletRisk(
  addr: string
): Promise<{ riskScore: number; reasons: string[] }> {
  const heuristic = computeHeuristicScore(addr);

  let osintData: { riskBoost: number; tags: string[] } = { riskBoost: 0, tags: [] };
  try {
    osintData = await resolveOSINTForAddress(addr, process.env.MONGO_URI);
  } catch (err) {
    console.warn(`OSINT enrichment failed for ${addr}:`, err);
  }

  const finalScore = Math.min(100, heuristic.riskScore + osintData.riskBoost);
  const osintReasons = osintData.tags.map((tag) => `OSINT_TAG:${tag}`);

  return {
    riskScore: finalScore,
    reasons: [...heuristic.reasons, ...osintReasons],
  };
}

// Demo harness
const isMain =
  import.meta.url === new URL(process.argv[1], "file://" + process.cwd() + "/").href;

if (isMain) {
  (async () => {
    console.log("Demo: Dealbreaker algorithm (ESM)");

    const alice = "0xAlice000000000000000000000000000000000000".toLowerCase();
    const bob = "0xbob0000000000000000000000000000000000000".toLowerCase();

    const big = CONFIG.STABLE_HIGH_VALUE_THRESHOLD + BigInt(5000);
    const t0 = Date.now() - 1000 * 60 * 30;

    recordStableIn(bob, big, "tx1", t0, "USDC");
    recordStableIn(bob, big, "tx2", t0 + 1000 * 60 * 5, "USDC");
    recordStableIn(bob, big, "tx3", t0 + 1000 * 60 * 10, "USDC");

    const outAmt = (big * BigInt(9)) / BigInt(10);
    recordErcOut(bob, outAmt, "txout1", t0 + 1000 * 60 * 12);

    recordBridgeCall(bob, "bridge1", t0 + 1000 * 60 * 15, "0xbridge", "unknown");

    console.log("Bob risk:", evaluateWalletRisk(bob));

    recordStableIn(alice, BigInt(10) * BigInt(10) ** BigInt(6), "txsmall", Date.now() - 1000 * 60 * 60 * 10, "USDC");
    console.log("Alice risk:", evaluateWalletRisk(alice));
  })();
}
