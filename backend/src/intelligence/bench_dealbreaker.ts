import { performance } from "perf_hooks";

import {
  evaluateWalletRisk,
  recordStableIn,
  recordErcOut,
  recordBridgeCall
} from "../intelligence/dealbreaker.js";   // ✔ FIXED import path

import fs from "fs";

function simulateWalletActivity(wallet: string) {
  for (let i = 0; i < 5; i++) {
    recordStableIn(wallet, BigInt(1000_000000), `tx_in_${i}`, Date.now(), "USDC");
  }
  for (let i = 0; i < 3; i++) {
    recordErcOut(wallet, BigInt(900_000000), `tx_out_${i}`, Date.now());
  }
  recordBridgeCall(wallet, "tx_bridge", Date.now(), "0xBridgeMock");
}

const TEST_SIZES = [10000, 30000, 50000, 100000, 200000];

let csv = "evaluations,time_ms\n";

console.log("Running Dealbreaker benchmark...");

(async () => {
  for (const N of TEST_SIZES) {
    console.log(`\n➡ Benchmarking ${N} evaluations...`);

    const wallets: string[] = [];
    for (let i = 0; i < N; i++) {
      const wallet = "0x" + (i + 1234).toString(16).padStart(40, "0");
      wallets.push(wallet);
      simulateWalletActivity(wallet);
    }

    const t0 = performance.now();
    for (const w of wallets) await evaluateWalletRisk(w);
    const t1 = performance.now();

    const elapsed = t1 - t0;
    console.log(`✔ Completed in ${elapsed.toFixed(2)} ms`);
    csv += `${N},${elapsed.toFixed(2)}\n`;
  }

  fs.writeFileSync("dealbreaker_benchmark.csv", csv);
  console.log("\n📁 CSV saved: dealbreaker_benchmark.csv");
  console.log("➡ Run python to plot efficiency curve:");
  console.log("   python3 plot_curve.py");
})();
