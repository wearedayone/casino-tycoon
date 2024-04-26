import api from './api';

export const create = ({ type, ...data }) => api.post('/api/v1/transactions', { type, ...data });

export const validate = ({ transactionId, txnHash }) =>
  api.post('/api/v1/transactions/validation', { transactionId, txnHash });

export const validateDailySpin = ({ transactionId, txnHash }) =>
  api.post('/api/v1/transactions/validation/daily-spin', { transactionId, txnHash });

export const claimToken = () => api.post('/api/v1/transactions/claimToken');

export const claimXTokenHoldingReward = () => api.post('/api/v1/transactions/claim-holding-reward/x-token');

export const getWorkerPrices = ({ timeMode }) =>
  api.get('/api/v1/transactions/worker/price-chart', { params: { timeMode } });

export const getBuildingPrices = ({ timeMode }) =>
  api.get('/api/v1/transactions/building/price-chart', { params: { timeMode } });

export const getMachinePrices = ({ timeMode }) =>
  api.get('/api/v1/transactions/machine/price-chart', { params: { timeMode } });

export const buyAssetsWithXToken = ({ type, amount }) =>
  api.post('/api/v1/transactions/assets/x-token', { type, amount });

export const convertWeb2Token = ({ amount }) => api.post('/api/v1/transactions/convert-x-token', { amount });
