/**
 * Similar case retrieval orchestration.
 * Candidate cases come from MongoDB; ranking is delegated to the ML service retriever
 * (TF-IDF + cosine today; swappable for embeddings/FAISS in ml-service/app/retrieval).
 */
const Case = require('../models/Case');
const SimilarCase = require('../models/SimilarCase');
const env = require('../config/env');
const mlService = require('./mlService');

const CANDIDATE_FIELDS = 'caseNumber title court state district caseType filingDate currentStage status priority '
  + 'numberOfHearings numberOfAdjournments lastHearingDate nextHearingDate legalSections description riskLevel predictedDelayDays';

async function findSimilar(caseDoc, { topK = 5, includeHistorical = true, predictionId = null } = {}) {
  const candidates = await Case.find({ _id: { $ne: caseDoc._id } })
    .select(CANDIDATE_FIELDS)
    .sort({ createdAt: -1 })
    .limit(env.SIMILARITY_CANDIDATE_LIMIT)
    .lean();

  const { method, results } = await mlService.similar(caseDoc, candidates, { topK, includeHistorical });

  const docs = results.map((r) => ({
    caseId: caseDoc._id,
    similarCaseId: r.source === 'database' ? r.caseId : null,
    referenceId: r.referenceId,
    source: r.source,
    caseNumber: r.caseNumber,
    title: r.title,
    caseType: r.caseType,
    court: r.court,
    state: r.state,
    currentStage: r.currentStage,
    status: r.status,
    riskLevel: r.riskLevel,
    delayDays: r.delayDays,
    similarityScore: Math.min(1, Math.max(0, r.similarityScore)),
    explanation: r.explanation,
    method,
    predictionId,
  }));

  await SimilarCase.deleteMany({ caseId: caseDoc._id });
  const saved = docs.length ? await SimilarCase.insertMany(docs) : [];
  return saved.map((d) => d.toJSON());
}

module.exports = { findSimilar };
