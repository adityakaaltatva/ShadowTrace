export const predictRisk = async (transaction) => {
  // Mock ML inference
  const { amount, frequency, device_change, location_mismatch } = transaction;

  const riskScore =
    0.5 * (amount / 10000) +
    0.2 * frequency +
    0.2 * (device_change ? 1 : 0) +
    0.1 * (location_mismatch ? 1 : 0);

  let label = "Low";
  if (riskScore > 0.6) label = "High";
  else if (riskScore > 0.3) label = "Medium";

  return { riskScore, label };
};
