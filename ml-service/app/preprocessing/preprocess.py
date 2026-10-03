"""
Feature extraction shared by TRAINING and INFERENCE.

Raw case records (as stored in MongoDB / the CSV) are converted into a flat
feature frame. Keeping this in one module guarantees train/serve parity.
"""
from __future__ import annotations

from datetime import date, datetime
from typing import Any, Iterable

import numpy as np
import pandas as pd

NUMERIC_FEATURES = [
    "caseAgeDays",
    "numberOfHearings",
    "numberOfAdjournments",
    "adjournmentRatio",
    "hearingsPerYear",
    "daysSinceLastHearing",
    "daysToNextHearing",
    "numLegalSections",
    "descriptionLength",
]
CATEGORICAL_FEATURES = ["caseType", "court", "state", "currentStage", "status", "priority"]
ALL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES

# Human readable labels used in explanations.
FEATURE_LABELS = {
    "caseAgeDays": "Case age",
    "numberOfHearings": "Number of hearings",
    "numberOfAdjournments": "Number of adjournments",
    "adjournmentRatio": "Adjournment ratio",
    "hearingsPerYear": "Hearing frequency",
    "daysSinceLastHearing": "Gap since last hearing",
    "daysToNextHearing": "Time to next hearing",
    "numLegalSections": "Number of legal sections",
    "descriptionLength": "Description length",
    "caseType": "Case type",
    "court": "Court",
    "state": "State",
    "currentStage": "Current stage",
    "status": "Status",
    "priority": "Priority",
}

CATEGORY_DEFAULT = "Unknown"


def _to_date(value: Any) -> date | None:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    s = str(value).strip()
    if not s or s.lower() in {"nan", "none", "null"}:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).date()
    except ValueError:
        try:
            return pd.to_datetime(s).date()
        except Exception:  # noqa: BLE001
            return None


def _count_sections(value: Any) -> int:
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return 0
    if isinstance(value, (list, tuple)):
        return len([v for v in value if str(v).strip()])
    return len([p for p in str(value).replace(",", ";").split(";") if p.strip()])


def extract_features_row(record: dict, reference: date | None = None) -> dict:
    ref = _to_date(record.get("referenceDate")) or reference or date.today()
    filing = _to_date(record.get("filingDate"))
    last_h = _to_date(record.get("lastHearingDate"))
    next_h = _to_date(record.get("nextHearingDate"))

    age = max(0, (ref - filing).days) if filing else record.get("caseAgeDays")
    age = float(age) if age is not None and not pd.isna(age) else np.nan
    hearings = float(record.get("numberOfHearings") or 0)
    adj = float(record.get("numberOfAdjournments") or 0)

    since_last = float(max(0, (ref - last_h).days)) if last_h else (age if not np.isnan(age) else np.nan)
    to_next = float((next_h - ref).days) if next_h else np.nan

    desc = record.get("description")
    desc = "" if desc is None or (isinstance(desc, float) and np.isnan(desc)) else str(desc)

    def cat(key: str) -> str:
        v = record.get(key)
        if v is None or (isinstance(v, float) and np.isnan(v)) or str(v).strip() == "":
            return CATEGORY_DEFAULT
        return str(v).strip()

    return {
        "caseAgeDays": age,
        "numberOfHearings": hearings,
        "numberOfAdjournments": adj,
        "adjournmentRatio": adj / hearings if hearings > 0 else 0.0,
        "hearingsPerYear": hearings / (age / 365.0) if age and not np.isnan(age) and age > 0 else 0.0,
        "daysSinceLastHearing": since_last,
        "daysToNextHearing": to_next,
        "numLegalSections": float(_count_sections(record.get("legalSections"))),
        "descriptionLength": float(len(desc.split())),
        **{c: cat(c) for c in CATEGORICAL_FEATURES},
    }


def extract_features(records: Iterable[dict] | pd.DataFrame, reference: date | None = None) -> pd.DataFrame:
    if isinstance(records, pd.DataFrame):
        records = records.to_dict(orient="records")
    rows = [extract_features_row(r, reference) for r in records]
    return pd.DataFrame(rows, columns=ALL_FEATURES)


def build_case_text(record: dict) -> str:
    """Text representation of a case used by the similarity retriever."""
    parts = []
    for key in ("caseType", "currentStage", "court", "description", "title"):
        v = record.get(key)
        if v is not None and not (isinstance(v, float) and np.isnan(v)):
            parts.append(str(v))
    sections = record.get("legalSections")
    if isinstance(sections, (list, tuple)):
        parts.append(" ".join(map(str, sections)))
    elif sections is not None and not (isinstance(sections, float) and np.isnan(sections)):
        parts.append(str(sections))
    # Repeat the case type & sections so they weigh more than generic words.
    ct = record.get("caseType")
    if ct:
        parts.append(f"{ct} {ct}")
    return " ".join(parts)
