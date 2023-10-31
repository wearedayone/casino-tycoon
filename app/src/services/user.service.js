import api from './api';

export const getMe = () => api.get('/api/v1/users/me');

export const toggleWarStatus = (data) => api.put('/api/v1/users/me/war', data);

export const getWarHistory = () => api.get('/api/v1/users/me/war-history');

export const completeAskingWalletPassword = () => api.put('/api/v1/users/me/wallet-password-ask');
