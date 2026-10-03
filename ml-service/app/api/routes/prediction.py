from fastapi import APIRouter

from app.explainability.shap_explainer import shap_explainer
from app.models.predictor import predictor
from app.schemas.prediction_schema import CaseFeatures, PredictionResponse

router = APIRouter(tags=["prediction"])


def run_prediction(case: CaseFeatures) -> dict:
    result = predictor.predict(case.model_dump())
    explanation = shap_explainer.explain(
        predictor.model, result.pop("_X"), predictor.feature_names, result.pop("_classes"),
        result["riskLevel"], result["inputFeatures"],
    )
    return {**result, "features": explanation["features"], "explanation": explanation}


@router.post("/predict", response_model=PredictionResponse)
def predict(case: CaseFeatures):
    return run_prediction(case)
