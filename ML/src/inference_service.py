from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI(title="ShadowTrace ML Inference API", version="1.0")

model = joblib.load("ML/models/shadowtrace_model.pkl")

class WalletFeatures(BaseModel):
    num_in_tx: float
    num_out_tx: float
    total_received_eth: float
    total_sent_eth: float
    unique_incoming: float
    unique_outgoing: float
    mixer_flag: int
    sanction_flag: int
    osint_confidence: float
    bridge_interactions: float

@app.post("/predict")
def predict_risk(data: WalletFeatures):
    features = np.array([[data.num_in_tx, data.num_out_tx, data.total_received_eth,
                          data.total_sent_eth, data.unique_incoming, data.unique_outgoing,
                          data.mixer_flag, data.sanction_flag, data.osint_confidence,
                          data.bridge_interactions]])
    proba = model.predict_proba(features)[0]
    label = model.predict(features)[0]
    return {
        "risk_label": str(label),
        "probabilities": {
            "Low": float(proba[0]),
            "Medium": float(proba[1]),
            "High": float(proba[2]) if len(proba) > 2 else 0
        }
    }
