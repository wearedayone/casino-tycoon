import api from './api';

export const getLeaderboard = () => api.get('/api/v1/gamePlays');

export const getNextWarSnapshotUnixTime = () => api.get('/api/v1/gamePlays/next-war-time');

export const updateLastTimeSeenGangWarResult = () => api.put('/api/v1/gamePlays/last-time-seen-war-result');

export const updateUserWarMachines = (data) => api.put('/api/v1/gamePlays/war-machines', data);

export const updateUserWarAttack = (data) => api.put('/api/v1/gamePlays/war-attack', data);

export const getUserWarDeployment = () => api.get('/api/v1/gamePlays/war-deployment');

export const getNextSpinIncrementUnixTime = () => api.get('/api/v1/gamePlays/next-spin-increment-time');
