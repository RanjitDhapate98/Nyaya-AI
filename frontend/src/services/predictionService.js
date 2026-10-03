import api, { unwrap } from './api';

export const predictionService = {
  run: (caseId) => api.post('/predictions', { caseId }).then(unwrap),
  latestForCase: (caseId) => api.get(`/predictions/case/${caseId}`).then(unwrap),
  list: (params) => api.get('/predictions', { params }).then(unwrap),
  get: (id) => api.get(`/predictions/${id}`).then(unwrap),
  modelInfo: () => api.get('/predictions/model-info').then(unwrap),
};
