import api, { unwrap } from './api';

const clean = (params) => Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== '' && v != null));

export const analyticsService = {
  summary: (filters) => api.get('/analytics/summary', { params: clean(filters) }).then(unwrap),
  predictionTrend: () => api.get('/analytics/prediction-trend').then(unwrap),
  filterOptions: () => api.get('/analytics/filters').then(unwrap),
  health: () => api.get('/health', { validateStatus: () => true }).then((r) => r.data),
};
