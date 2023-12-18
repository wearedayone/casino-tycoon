import api from './api';

export const getLatestWar = () => api.get('/api/v1/wars/latest');
