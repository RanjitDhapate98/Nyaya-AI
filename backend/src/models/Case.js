const mongoose = require('mongoose');
const { CASE_TYPES, COURTS, STAGES, STATUSES, PRIORITIES, RISK_LEVELS } = require('../constants/enums');

const historyEntrySchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    event: { type: String, required: true, trim: true, maxlength: 120 },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { _id: false },
);

const caseSchema = new mongoose.Schema(
  {
    caseNumber: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    title: { type: String, required: true, trim: true, maxlength: 250 },
    court: { type: String, required: true, enum: COURTS, index: true },
    state: { type: String, required: true, trim: true, maxlength: 60, index: true },
    district: { type: String, trim: true, maxlength: 60 },
    caseType: { type: String, required: true, enum: CASE_TYPES, index: true },
    filingDate: { type: Date, required: true, index: true },
    currentStage: { type: String, required: true, enum: STAGES },
    status: { type: String, required: true, enum: STATUSES, index: true },
    priority: { type: String, required: true, enum: PRIORITIES, index: true },
    petitioner: { type: String, required: true, trim: true, maxlength: 200 },
    respondent: { type: String, required: true, trim: true, maxlength: 200 },
    judge: { type: String, trim: true, maxlength: 120 },
    numberOfHearings: { type: Number, required: true, min: 0, default: 0 },
    numberOfAdjournments: { type: Number, required: true, min: 0, default: 0 },
    lastHearingDate: Date,
    nextHearingDate: Date,
    caseAgeDays: { type: Number, min: 0 },
    description: { type: String, trim: true, maxlength: 5000 },
    legalSections: [{ type: String, trim: true, maxlength: 120 }],
    historicalData: [historyEntrySchema],
    isSample: { type: Boolean, default: false },

    // Denormalised latest prediction for fast filtering & analytics.
    riskLevel: { type: String, enum: [...RISK_LEVELS, null], default: null, index: true },
    riskProbability: { type: Number, min: 0, max: 1, default: null },
    predictedDelayDays: { type: Number, min: 0, default: null },
    lastPredictionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prediction', default: null },
    lastPredictedAt: { type: Date, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  },
  { timestamps: true },
);

caseSchema.index({ createdAt: -1 });
caseSchema.index({ caseType: 1, riskLevel: 1 });
caseSchema.index({ court: 1, state: 1, status: 1 });

caseSchema.pre('save', function computeAge(next) {
  if (this.filingDate) this.caseAgeDays = Math.max(0, Math.floor((Date.now() - this.filingDate.getTime()) / 86400000));
  next();
});

caseSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    // Case age is always reported relative to "now", not to the last save.
    if (ret.filingDate) ret.caseAgeDays = Math.max(0, Math.floor((Date.now() - new Date(ret.filingDate).getTime()) / 86400000));
    delete ret.__v;
    delete ret.id;
    return ret;
  },
});

module.exports = mongoose.model('Case', caseSchema);
