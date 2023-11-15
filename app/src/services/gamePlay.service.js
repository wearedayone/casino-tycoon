import api from './api';

export const getLeaderboard = () => api.get('/api/v1/gamePlays');

export const getNextWarSnapshotUnixTime = () => api.get('/api/v1/gamePlays/next-war-time');
