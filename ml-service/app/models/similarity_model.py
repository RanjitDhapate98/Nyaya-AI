"""Similarity service: wraps a retriever, the persisted vectorizer and the historical corpus."""
from __future__ import annotations

import logging

import joblib
import numpy as np
import pandas as pd

from app.config import settings
from app.preprocessing.preprocess import build_case_text
from app.retrieval.case_retriever import RetrievalDoc, create_retriever

logger = logging.getLogger(__name__)


class SimilarityService:
    def __init__(self):
        self.vectorizer = None
        self.historical = None
        self.historical_count = 0

    @property
    def ready(self) -> bool:
        return self.vectorizer is not None

    def load(self) -> None:
        try:
            self.vectorizer = joblib.load(settings.SIMILARITY_MODEL_PATH)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Similarity vectorizer unavailable (%s); will fit on the fly.", exc)
            self.vectorizer = None
        if settings.INCLUDE_HISTORICAL_CORPUS and settings.DATASET_PATH.exists():
            df = pd.read_csv(settings.DATASET_PATH).replace({np.nan: None})
            docs = []
            for r in df.to_dict(orient="records"):
                docs.append(RetrievalDoc(
                    id=f"hist:{r.get('caseNumber')}",
                    text=build_case_text(r),
                    metadata={
                        "source": "historical-sample",
                        "caseNumber": r.get("caseNumber"),
                        "title": r.get("title"),
                        "caseType": r.get("caseType"),
                        "court": r.get("court"),
                        "state": r.get("state"),
                        "currentStage": r.get("currentStage"),
                        "status": r.get("status"),
                        "riskLevel": r.get("riskLevel"),
                        "delayDays": r.get("delayDays"),
                        "legalSections": r.get("legalSections"),
                    },
                ))
            self.historical = create_retriever(settings.RETRIEVER_BACKEND, self.vectorizer)
            self.historical.index(docs)
            self.vectorizer = getattr(self.historical, "vectorizer", self.vectorizer)
            self.historical_count = len(docs)
            logger.info("Indexed %d historical (synthetic sample) cases", len(docs))

    def _explain_match(self, query: dict, meta: dict, query_text: str, doc_text: str) -> str:
        reasons = []
        if query.get("caseType") and query.get("caseType") == meta.get("caseType"):
            reasons.append(f"same case type ({meta['caseType']})")
        if query.get("currentStage") and query.get("currentStage") == meta.get("currentStage"):
            reasons.append(f"same stage ({meta['currentStage']})")
        if query.get("court") and query.get("court") == meta.get("court"):
            reasons.append("same court level")
        if self.vectorizer is not None:
            vocab = self.vectorizer.build_analyzer()
            shared = [t for t in dict.fromkeys(vocab(query_text)) if " " not in t and t in set(vocab(doc_text))]
            shared = [t for t in shared if len(t) > 3][:5]
            if shared:
                reasons.append("shared terms: " + ", ".join(shared))
        return "; ".join(reasons) or "textual similarity of description and sections"

    def search(self, query: dict, candidates: list[dict], top_k: int = 5, include_historical: bool = True) -> dict:
        query_text = build_case_text(query)
        query_id = str(query.get("id") or query.get("_id") or "")
        results = []

        if candidates:
            docs = [RetrievalDoc(id=str(c.get("id") or c.get("_id")), text=build_case_text(c),
                                 metadata={**{k: v for k, v in c.items() if k not in ("description",)}, "source": "database"})
                    for c in candidates]
            r = create_retriever(settings.RETRIEVER_BACKEND, self.vectorizer)
            r.index(docs)
            for d, s in r.search(query_text, k=top_k, exclude_ids={query_id}):
                results.append((d, s))

        if include_historical and self.historical is not None:
            for d, s in self.historical.search(query_text, k=top_k):
                results.append((d, s))

        results.sort(key=lambda x: x[1], reverse=True)
        out = []
        for d, s in results[:top_k]:
            if s <= 0:
                continue
            m = d.metadata
            out.append({
                "caseId": d.id if m.get("source") == "database" else None,
                "referenceId": d.id,
                "source": m.get("source"),
                "caseNumber": m.get("caseNumber"),
                "title": m.get("title"),
                "caseType": m.get("caseType"),
                "court": m.get("court"),
                "state": m.get("state"),
                "currentStage": m.get("currentStage"),
                "status": m.get("status"),
                "riskLevel": m.get("riskLevel"),
                "delayDays": m.get("delayDays"),
                "similarityScore": round(float(s), 4),
                "explanation": self._explain_match(query, m, query_text, d.text),
            })
        return {
            "method": getattr(self.historical, "name", "tfidf-cosine") if self.historical else "tfidf-cosine",
            "results": out,
        }


similarity_service = SimilarityService()
