import api from './api';

export const getRankingRewards = () => api.get('/api/v1/seasons/ranking-rewards');
