"""Training-side preprocessing: dataset validation, cleaning and the sklearn preprocessing pipeline."""
from __future__ import annotations

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler

from app.preprocessing.preprocess import CATEGORICAL_FEATURES, NUMERIC_FEATURES, extract_features

REQUIRED_COLUMNS = [
    "caseType", "court", "state", "currentStage", "status", "priority",
    "filingDate", "numberOfHearings", "numberOfAdjournments", "riskLevel",
]
RISK_LABELS = ["LOW", "MEDIUM", "HIGH"]


class DatasetValidationError(ValueError):
    pass


def validate_dataset(df: pd.DataFrame) -> None:
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise DatasetValidationError(f"Dataset missing required columns: {missing}")
    if len(df) < 50:
        raise DatasetValidationError(f"Dataset too small ({len(df)} rows); need at least 50.")
    bad = set(df["riskLevel"].dropna().astype(str).str.upper()) - set(RISK_LABELS)
    if bad:
        raise DatasetValidationError(f"Unknown riskLevel values: {bad}")


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    before = len(df)
    df = df.drop_duplicates(subset=["caseNumber"] if "caseNumber" in df.columns else None)
    df = df.dropna(subset=["riskLevel", "filingDate"])
    df["riskLevel"] = df["riskLevel"].astype(str).str.upper().str.strip()
    for col in ("numberOfHearings", "numberOfAdjournments"):
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).clip(lower=0)
    # Adjournments cannot exceed hearings.
    df["numberOfAdjournments"] = df[["numberOfAdjournments", "numberOfHearings"]].min(axis=1)
    if "delayDays" in df.columns:
        df["delayDays"] = pd.to_numeric(df["delayDays"], errors="coerce")
    for col in ("description", "legalSections", "district"):
        if col in df.columns:
            df[col] = df[col].fillna("")
    print(f"[clean] rows: {before} -> {len(df)}")
    return df.reset_index(drop=True)


def build_preprocessor() -> ColumnTransformer:
    numeric = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    categorical = Pipeline([
        ("imputer", SimpleImputer(strategy="constant", fill_value="Unknown")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    return ColumnTransformer([
        ("num", numeric, NUMERIC_FEATURES),
        ("cat", categorical, CATEGORICAL_FEATURES),
    ])


def make_feature_frame(df: pd.DataFrame) -> pd.DataFrame:
    return extract_features(df)
