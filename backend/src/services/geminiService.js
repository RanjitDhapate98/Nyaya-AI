/**
 * Optional Gemini integration (server-side only - the key never reaches the browser).
 * Used for a plain-language narrative of a prediction. If GEMINI_API_KEY is missing
 * or the call fails, a deterministic template narrative is used instead.
 */
const axios = require('axios');
const env = require('../config/env');
const logger = require('../config/logger');

const isEnabled = () => env.geminiEnabled;

function templateNarrative(caseDoc, prediction) {
  const top = (prediction.features || []).slice(0, 3);
  const ups = top.filter((f) => f.direction === 'increases_risk').map((f) => f.label.toLowerCase());
  const downs = top.filter((f) => f.direction === 'decreases_risk').map((f) => f.label.toLowerCase());
  const parts = [
    `The model classified case ${caseDoc.caseNumber} (${caseDoc.caseType}, ${caseDoc.currentStage} stage) as ${prediction.riskLevel} delay risk `
      + `with ${(prediction.probability * 100).toFixed(1)}% model confidence`
      + (prediction.predictedDelayDays != null ? ` and an estimated remaining duration of about ${prediction.predictedDelayDays} days.` : '.'),
  ];
  if (ups.length) parts.push(`Inputs that most pushed the model toward higher risk: ${ups.join(', ')}.`);
  if (downs.length) parts.push(`Inputs that pushed toward lower risk: ${downs.join(', ')}.`);
  parts.push('This is a model-generated decision-support estimate, not a legal judgment.');
  return parts.join(' ');
}

async function generateText(prompt) {
  const url = `${env.GEMINI_API_URL}/models/${encodeURIComponent(env.GEMINI_MODEL)}:generateContent`;
  const { data } = await axios.post(
    url,
    { contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 400 } },
    { headers: { 'x-goog-api-key': env.GEMINI_API_KEY, 'Content-Type': 'application/json' }, timeout: 15000 },
  );
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim();
  if (!text) throw new Error('Empty Gemini response');
  return text;
}

/** Returns { text, source: 'gemini' | 'template' } and never throws. */
async function explainPrediction(caseDoc, prediction) {
  if (!isEnabled()) return { text: templateNarrative(caseDoc, prediction), source: 'template' };
  const features = (prediction.features || []).slice(0, 6)
    .map((f) => `${f.label}=${f.value} (${f.direction === 'increases_risk' ? '+' : '-'}${Math.abs(f.impact).toFixed(2)})`).join('; ');
  const prompt = [
    'You are assisting a court administrator using a research decision-support tool.',
    'Write 3-4 neutral sentences explaining this machine-learning delay-risk estimate in plain language.',
    'Do NOT give legal advice, do NOT predict the case outcome, and do NOT claim causation;',
    'describe feature contributions as what influenced the model. End by noting it is not a legal judgment.',
    `Case type: ${caseDoc.caseType}; stage: ${caseDoc.currentStage}; court: ${caseDoc.court}; status: ${caseDoc.status}.`,
    `Risk: ${prediction.riskLevel}; model confidence: ${(prediction.probability * 100).toFixed(0)}%; estimated remaining days: ${prediction.predictedDelayDays}.`,
    `Top model feature contributions (SHAP): ${features}.`,
  ].join('\n');
  try {
    return { text: await generateText(prompt), source: 'gemini' };
  } catch (err) {
    logger.warn(`Gemini unavailable, using template narrative: ${err.response?.status || ''} ${err.message}`);
    return { text: templateNarrative(caseDoc, prediction), source: 'template' };
  }
}

module.exports = { isEnabled, explainPrediction, templateNarrative };
