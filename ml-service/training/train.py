"""
NyayaAI training pipeline.

Steps: load -> validate -> clean -> feature extraction (missing values handled
by imputers) -> encode categoricals / scale numerics -> stratified split ->
train classifier (XGBoost by default) + delay regressor -> evaluate -> persist.

Run from the ml-service/ directory:
    python -m training.train                       # XGBoost (default)
    python -m training.train --model random_forest # baseline comparison
    python -m training.train --data path/to/real_dataset.csv

NOTE: the bundled dataset is SYNTHETIC (see data/sample/README.md). Metrics on
synthetic data say nothing about real-world judicial performance.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier, XGBRegressor

from app.config import settings
from app.preprocessing.preprocess import ALL_FEATURES, build_case_text
from app.retrieval.case_retriever import TfidfCaseRetriever
from training.evaluate import classification_metrics, print_report, regression_metrics
from training.preprocessing import (
    RISK_LABELS,
    build_preprocessor,
    clean_dataset,
    make_feature_frame,
    validate_dataset,
)

MODEL_VERSIONS = {"xgboost": "xgb-v1", "random_forest": "rf-v1"}


def build_models(kind: str, seed: int):
    if kind == "xgboost":
        clf = XGBClassifier(
            n_estimators=300, max_depth=5, learning_rate=0.06, subsample=0.9,
            colsample_bytree=0.9, objective="multi:softprob", eval_metric="mlogloss",
            random_state=seed, n_jobs=-1,
        )
        reg = XGBRegressor(n_estimators=300, max_depth=5, learning_rate=0.06, subsample=0.9,
                           random_state=seed, n_jobs=-1)
    elif kind == "random_forest":
        clf = RandomForestClassifier(n_estimators=300, max_depth=12, random_state=seed, n_jobs=-1)
        reg = RandomForestRegressor(n_estimators=300, max_depth=12, random_state=seed, n_jobs=-1)
    else:
        raise ValueError(f"Unsupported model type: {kind}")
    return clf, reg


def train(data_path: str | None = None, model_kind: str = "xgboost", seed: int = 42, test_size: float = 0.2) -> dict:
    data_path = str(data_path or settings.DATASET_PATH)
    print(f"[load] {data_path}")
    raw = pd.read_csv(data_path)
    validate_dataset(raw)
    df = clean_dataset(raw)

    X_raw = make_feature_frame(df)
    y = df["riskLevel"].values
    label_encoder = LabelEncoder().fit(RISK_LABELS)
    y_enc = label_encoder.transform(y)
    has_delay = "delayDays" in df.columns and df["delayDays"].notna().all()
    delay = df["delayDays"].values if has_delay else None

    idx = np.arange(len(df))
    tr_idx, te_idx = train_test_split(idx, test_size=test_size, random_state=seed, stratify=y_enc)

    preprocessor = build_preprocessor()
    X_tr = preprocessor.fit_transform(X_raw.iloc[tr_idx])
    X_te = preprocessor.transform(X_raw.iloc[te_idx])
    feature_names = list(preprocessor.get_feature_names_out())

    clf, reg = build_models(model_kind, seed)
    print(f"[train] {model_kind} classifier on {len(tr_idx)} rows, {X_tr.shape[1]} encoded features")
    clf.fit(X_tr, y_enc[tr_idx])

    pred_te = label_encoder.inverse_transform(clf.predict(X_te))
    metrics = classification_metrics(y[te_idx], pred_te)

    if has_delay:
        reg.fit(X_tr, np.log1p(delay[tr_idx]))
        reg_pred = np.expm1(reg.predict(X_te))
        metrics["regression"] = regression_metrics(delay[te_idx], reg_pred)
    else:
        reg = None
    print_report(metrics)

    # ---------- persistence ----------
    for p in (settings.MODEL_PATH, settings.PREPROCESSOR_PATH, settings.SIMILARITY_MODEL_PATH):
        p.parent.mkdir(parents=True, exist_ok=True)
    version = MODEL_VERSIONS[model_kind]
    joblib.dump({"model": clf, "label_encoder": label_encoder, "model_type": model_kind,
                 "model_version": version, "feature_names": feature_names}, settings.MODEL_PATH)
    joblib.dump(preprocessor, settings.PREPROCESSOR_PATH)
    if reg is not None:
        joblib.dump({"model": reg, "target": "log1p(delayDays)"}, settings.REGRESSOR_PATH)

    # Similarity vectorizer fitted on the case text corpus.
    corpus = [build_case_text(r) for r in df.to_dict(orient="records")]
    retriever = TfidfCaseRetriever()
    retriever.fit_vectorizer(corpus)
    joblib.dump(retriever.vectorizer, settings.SIMILARITY_MODEL_PATH)

    metadata = {
        "modelVersion": version,
        "modelType": model_kind,
        "trainedAt": datetime.now(timezone.utc).isoformat(),
        "dataset": str(data_path),
        "datasetIsSynthetic": "sample" in str(data_path).replace("\\", "/"),
        "rows": int(len(df)),
        "trainRows": int(len(tr_idx)),
        "testRows": int(len(te_idx)),
        "rawFeatures": ALL_FEATURES,
        "encodedFeatureCount": len(feature_names),
        "classDistribution": {k: int(v) for k, v in pd.Series(y).value_counts().items()},
        "metrics": {k: v for k, v in metrics.items() if k != "per_class"},
    }
    settings.METADATA_PATH.write_text(json.dumps(metadata, indent=2))
    print(f"[save] model -> {settings.MODEL_PATH}")
    print(f"[save] preprocessor -> {settings.PREPROCESSOR_PATH}")
    print(f"[save] similarity vectorizer -> {settings.SIMILARITY_MODEL_PATH}")
    print(f"[save] metadata -> {settings.METADATA_PATH}")
    return metadata


def main():
    parser = argparse.ArgumentParser(description="Train NyayaAI delay-risk models")
    parser.add_argument("--data", default=None)
    parser.add_argument("--model", default="xgboost", choices=list(MODEL_VERSIONS))
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--test-size", type=float, default=0.2)
    args = parser.parse_args()
    train(args.data, args.model, args.seed, args.test_size)


if __name__ == "__main__":
    main()
