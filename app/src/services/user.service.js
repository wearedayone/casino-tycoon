import api from './api';

export const getMe = () => api.get('/api/v1/users/me');

export const toggleWarStatus = (data) => api.put('/api/v1/users/me/war', data);
