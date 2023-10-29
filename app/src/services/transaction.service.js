import api from './api';

export const create = ({ type, amount }) => api.post('/api/v1/transactions', { type, amount });

export const validate = ({ transactionId, txnHash }) =>
  api.post('/api/v1/transactions/validation', { transactionId, txnHash });

export const claimToken = () => api.post('/api/v1/transactions/claimToken');
