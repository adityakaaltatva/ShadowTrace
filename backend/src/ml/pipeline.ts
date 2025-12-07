import { computeMetricsFor } from "./featureExtractor.js";
import { runAnomalyDetection } from "./anomalyEngine.js";

export async function evaluateWallet(wallet: string) {
  const metrics = await computeMetricsFor(wallet);
  const score = await runAnomalyDetection(wallet);
  
  return { metrics, score };
}
