const recommendationService = require('../services/recommendationService');
const caseService = require('../services/caseService');
const { asyncHandler, sendSuccess } = require('../utils/http');

exports.list = asyncHandler(async (req, res) => {
  const { items, summary, pagination } = await recommendationService.list(req.validated.query);
  sendSuccess(res, { data: { recommendations: items, summary }, meta: { pagination }, message: 'Recommendations' });
});

exports.forCase = asyncHandler(async (req, res) => {
  await caseService.getCase(req.validated.params.caseId);
  const items = await recommendationService.forCase(req.validated.params.caseId);
  sendSuccess(res, { data: { recommendations: items }, message: 'Case recommendations' });
});
