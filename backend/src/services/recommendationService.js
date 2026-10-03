/**
 * Recommendation engine (administrative decision-support suggestions, NOT legal advice).
 *
 * Design: a list of "providers" each implementing generate(context) -> Recommendation[].
 * The rule-based provider is the default. A future ML/LLM provider can be added to
 * PROVIDERS (or swapped in) without touching controllers or the prediction flow.
 */
const mongoose = require('mongoose');
const Recommendation = require('../models/Recommendation');
const { daysBetween } = require('../utils/http');

const rec = (priority, category, recommendation, reason) => ({ priority, category, recommendation, reason, source: 'rule-engine' });

const ruleBasedProvider = {
  name: 'rule-engine',
  generate({ caseDoc, prediction, similarCases = [] }) {
    const out = [];
    const risk = prediction.riskLevel;
    const now = new Date();
    const age = daysBetween(caseDoc.filingDate, now);
    const hearings = caseDoc.numberOfHearings || 0;
    const adj = caseDoc.numberOfAdjournments || 0;
    const adjRatio = hearings ? adj / hearings : 0;
    const hearingsPerYear = age > 0 ? hearings / (age / 365) : 0;
    const sinceLast = caseDoc.lastHearingDate ? daysBetween(caseDoc.lastHearingDate, now) : null;
    const toNext = caseDoc.nextHearingDate ? Math.floor((new Date(caseDoc.nextHearingDate) - now) / 86400000) : null;
    const pct = Math.round((prediction.probability || 0) * 100);
    const highSimilar = similarCases.filter((s) => s.riskLevel === 'HIGH').length;
    const disposed = caseDoc.status === 'Disposed';

    if (disposed) {
      out.push(rec('Low', 'monitoring', 'Case is marked Disposed - verify status and archive records.',
        'Status is Disposed; delay-risk monitoring is generally not required for disposed matters.'));
      return out;
    }

    if (risk === 'HIGH') {
      if (!['High', 'Urgent'].includes(caseDoc.priority)) {
        out.push(rec('High', 'priority', 'Review the administrative priority of this case.',
          `Model estimates HIGH delay risk (${pct}% confidence) while priority is "${caseDoc.priority}".`));
      }
      out.push(rec('High', 'hearing', toNext === null ? 'Ensure the next hearing date is scheduled.' : 'Monitor the upcoming hearing closely.',
        toNext === null ? 'No next hearing date is recorded for a HIGH-risk case.' : `Next hearing is in ${toNext} day(s).`));
      if (adj >= 3 || adjRatio >= 0.35) {
        out.push(rec('High', 'adjournments', 'Review the pattern of repeated adjournments.',
          `${adj} adjournments out of ${hearings} hearings (${Math.round(adjRatio * 100)}%).`));
      }
      if (similarCases.length) {
        out.push(rec('Medium', 'similar-cases', 'Examine similar historical cases for delay patterns.',
          `${highSimilar} of ${similarCases.length} most similar cases were also HIGH risk.`));
      }
      out.push(rec('Medium', 'resources', 'Consider administrative resource allocation (bench time / case management support).',
        prediction.predictedDelayDays ? `Model-estimated remaining delay is about ${prediction.predictedDelayDays} days.` : 'Case is classified HIGH risk.'));
    } else if (risk === 'MEDIUM') {
      out.push(rec('Medium', 'monitoring', 'Monitor case progress at regular intervals.', `Model estimates MEDIUM delay risk (${pct}% confidence).`));
      if ((sinceLast !== null && sinceLast > 60) || hearingsPerYear < 4) {
        out.push(rec('Medium', 'hearing', 'Review the hearing schedule.',
          sinceLast !== null ? `${sinceLast} days since last hearing; ~${hearingsPerYear.toFixed(1)} hearings/year.` : `~${hearingsPerYear.toFixed(1)} hearings/year.`));
      }
      if (age > 365) out.push(rec('Medium', 'aging', 'Track case aging.', `Case has been pending for ${age} days (${(age / 365).toFixed(1)} years).`));
      if (adj >= 5) out.push(rec('Medium', 'adjournments', 'Review reasons for adjournments.', `${adj} adjournments recorded.`));
    } else {
      out.push(rec('Low', 'monitoring', 'Continue normal monitoring.', `Model estimates LOW delay risk (${pct}% confidence).`));
      if (toNext === null) out.push(rec('Low', 'hearing', 'Record the next hearing date when available.', 'No next hearing date is on record.'));
    }

    // Stage-specific checks (all risk levels)
    if (['Evidence', 'Pleadings'].includes(caseDoc.currentStage) && sinceLast !== null && sinceLast > 120) {
      out.push(rec(risk === 'LOW' ? 'Low' : 'Medium', 'stage', `Review progression of the ${caseDoc.currentStage} stage.`,
        `No hearing recorded in the last ${sinceLast} days while at ${caseDoc.currentStage} stage.`));
    }
    if (caseDoc.currentStage === 'Judgment Reserved' && sinceLast !== null && sinceLast > 90) {
      out.push(rec('Medium', 'stage', 'Track status of the reserved judgment.', `Judgment reserved; last hearing was ${sinceLast} days ago.`));
    }
    if (caseDoc.status === 'Stayed') {
      out.push(rec('Medium', 'status', 'Track the stay order and its review date.', 'Stayed matters frequently accumulate delay.'));
    }
    return out;
  },
};

const PROVIDERS = [ruleBasedProvider];

function generate(context) {
  const seen = new Set();
  return PROVIDERS.flatMap((p) => p.generate(context)).filter((r) => {
    if (seen.has(r.recommendation)) return false;
    seen.add(r.recommendation);
    return true;
  });
}

async function generateAndSave({ caseDoc, prediction, similarCases, predictionId }) {
  const recs = generate({ caseDoc, prediction, similarCases });
  await Recommendation.deleteMany({ caseId: caseDoc._id });
  const saved = await Recommendation.insertMany(
    recs.map((r) => ({ ...r, caseId: caseDoc._id, predictionId, riskLevel: prediction.riskLevel })),
  );
  return saved.map((d) => d.toJSON());
}

const PRIORITY_ORDER = { High: 0, Medium: 1, Low: 2 };

async function list(q) {
  const filter = {};
  if (q.priority) filter.priority = q.priority;
  if (q.riskLevel) filter.riskLevel = q.riskLevel;
  if (q.caseId) filter.caseId = q.caseId;
  const skip = (q.page - 1) * q.limit;
  const [items, total, byPriority] = await Promise.all([
    Recommendation.find(filter).sort({ createdAt: -1 }).skip(skip).limit(q.limit)
      .populate('caseId', 'caseNumber title caseType court riskLevel status'),
    Recommendation.countDocuments(filter),
    Recommendation.aggregate([
      { $match: { ...filter, ...(filter.caseId ? { caseId: new mongoose.Types.ObjectId(filter.caseId) } : {}) } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]),
  ]);
  return {
    items: items.map((i) => i.toJSON()),
    summary: Object.fromEntries(byPriority.map((b) => [b._id, b.count])),
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
  };
}

async function forCase(caseId) {
  const items = await Recommendation.find({ caseId }).lean();
  return items.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

module.exports = { generate, generateAndSave, list, forCase, ruleBasedProvider };
