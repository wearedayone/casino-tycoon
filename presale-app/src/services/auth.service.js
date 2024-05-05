import api from './api';

export const getAuthToken = (data) => api.post('/api/v1/users', data);
