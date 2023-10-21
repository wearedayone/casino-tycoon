import api from './api';

export const getMe = () => api.get('/api/v1/users/me');
