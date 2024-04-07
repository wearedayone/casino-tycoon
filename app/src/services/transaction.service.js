import api from './api';

export const create = ({ type, ...data }) => api.post('/api/v1/transactions', { type, ...data });

export const validate = ({ transactionId, txnHash }) =>
  api.post('/api/v1/transactions/validation', { transactionId, txnHash });

export const validateDailySpin = ({ transactionId, txnHash }) =>
  api.post('/api/v1/transactions/validation/daily-spin', { transactionId, txnHash });

export const claimToken = () => api.post('/api/v1/transactions/claimToken');

export const getWorkerPrices = ({ timeMode }) =>
  api.get('/api/v1/transactions/worker/price-chart', { params: { timeMode } });

export const getBuildingPrices = ({ timeMode }) =>
  api.get('/api/v1/transactions/building/price-chart', { params: { timeMode } });
