import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ---------------------------------------------
# SAMPLE DATA (Replace with your WalletState)
# ---------------------------------------------
# These represent Dealbreaker internal events
now = datetime.now()

sample_wallet_state = {
    "stableInEvents": [
        {"ts": now - timedelta(minutes=30), "amount": 2000000},
        {"ts": now - timedelta(hours=2), "amount": 5000000},
        {"ts": now - timedelta(hours=10), "amount": 12000000},
    ],
    "outgoingEvents": [
        {"ts": now - timedelta(minutes=20), "amount": 3000000},
        {"ts": now - timedelta(hours=5), "amount": 8000000},
    ],
    "bridgeEvents": [
        {"ts": now - timedelta(minutes=40)},
        {"ts": now - timedelta(hours=6)},
    ],
    "osintHits": [
        {"ts": now - timedelta(minutes=15), "tag": "phishing"},
        {"ts": now - timedelta(hours=3), "tag": "scam"},
    ]
}

# ---------------------------------------------
# TIME WINDOWS
# ---------------------------------------------
windows = {
    "1h": now - timedelta(hours=1),
    "6h": now - timedelta(hours=6),
    "24h": now - timedelta(hours=24),
    "7d": now - timedelta(days=7)
}

# ---------------------------------------------
# COUNT EVENTS PER WINDOW
# ---------------------------------------------

def count(events, cutoff):
    return sum(1 for e in events if e["ts"] >= cutoff)

rows = [
    "Stable Inflows",
    "Outflows",
    "Bridge Events",
    "OSINT Alerts"
]

matrix = [
    [count(sample_wallet_state["stableInEvents"], windows["1h"]),
     count(sample_wallet_state["stableInEvents"], windows["6h"]),
     count(sample_wallet_state["stableInEvents"], windows["24h"]),
     count(sample_wallet_state["stableInEvents"], windows["7d"])],

    [count(sample_wallet_state["outgoingEvents"], windows["1h"]),
     count(sample_wallet_state["outgoingEvents"], windows["6h"]),
     count(sample_wallet_state["outgoingEvents"], windows["24h"]),
     count(sample_wallet_state["outgoingEvents"], windows["7d"])],

    [count(sample_wallet_state["bridgeEvents"], windows["1h"]),
     count(sample_wallet_state["bridgeEvents"], windows["6h"]),
     count(sample_wallet_state["bridgeEvents"], windows["24h"]),
     count(sample_wallet_state["bridgeEvents"], windows["7d"])],

    [count(sample_wallet_state["osintHits"], windows["1h"]),
     count(sample_wallet_state["osintHits"], windows["6h"]),
     count(sample_wallet_state["osintHits"], windows["24h"]),
     count(sample_wallet_state["osintHits"], windows["7d"])]
]

df = pd.DataFrame(matrix, index=rows, columns=["1h", "6h", "24h", "7d"])

# ---------------------------------------------
# GENERATE HEATMAP
# ---------------------------------------------
plt.figure(figsize=(10, 6))
sns.heatmap(df, annot=True, cmap="Reds", linewidths=.5)

plt.title("ShadowTrace Risk Heatmap (Based on Dealbreaker Internal State)")
plt.xlabel("Time Window")
plt.ylabel("Risk Vector")

plt.tight_layout()
plt.savefig("shadowtrace_heatmap.png", dpi=300)
plt.show()

print("Heatmap saved as shadowtrace_heatmap.png")
