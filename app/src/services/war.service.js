import api from './api';

export const getLatestWar = () => api.get('/api/v1/wars/latest');

export const getLatestWarResult = () => api.get('/api/v1/wars/result/latest');

export const getUserListToAttack = (params) => api.get('/api/v1/wars/users-to-attack', { params });

export const getUserDetailToAttack = (id) => api.get(`/api/v1/wars/users-to-attack/${id}`);
