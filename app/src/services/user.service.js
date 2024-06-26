import api from './api';

export const getMe = () => api.get('/api/v1/users/me');

export const applyInviteCode = (data) => api.put('/api/v1/users/me/invite-code', data);

export const getWarHistory = () => api.get('/api/v1/users/me/war-history');

export const getWarHistoryDetail = ({ warSnapshotId, warResultId }) =>
  api.get(`/api/v1/users/me/war-history/${warSnapshotId}/${warResultId}`);

export const completeAskingWalletPassword = () => api.put('/api/v1/users/me/wallet-password-ask');

export const updateBalance = () => api.put('/api/v1/users/me/balances');

export const getRank = () => api.get('/api/v1/users/me/rank');

export const setLastOnlineTime = () => api.put('/api/v1/users/me/last-online-time');

export const completeTutorial = () => api.put('/api/v1/users/me/tutorial');

export const getByCode = (code) => api.get('/api/v1/users/code', { params: { code } });

export const checkUserCode = () => api.put('/api/v1/users/code');
