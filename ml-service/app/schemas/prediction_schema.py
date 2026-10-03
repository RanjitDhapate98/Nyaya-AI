"""Pydantic request/response schemas for the ML API."""
from __future__ import annotations

from typing import Any, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CaseFeatures(BaseModel):
    """Raw case fields. Derived features (age, gaps, ratios) are computed server-side."""
    model_config = ConfigDict(extra="allow")

    id: Optional[str] = None
    caseNumber: Optional[str] = None
    title: Optional[str] = None
    court: str = Field(..., min_length=1)
    state: str = Field(..., min_length=1)
    district: Optional[str] = None
    caseType: str = Field(..., min_length=1)
    filingDate: str = Field(..., description="ISO date")
    currentStage: str = Field(..., min_length=1)
    status: str = Field(..., min_length=1)
    priority: str = Field(..., min_length=1)
    numberOfHearings: int = Field(0, ge=0, le=10000)
    numberOfAdjournments: int = Field(0, ge=0, le=10000)
    lastHearingDate: Optional[str] = None
    nextHearingDate: Optional[str] = None
    legalSections: Optional[Union[list[str], str]] = None
    description: Optional[str] = None
    referenceDate: Optional[str] = None

    @field_validator("numberOfAdjournments")
    @classmethod
    def adj_le_hearings(cls, v, info):
        h = info.data.get("numberOfHearings")
        if h is not None and v > h:
            raise ValueError("numberOfAdjournments cannot exceed numberOfHearings")
        return v


class FeatureContribution(BaseModel):
    feature: str
    label: str
    value: Any = None
    impact: float
    predictedClassImpact: float
    direction: Literal["increases_risk", "decreases_risk"]


class Explanation(BaseModel):
    method: str
    label: str
    basis: str
    features: list[FeatureContribution]
    summary: list[str]
    disclaimer: str


class PredictionResponse(BaseModel):
    riskLevel: Literal["LOW", "MEDIUM", "HIGH"]
    probability: float
    classProbabilities: dict[str, float]
    predictedDelayDays: Optional[int]
    modelVersion: str
    modelType: str
    features: list[FeatureContribution]
    explanation: Explanation
    inputFeatures: dict[str, Any]


class SimilarRequest(BaseModel):
    query: CaseFeatures
    candidates: list[dict[str, Any]] = Field(default_factory=list, max_length=5000)
    topK: int = Field(5, ge=1, le=50)
    includeHistorical: bool = True


class SimilarCaseItem(BaseModel):
    caseId: Optional[str]
    referenceId: str
    source: Optional[str]
    caseNumber: Optional[str]
    title: Optional[str]
    caseType: Optional[str]
    court: Optional[str]
    state: Optional[str]
    currentStage: Optional[str]
    status: Optional[str]
    riskLevel: Optional[str]
    delayDays: Optional[float]
    similarityScore: float
    explanation: str


class SimilarResponse(BaseModel):
    method: str
    results: list[SimilarCaseItem]
