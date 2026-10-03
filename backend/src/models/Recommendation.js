const mongoose = require('mongoose');
const { REC_PRIORITIES } = require('../constants/enums');

const recommendationSchema = new mongoose.Schema(
  {
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
    predictionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prediction', default: null },
    priority: { type: String, enum: REC_PRIORITIES, required: true, index: true },
    category: { type: String, trim: true },
    recommendation: { type: String, required: true, trim: true, maxlength: 500 },
    reason: { type: String, trim: true, maxlength: 1000 },
    source: { type: String, enum: ['rule-engine', 'gemini'], default: 'rule-engine' },
    riskLevel: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

recommendationSchema.index({ createdAt: -1 });
recommendationSchema.set('toJSON', { transform: (_d, r) => { delete r.__v; return r; } });

module.exports = mongoose.model('Recommendation', recommendationSchema);
