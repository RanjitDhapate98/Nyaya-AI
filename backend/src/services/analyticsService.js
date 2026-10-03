/**
 * Analytics computed live from MongoDB with aggregation pipelines (no hardcoded numbers).
 */
const Case = require('../models/Case');
const Prediction = require('../models/Prediction');
const Recommendation = require('../models/Recommendation');
const { buildCaseFilter } = require('./caseService');

const DAY_MS = 86400000;

function buildPipeline(filter) {
  const ageExpr = { $divide: [{ $subtract: [new Date(), '$filingDate'] }, DAY_MS] };
  const riskExpr = { $ifNull: ['$riskLevel', 'UNASSESSED'] };
  const countBy = (expr, limit) => {
    const p = [{ $group: { _id: expr, count: { $sum: 1 } } }, { $sort: { count: -1 } }];
    if (limit) p.push({ $limit: limit });
    return p;
  };
  return [
    { $match: filter },
    {
      $facet: {
        totals: [{
          $group: {
            _id: null,
            totalCases: { $sum: 1 },
            avgCaseAgeDays: { $avg: ageExpr },
            avgAdjournments: { $avg: '$numberOfAdjournments' },
            avgHearings: { $avg: '$numberOfHearings' },
            avgPredictedDelayDays: { $avg: '$predictedDelayDays' },
            assessed: { $sum: { $cond: [{ $ifNull: ['$riskLevel', false] }, 1, 0] } },
            pendingCases: { $sum: { $cond: [{ $ne: ['$status', 'Disposed'] }, 1, 0] } },
          },
        }],
        byRisk: countBy(riskExpr),
        byType: countBy('$caseType'),
        byStatus: countBy('$status'),
        byCourt: countBy('$court'),
        byState: countBy('$state', 10),
        byStage: countBy('$currentStage'),
        riskByType: [
          { $group: { _id: { type: '$caseType', risk: riskExpr }, count: { $sum: 1 } } },
        ],
        delayTrend: [
          { $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$filingDate' } },
            cases: { $sum: 1 },
            highRisk: { $sum: { $cond: [{ $eq: ['$riskLevel', 'HIGH'] }, 1, 0] } },
            avgPredictedDelayDays: { $avg: '$predictedDelayDays' },
            avgAdjournments: { $avg: '$numberOfAdjournments' },
          } },
          { $sort: { _id: 1 } },
        ],
        recentCases: [
          { $sort: { createdAt: -1 } },
          { $limit: 6 },
          { $project: { caseNumber: 1, title: 1, caseType: 1, court: 1, status: 1, riskLevel: 1, riskProbability: 1, createdAt: 1, filingDate: 1 } },
        ],
        upcomingHighRisk: [
          { $match: { riskLevel: 'HIGH', nextHearingDate: { $gte: new Date() } } },
          { $sort: { nextHearingDate: 1 } },
          { $limit: 5 },
          { $project: { caseNumber: 1, title: 1, nextHearingDate: 1, riskProbability: 1 } },
        ],
      },
    },
  ];
}

const round = (v, d = 1) => (v == null ? null : Number(v.toFixed(d)));
const toList = (arr) => arr.map((x) => ({ name: x._id ?? 'Unknown', value: x.count }));

async function summary(query) {
  const filter = buildCaseFilter(query);
  const [facet] = await Case.aggregate(buildPipeline(filter));
  const t = facet.totals[0] || {};
  const riskCounts = Object.fromEntries(facet.byRisk.map((r) => [r._id, r.count]));

  const riskByType = {};
  facet.riskByType.forEach(({ _id, count }) => {
    riskByType[_id.type] = riskByType[_id.type] || { name: _id.type, LOW: 0, MEDIUM: 0, HIGH: 0, UNASSESSED: 0 };
    riskByType[_id.type][_id.risk] = count;
  });

  const [predictionCount, recommendationCount] = await Promise.all([
    Prediction.estimatedDocumentCount(),
    Recommendation.estimatedDocumentCount(),
  ]);

  return {
    filtersApplied: query,
    kpis: {
      totalCases: t.totalCases || 0,
      pendingCases: t.pendingCases || 0,
      highRisk: riskCounts.HIGH || 0,
      mediumRisk: riskCounts.MEDIUM || 0,
      lowRisk: riskCounts.LOW || 0,
      unassessed: riskCounts.UNASSESSED || 0,
      assessed: t.assessed || 0,
      avgCaseAgeDays: round(t.avgCaseAgeDays, 0),
      avgAdjournments: round(t.avgAdjournments, 2),
      avgHearings: round(t.avgHearings, 2),
      avgPredictedDelayDays: round(t.avgPredictedDelayDays, 0),
      totalPredictions: predictionCount,
      totalRecommendations: recommendationCount,
    },
    byRisk: ['HIGH', 'MEDIUM', 'LOW', 'UNASSESSED'].map((k) => ({ name: k, value: riskCounts[k] || 0 })),
    byType: toList(facet.byType),
    byStatus: toList(facet.byStatus),
    byCourt: toList(facet.byCourt),
    byState: toList(facet.byState),
    byStage: toList(facet.byStage),
    riskByType: Object.values(riskByType),
    delayTrend: facet.delayTrend.map((d) => ({
      month: d._id,
      cases: d.cases,
      highRisk: d.highRisk,
      avgPredictedDelayDays: round(d.avgPredictedDelayDays, 0),
      avgAdjournments: round(d.avgAdjournments, 2),
    })),
    recentCases: facet.recentCases,
    upcomingHighRisk: facet.upcomingHighRisk,
  };
}

/** Prediction volume over time (by creation month). */
async function predictionTrend() {
  const rows = await Prediction.aggregate([
    { $group: {
      _id: { month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, risk: '$riskLevel' },
      count: { $sum: 1 },
    } },
    { $sort: { '_id.month': 1 } },
  ]);
  const map = {};
  rows.forEach(({ _id, count }) => {
    map[_id.month] = map[_id.month] || { month: _id.month, LOW: 0, MEDIUM: 0, HIGH: 0 };
    map[_id.month][_id.risk] = count;
  });
  return Object.values(map);
}

async function filterOptions() {
  const [courts, caseTypes, states, statuses] = await Promise.all([
    Case.distinct('court'), Case.distinct('caseType'), Case.distinct('state'), Case.distinct('status'),
  ]);
  return { courts: courts.sort(), caseTypes: caseTypes.sort(), states: states.sort(), statuses: statuses.sort() };
}

module.exports = { summary, predictionTrend, filterOptions, buildPipeline };
