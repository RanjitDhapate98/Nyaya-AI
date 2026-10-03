import api, { unwrap } from './api';

export const authService = {
  register: (payload) => api.post('/auth/register', payload).then(unwrap),
  login: (payload) => api.post('/auth/login', payload).then(unwrap),
  logout: () => api.post('/auth/logout').then(unwrap),
  me: () => api.get('/auth/me').then(unwrap),
  listUsers: () => api.get('/auth/users').then(unwrap),
  updateRole: (id, role) => api.patch(`/auth/users/${id}/role`, { role }).then(unwrap),
};
