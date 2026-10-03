const Case = require('../models/Case');
const Prediction = require('../models/Prediction');
const SimilarCase = require('../models/SimilarCase');
const Recommendation = require('../models/Recommendation');
const ApiError = require('../utils/ApiError');
const { escapeRegex } = require('../utils/http');

const PREDICTION_FIELDS = ['riskLevel', 'riskProbability', 'predictedDelayDays', 'lastPredictionId', 'lastPredictedAt'];

/** Builds a Mongo filter from validated list/analytics query params. */
function buildCaseFilter(q = {}) {
  const filter = {};
  ['caseType', 'court', 'status', 'priority'].forEach((k) => { if (q[k]) filter[k] = q[k]; });
  if (q.state) filter.state = new RegExp(`^${escapeRegex(q.state)}$`, 'i');
  if (q.riskLevel) filter.riskLevel = q.riskLevel === 'UNASSESSED' ? null : q.riskLevel;
  if (q.from || q.to) {
    filter.filingDate = {};
    if (q.from) filter.filingDate.$gte = q.from;
    if (q.to) filter.filingDate.$lte = q.to;
  }
  if (q.search) {
    const rx = new RegExp(escapeRegex(q.search), 'i');
    filter.$or = [{ caseNumber: rx }, { title: rx }, { petitioner: rx }, { respondent: rx }, { judge: rx }, { district: rx }];
  }
  return filter;
}

async function createCase(data, user) {
  if (await Case.exists({ caseNumber: data.caseNumber })) {
    throw ApiError.conflict(`Case number "${data.caseNumber}" already exists`, { field: 'caseNumber' });
  }
  return Case.create({ ...data, createdBy: user._id });
}

async function listCases(q) {
  const filter = buildCaseFilter(q);
  const sort = { [q.sortBy]: q.sortOrder === 'asc' ? 1 : -1, _id: -1 };
  const skip = (q.page - 1) * q.limit;
  const [items, total] = await Promise.all([
    Case.find(filter).sort(sort).skip(skip).limit(q.limit).populate('createdBy', 'name email'),
    Case.countDocuments(filter),
  ]);
  return {
    items: items.map((c) => c.toJSON()),
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
  };
}

async function getCase(id) {
  const doc = await Case.findById(id).populate('createdBy', 'name email');
  if (!doc) throw ApiError.notFound('Case not found');
  return doc;
}

function assertCanModify(doc, user) {
  if (user.role === 'admin') return;
  const ownerId = doc.createdBy?._id || doc.createdBy;
  if (user.role === 'analyst' && ownerId && ownerId.toString() === user._id.toString()) return;
  throw ApiError.forbidden('Only admins or the analyst who created this case can modify it');
}

async function updateCase(id, data, user) {
  const doc = await getCase(id);
  assertCanModify(doc, user);
  if (data.caseNumber !== doc.caseNumber && (await Case.exists({ caseNumber: data.caseNumber, _id: { $ne: id } }))) {
    throw ApiError.conflict(`Case number "${data.caseNumber}" already exists`, { field: 'caseNumber' });
  }
  // Clear optional fields omitted by the client (PUT semantics) without touching prediction fields.
  ['lastHearingDate', 'nextHearingDate'].forEach((k) => { if (data[k] === undefined) doc[k] = undefined; });
  Object.entries(data).forEach(([k, v]) => { if (!PREDICTION_FIELDS.includes(k)) doc[k] = v; });
  // Facts changed -> previous prediction may be stale; keep it but mark for re-run in UI via timestamps.
  await doc.save();
  return doc;
}

async function deleteCase(id, user) {
  const doc = await getCase(id);
  assertCanModify(doc, user);
  await Promise.all([
    Prediction.deleteMany({ caseId: id }),
    SimilarCase.deleteMany({ $or: [{ caseId: id }, { similarCaseId: id }] }),
    Recommendation.deleteMany({ caseId: id }),
  ]);
  await doc.deleteOne();
  return { id };
}

async function getStoredSimilar(caseId) {
  await getCase(caseId);
  return SimilarCase.find({ caseId }).sort({ similarityScore: -1 }).lean();
}

module.exports = { buildCaseFilter, createCase, listCases, getCase, updateCase, deleteCase, getStoredSimilar };
