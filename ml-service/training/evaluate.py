"""Model evaluation utilities. All metrics are computed from real predictions - nothing is hardcoded."""
from __future__ import annotations

import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    precision_score,
    recall_score,
)

from training.preprocessing import RISK_LABELS


def classification_metrics(y_true, y_pred, labels=RISK_LABELS) -> dict:
    cm = confusion_matrix(y_true, y_pred, labels=labels)
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision_macro": round(float(precision_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "recall_macro": round(float(recall_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "f1_macro": round(float(f1_score(y_true, y_pred, average="macro", zero_division=0)), 4),
        "f1_weighted": round(float(f1_score(y_true, y_pred, average="weighted", zero_division=0)), 4),
        "labels": list(labels),
        "confusion_matrix": cm.tolist(),
        "per_class": classification_report(y_true, y_pred, labels=labels, output_dict=True, zero_division=0),
    }


def regression_metrics(y_true, y_pred) -> dict:
    return {"mae_days": round(float(mean_absolute_error(y_true, y_pred)), 2)}


def print_report(metrics: dict) -> None:
    print("\n================ EVALUATION (test split) ================")
    print(f"Accuracy          : {metrics['accuracy']:.4f}")
    print(f"Precision (macro) : {metrics['precision_macro']:.4f}")
    print(f"Recall (macro)    : {metrics['recall_macro']:.4f}")
    print(f"F1 (macro)        : {metrics['f1_macro']:.4f}")
    print(f"F1 (weighted)     : {metrics['f1_weighted']:.4f}")
    labels = metrics["labels"]
    print("\nConfusion matrix (rows=true, cols=pred):")
    print(pd.DataFrame(metrics["confusion_matrix"], index=labels, columns=labels).to_string())
    if "regression" in metrics:
        print(f"\nDelay regressor MAE: {metrics['regression']['mae_days']} days")
    print("=========================================================\n")


def evaluate_saved(dataset_path: str | None = None) -> dict:
    """Re-evaluate persisted artifacts on a dataset (defaults to the training CSV)."""
    from app.config import settings
    from app.preprocessing.preprocess import extract_features
    from training.preprocessing import clean_dataset

    df = clean_dataset(pd.read_csv(dataset_path or settings.DATASET_PATH))
    pre = joblib.load(settings.PREPROCESSOR_PATH)
    bundle = joblib.load(settings.MODEL_PATH)
    X = pre.transform(extract_features(df))
    pred = np.asarray(bundle["label_encoder"].inverse_transform(bundle["model"].predict(X)))
    metrics = classification_metrics(df["riskLevel"], pred)
    print_report(metrics)
    return metrics


if __name__ == "__main__":
    evaluate_saved(sys.argv[1] if len(sys.argv) > 1 else None)
