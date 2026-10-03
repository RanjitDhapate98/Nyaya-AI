const analyticsService = require('../services/analyticsService');
const { asyncHandler, sendSuccess } = require('../utils/http');

exports.summary = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: await analyticsService.summary(req.validated.query), message: 'Analytics summary' });
});

exports.predictionTrend = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: { trend: await analyticsService.predictionTrend() }, message: 'Prediction trend' });
});

exports.filterOptions = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await analyticsService.filterOptions(), message: 'Filter options' });
});
