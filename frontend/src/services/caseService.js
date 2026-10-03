import api, { unwrap } from './api';

const clean = (params) => Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== '' && v != null));

export const caseService = {
  list: (params) => api.get('/cases', { params: clean(params) }).then(unwrap),
  get: (id) => api.get(`/cases/${id}`).then(unwrap),
  create: (payload) => api.post('/cases', payload).then(unwrap),
  update: (id, payload) => api.put(`/cases/${id}`, payload).then(unwrap),
  remove: (id) => api.delete(`/cases/${id}`).then(unwrap),
  findSimilar: (id, body = { topK: 5 }) => api.post(`/cases/${id}/similar`, body).then(unwrap),
  getSimilar: (id) => api.get(`/cases/${id}/similar`).then(unwrap),
};
