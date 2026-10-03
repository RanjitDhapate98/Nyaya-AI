/**
 * End-to-end connectivity test against a RUNNING stack (backend + MongoDB + ML service).
 *   npm run test:flow
 * Flow: register -> login -> me -> create case -> predict (Node -> FastAPI -> XGBoost -> SHAP)
 *       -> similar cases -> recommendations -> analytics -> cleanup.
 */
const axios = require('axios');
require('../config/env');

const BASE = process.env.E2E_API_URL || `http://localhost:${process.env.PORT || 5000}/api`;
const api = axios.create({ baseURL: BASE, validateStatus: () => true });
const stamp = Date.now();
let failures = 0;

function check(name, cond, detail = '') {
  // eslint-disable-next-line no-console
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? `  -> ${detail}` : ''}`);
  if (!cond) failures += 1;
}

(async () => {
  const health = await api.get('/health');
  check('GET /health', health.status === 200, JSON.stringify(health.data?.data?.mlService));

  const email = `e2e_${stamp}@nyaya.test`;
  const reg = await api.post('/auth/register', { name: 'E2E Analyst', email, password: 'Passw0rd!x', role: 'analyst' });
  check('POST /auth/register', reg.status === 201, reg.data.message);

  const dup = await api.post('/auth/register', { name: 'E2E Analyst', email, password: 'Passw0rd!x' });
  check('duplicate register -> 409', dup.status === 409);

  const login = await api.post('/auth/login', { email, password: 'Passw0rd!x' });
  check('POST /auth/login', login.status === 200);
  const token = login.data?.data?.token;
  api.defaults.headers.common.Authorization = `Bearer ${token}`;

  const me = await api.get('/auth/me');
  check('GET /auth/me', me.status === 200 && me.data.data.user.email === email);

  const bad = await api.post('/cases', { caseNumber: 'x' });
  check('invalid case -> 422', bad.status === 422, bad.data.message);

  const payload = {
    caseNumber: `E2E/CIV/${stamp}`,
    title: 'E2E Test Petitioner v. E2E Test Respondent',
    court: 'High Court', state: 'Maharashtra', district: 'Pune', caseType: 'Property',
    filingDate: '2021-02-10', currentStage: 'Evidence', status: 'Adjourned', priority: 'Normal',
    petitioner: 'E2E Petitioner', respondent: 'E2E Respondent', judge: 'Test Bench',
    numberOfHearings: 28, numberOfAdjournments: 15,
    lastHearingDate: '2026-04-15', nextHearingDate: '2026-12-20',
    legalSections: 'Transfer of Property Act S.53A; Registration Act S.17',
    description: 'Title dispute over agricultural land with repeated adjournments sought by parties.',
  };
  const created = await api.post('/cases', payload);
  check('POST /cases', created.status === 201, created.data.message);
  const id = created.data?.data?.case?._id;

  const list = await api.get('/cases', { params: { search: 'E2E', limit: 5 } });
  check('GET /cases (search)', list.status === 200 && list.data.data.cases.length >= 1);

  const pred = await api.post('/predictions', { caseId: id });
  const p = pred.data?.data;
  check('POST /predictions', pred.status === 201, pred.data.message);
  check('  risk level from model', ['LOW', 'MEDIUM', 'HIGH'].includes(p?.prediction?.riskLevel), `${p?.prediction?.riskLevel} p=${p?.prediction?.probability}`);
  check('  SHAP contributions', (p?.prediction?.featureContributions || []).length > 0, p?.prediction?.featureContributions?.[0]?.feature);
  check('  similar cases', (p?.similarCases || []).length > 0, `${p?.similarCases?.length} found`);
  check('  recommendations', (p?.recommendations || []).length > 0, p?.recommendations?.[0]?.recommendation);

  const latest = await api.get(`/predictions/case/${id}`);
  check('GET /predictions/case/:id', latest.status === 200 && latest.data.data.prediction);

  const sim = await api.post(`/cases/${id}/similar`, { topK: 5 });
  check('POST /cases/:id/similar', sim.status === 200 && sim.data.data.similarCases.length <= 5);

  const recs = await api.get('/recommendations', { params: { caseId: id } });
  check('GET /recommendations', recs.status === 200 && recs.data.data.recommendations.length > 0);

  const analytics = await api.get('/analytics/summary');
  check('GET /analytics/summary', analytics.status === 200, JSON.stringify(analytics.data?.data?.kpis || analytics.data));

  const del = await api.delete(`/cases/${id}`);
  check('DELETE /cases/:id (own case)', del.status === 200);

  const unauth = await axios.get(`${BASE}/cases`, { validateStatus: () => true });
  check('no token -> 401', unauth.status === 401);

  // eslint-disable-next-line no-console
  console.log(failures ? `\n${failures} check(s) failed` : '\nAll end-to-end checks passed');
  process.exit(failures ? 1 : 0);
})().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('E2E run crashed:', err.message);
  process.exit(1);
});
