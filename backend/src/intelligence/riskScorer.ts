import { WalletProfile } from "../db/schemas/WalletProfile.js";

export interface RiskInput {
  wallet: string;
  sanctions: boolean;
  osintTags: string[];
  anomalyScore?: number;
  clusterScore?: number;
  dealbreakerScore: number;
}

export async function computeRiskScore(input: RiskInput) {
  let score = 0;
  const reasons: string[] = [];

  // 1. Sanctions = automatic high risk
  if (input.sanctions) {
    score += 60;
    reasons.push("sanctioned_entity");
  }

  // 2. OSINT tags
  if (input.osintTags.includes("scammer")) {
    score += 30;
    reasons.push("osint_scam_tag");
  }

  if (input.osintTags.includes("hacked_wallet")) {
    score += 20;
    reasons.push("osint_hacked_tag");
  }

  // 3. ML anomaly signal (Isolation Forest etc.)
  if (input.anomalyScore !== undefined) {
    score += Math.min(input.anomalyScore * 20, 20);
    reasons.push("ml_anomaly");
  }

  // 4. Graph cluster risk
  if (input.clusterScore !== undefined) {
    score += Math.min(input.clusterScore * 15, 15);
    reasons.push("cluster_risk");
  }

  // 5. Dealbreaker score (strongest signal)
  score += input.dealbreakerScore;
  if (input.dealbreakerScore > 0) reasons.push("dealbreaker_chainhop");

  // cap
  if (score > 100) score = 100;

  // Store result in wallet profile
  await WalletProfile.updateOne(
    { wallet: input.wallet },
    {
      $set: {
        risk_seed: score,
      },
      $addToSet: {
        tags: { $each: reasons },
      },
    }
  );

  return { score, reasons };
}
