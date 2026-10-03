"""
Similar-case retrieval abstraction.

`BaseCaseRetriever` defines the contract every backend must satisfy:
    index(docs)          -> build/replace an index of candidate documents
    search(text, k, ...) -> ranked [(doc, score)]

`TfidfCaseRetriever` is the default local implementation (TF-IDF + cosine).
To move to embeddings/vector DB later, implement e.g. `SentenceTransformerRetriever`
or `FaissRetriever` with the same two methods and register it in
`create_retriever()` - the API routes and the Node backend do not change.
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


@dataclass
class RetrievalDoc:
    id: str
    text: str
    metadata: dict[str, Any] = field(default_factory=dict)


class BaseCaseRetriever(ABC):
    name = "base"

    @abstractmethod
    def index(self, docs: list[RetrievalDoc]) -> None: ...

    @abstractmethod
    def search(self, text: str, k: int = 5, exclude_ids: set[str] | None = None) -> list[tuple[RetrievalDoc, float]]: ...


class TfidfCaseRetriever(BaseCaseRetriever):
    name = "tfidf-cosine"

    def __init__(self, vectorizer: TfidfVectorizer | None = None):
        self.vectorizer = vectorizer
        self._docs: list[RetrievalDoc] = []
        self._matrix = None

    @staticmethod
    def new_vectorizer() -> TfidfVectorizer:
        return TfidfVectorizer(
            lowercase=True, ngram_range=(1, 2), min_df=1, max_features=20000,
            stop_words="english", sublinear_tf=True,
        )

    def fit_vectorizer(self, corpus: list[str]) -> None:
        self.vectorizer = self.new_vectorizer().fit(corpus)

    def index(self, docs: list[RetrievalDoc]) -> None:
        if self.vectorizer is None:
            self.fit_vectorizer([d.text for d in docs] or ["empty"])
        self._docs = list(docs)
        self._matrix = self.vectorizer.transform([d.text for d in docs]) if docs else None

    def score(self, text: str, docs: list[RetrievalDoc]) -> np.ndarray:
        if not docs:
            return np.array([])
        q = self.vectorizer.transform([text])
        m = self.vectorizer.transform([d.text for d in docs])
        return cosine_similarity(q, m).ravel()

    def search(self, text, k=5, exclude_ids=None):
        if self._matrix is None or not self._docs:
            return []
        exclude_ids = exclude_ids or set()
        q = self.vectorizer.transform([text])
        scores = cosine_similarity(q, self._matrix).ravel()
        order = np.argsort(-scores)
        out = []
        for i in order:
            d = self._docs[i]
            if d.id in exclude_ids:
                continue
            out.append((d, float(scores[i])))
            if len(out) >= k:
                break
        return out


def create_retriever(backend: str, vectorizer=None) -> BaseCaseRetriever:
    backend = (backend or "tfidf").lower()
    if backend == "tfidf":
        return TfidfCaseRetriever(vectorizer)
    # Placeholder hook for future backends, kept explicit rather than silently falling back.
    raise ValueError(
        f"Retriever backend '{backend}' is not installed. Available: 'tfidf'. "
        "Implement BaseCaseRetriever for sentence-transformers/FAISS and register it here."
    )
