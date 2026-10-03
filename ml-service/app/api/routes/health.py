from fastapi import APIRouter

from app.models.predictor import predictor
from app.models.similarity_model import similarity_service

router = APIRouter(tags=["health"])


@router.get("/health")
def health():
    return {
        "status": "ok" if predictor.ready else "degraded",
        "modelLoaded": predictor.ready,
        "modelVersion": predictor.model_version,
        "similarityReady": similarity_service.ready,
        "historicalCases": similarity_service.historical_count,
    }


@router.get("/model-info")
def model_info():
    """Real evaluation metrics written by training/train.py (no hardcoded values)."""
    return {"modelVersion": predictor.model_version, "modelType": predictor.model_type, "metadata": predictor.metadata}
