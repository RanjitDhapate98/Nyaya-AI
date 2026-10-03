/**
 * HTTP client for the Python FastAPI ML service.
 * Network failures / timeouts are translated into 503 Service Unavailable.
 */
const axios = require('axios');
const env = require('../config/env');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const { toISODate } = require('../utils/http');

const client = axios.create({
  baseURL: env.ML_SERVICE_URL,
  timeout: env.ML_SERVICE_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

function translateError(err, op) {
  if (err.response) {
    const { status, data } = err.response;
    logger.warn(`ML ${op} failed with ${status}: ${JSON.stringify(data).slice(0, 300)}`);
    if (status === 422) return ApiError.unprocessable('Case data rejected by ML service', data?.error || data?.detail);
    if (status === 503) return ApiError.unavailable('ML model is not ready. Train the model and restart the ML service.', data?.error);
    return ApiError.unavailable(`ML service error during ${op}`, data?.message || `HTTP ${status}`);
  }
  logger.error(`ML service unreachable during ${op}: ${err.code || err.message}`);
  return ApiError.unavailable('ML service is unavailable. Please ensure the Python ML service is running.', err.code || 'ML_UNREACHABLE');
}

/** Maps a Case document to the ML feature payload (raw fields; derived features computed in Python). */
function toMlPayload(c) {
  return {
    id: c._id?.toString(),
    caseNumber: c.caseNumber,
    title: c.title,
    court: c.court,
    state: c.state,
    district: c.district || null,
    caseType: c.caseType,
    filingDate: toISODate(c.filingDate),
    currentStage: c.currentStage,
    status: c.status,
    priority: c.priority,
    numberOfHearings: c.numberOfHearings ?? 0,
    numberOfAdjournments: c.numberOfAdjournments ?? 0,
    lastHearingDate: toISODate(c.lastHearingDate),
    nextHearingDate: toISODate(c.nextHearingDate),
    legalSections: c.legalSections || [],
    description: c.description || '',
  };
}

async function call(op, fn) {
  try {
    const { data } = await fn();
    return data;
  } catch (err) {
    throw translateError(err, op);
  }
}

const predict = (caseDoc) => call('predict', () => client.post('/predict', toMlPayload(caseDoc)));
const explain = (caseDoc) => call('explain', () => client.post('/explain', toMlPayload(caseDoc)));
const similar = (caseDoc, candidates, { topK = 5, includeHistorical = true } = {}) =>
  call('similar', () => client.post('/similar', {
    query: toMlPayload(caseDoc),
    candidates: candidates.map((c) => ({ ...toMlPayload(c), riskLevel: c.riskLevel || null, delayDays: c.predictedDelayDays ?? null })),
    topK,
    includeHistorical,
  }));

async function health() {
  try {
    const { data } = await client.get('/health', { timeout: 3000 });
    return { reachable: true, ...data };
  } catch (err) {
    return { reachable: false, error: err.code || err.message };
  }
}

const modelInfo = () => call('model-info', () => client.get('/model-info', { timeout: 5000 }));

module.exports = { predict, explain, similar, health, modelInfo, toMlPayload };
