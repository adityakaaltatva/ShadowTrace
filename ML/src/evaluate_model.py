import pandas as pd
import joblib
from sklearn.metrics import classification_report, confusion_matrix

def evaluate_model():
    model = joblib.load("ML/models/shadowtrace_model.pkl")
    df = pd.read_csv("ML/data/features.csv")
    X = df.drop(columns=['label'])
    y = df['label']
    preds = model.predict(X)
    print("\n=== Evaluation Report ===")
    print(classification_report(y, preds))
    print(confusion_matrix(y, preds))

if __name__ == "__main__":
    evaluate_model()
