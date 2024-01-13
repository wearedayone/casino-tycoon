import api from './api';

export const getWorkerPrices = () => api.get('/api/v1/season/worker-price');

export const getBuildingPrices = () => api.get('/api/v1/season/building-price');
