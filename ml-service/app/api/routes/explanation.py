from fastapi import APIRouter

from app.api.routes.prediction import run_prediction
from app.schemas.prediction_schema import CaseFeatures, Explanation

router = APIRouter(tags=["explanation"])


@router.post("/explain", response_model=Explanation)
def explain(case: CaseFeatures):
    return run_prediction(case)["explanation"]
