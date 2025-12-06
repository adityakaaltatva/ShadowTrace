from flask import Flask, request, jsonify  # type: ignore
from sklearn.ensemble import IsolationForest  # type: ignore
import numpy as np  # type: ignore

app = Flask(__name__)
model = IsolationForest(contamination=0.02)

@app.route("/score", methods=["POST"])
def score():
    data = request.json["features"]
    X = np.array([data])
    s = model.decision_function(X)[0]
    return jsonify({"score": float(s)})

if __name__ == "__main__":
    app.run(port=5001)
