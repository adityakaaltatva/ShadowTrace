import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix
 
def train_shadowtrace_model():
    df = pd.read_csv("ML/data/features.csv")

    df = df.drop(columns=["transaction_id", "user_id"], errors="ignore")

    X = df.drop(columns=["label"])
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(n_estimators=200, random_state=42))
    ])

    # Train
    pipeline.fit(X_train, y_train)

    # Evaluate
    y_pred = pipeline.predict(X_test)
    print("\n Model Training Complete.")
    print("\n Classification Report:\n", classification_report(y_test, y_pred))
    print("\n Confusion Matrix:\n", confusion_matrix(y_test, y_pred))

    # Save model
    os.makedirs("ML/models", exist_ok=True)
    model_path = "ML/models/shadowtrace_model.pkl"
    joblib.dump(pipeline, model_path)
    print(f"\n Model saved at: {model_path}")

if __name__ == "__main__":
    train_shadowtrace_model()
