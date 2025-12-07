import { WalletMetrics } from "./featureExtractor.js";
import { saveAlert } from "../intelligence/alertService.js";

export async function anomalyScore(wallet: string) {
  const metrics = await WalletMetrics.findOne({ wallet } as any).lean();
  if (!metrics) return 0;

  const vector = [
    metrics.tx24h,
    metrics.tx7d,
    metrics.uniquePeers,
    metrics.avgTxValue,
    metrics.maxInflow,
  ];

  // Normalize (simple scaling)
  const scaled = vector.map((v) => Math.min(v / 1000, 1));

  // IsolationForest-like scoring
  const rawScore =
    0.3 * scaled[0] +
    0.25 * scaled[1] +
    0.15 * scaled[2] +
    0.15 * scaled[3] +
    0.15 * scaled[4];

  return Math.round(rawScore * 100);
}

export async function runAnomalyDetection(wallet: string) {
  const score = await anomalyScore(wallet);

  if (score > 70) {
    await saveAlert(wallet, score, ["High ML anomaly score"], []);
  }

  return score;
}
