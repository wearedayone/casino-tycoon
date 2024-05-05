import api from './api';

export const getSignatureMint = (data) => api.post('/api/v1/wallet/signatures/mint', data);
