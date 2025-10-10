import json
from datetime import datetime

def log_prediction(wallet_id, features, label):
    with open("ML/data/prediction_logs.jsonl", "a") as f:
        f.write(json.dumps({
            "wallet_id": wallet_id,
            "timestamp": datetime.now().isoformat(),
            "features": features,
            "label": label
        }) + "\n")
