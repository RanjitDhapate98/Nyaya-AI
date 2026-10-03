const predictionService = require('../services/predictionService');
const mlService = require('../services/mlService');
const { asyncHandler, sendSuccess } = require('../utils/http');

exports.create = asyncHandler(async (req, res) => {
  const result = await predictionService.runPrediction(req.validated.body, req.user);
  sendSuccess(res, { status: 201, data: result, message: `Prediction generated: ${result.prediction.riskLevel} risk` });
});

exports.list = asyncHandler(async (req, res) => {
  const { items, pagination } = await predictionService.list(req.validated.query);
  sendSuccess(res, { data: { predictions: items }, meta: { pagination }, message: 'Predictions' });
});

exports.latestForCase = asyncHandler(async (req, res) => {
  const data = await predictionService.latestForCase(req.validated.params.caseId);
  sendSuccess(res, { data, message: data.prediction ? 'Latest prediction' : 'No prediction yet for this case' });
});

exports.get = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { prediction: await predictionService.getById(req.validated.params.id) }, message: 'Prediction' });
});

exports.modelInfo = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await mlService.modelInfo(), message: 'Model information' });
});
