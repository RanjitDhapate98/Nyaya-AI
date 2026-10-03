import api, { unwrap } from './api';

const clean = (params) => Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== '' && v != null));

export const recommendationService = {
  list: (params) => api.get('/recommendations', { params: clean(params) }).then(unwrap),
  forCase: (caseId) => api.get(`/recommendations/case/${caseId}`).then(unwrap),
};
