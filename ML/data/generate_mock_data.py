import pandas as pd
import numpy as np
import os

def generate_mock_dataset():
    np.random.seed(42)
    num_samples = 1000

    df = pd.DataFrame({
        "transaction_id": [f"tx_{i}" for i in range(num_samples)],
        "user_id": np.random.randint(1000, 2000, num_samples),
        "device_fingerprint_score": np.random.rand(num_samples),
        "geo_distance_km": np.random.uniform(0, 5000, num_samples),
        "transaction_amount": np.random.uniform(10, 10000, num_samples),
        "velocity_score": np.random.rand(num_samples),
        "ip_risk_score": np.random.rand(num_samples)
    })

    # Create synthetic risk score
    risk_score = (
        0.3 * df["device_fingerprint_score"]
        + 0.2 * (df["geo_distance_km"] / 5000)
        + 0.3 * (df["transaction_amount"] / 10000)
        + 0.1 * df["velocity_score"]
        + 0.1 * df["ip_risk_score"]
    )

    # Assign categorical labels (Low / Medium / High risk)
    df["label"] = np.select(
        [
            risk_score < 0.3,
            (risk_score >= 0.3) & (risk_score < 0.6),
            risk_score >= 0.6,
        ],
        ["Low", "Medium", "High"],
        default="Low",  # ✅ ensure consistent dtype (string)
    )

    os.makedirs("ML/data", exist_ok=True)
    output_path = "ML/data/features.csv"
    df.to_csv(output_path, index=False)
    print(f"✅ Mock dataset generated at: {output_path}")

if __name__ == "__main__":
    generate_mock_dataset()
