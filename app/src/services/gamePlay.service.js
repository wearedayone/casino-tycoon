import api from './api';

export const getLeaderboard = () => api.get('/api/v1/gamePlays');
