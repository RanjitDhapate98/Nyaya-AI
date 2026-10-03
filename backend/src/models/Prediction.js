const mongoose = require('mongoose');
const { RISK_LEVELS } = require('../constants/enums');

const contributionSchema = new mongoose.Schema(
  {
    feature: String,
    label: String,
    value: mongoose.Schema.Types.Mixed,
    impact: Number,
    predictedClassImpact: Number,
    direction: { type: String, enum: ['increases_risk', 'decreases_risk'] },
  },
  { _id: false },
);

const predictionSchema = new mongoose.Schema(
  {
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
    riskLevel: { type: String, enum: RISK_LEVELS, required: true, index: true },
    probability: { type: Number, min: 0, max: 1, required: true },
    classProbabilities: { type: Map, of: Number },
    predictedDelayDays: { type: Number, min: 0 },
    modelVersion: { type: String, required: true },
    modelType: String,
    featureContributions: [contributionSchema],
    explanation: {
      method: String,
      label: String,
      basis: String,
      summary: [String],
      disclaimer: String,
      narrative: String,
      narrativeSource: { type: String, enum: ['gemini', 'template'] },
    },
    inputFeatures: mongoose.Schema.Types.Mixed,
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

predictionSchema.index({ caseId: 1, createdAt: -1 });
predictionSchema.set('toJSON', { transform: (_d, r) => { delete r.__v; return r; } });

module.exports = mongoose.model('Prediction', predictionSchema);
