from fastapi import APIRouter

from app.models.similarity_model import similarity_service
from app.schemas.prediction_schema import SimilarRequest, SimilarResponse

router = APIRouter(tags=["similarity"])


@router.post("/similar", response_model=SimilarResponse)
def similar(req: SimilarRequest):
    return similarity_service.search(req.query.model_dump(), req.candidates, req.topK, req.includeHistorical)
