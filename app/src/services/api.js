import axios from 'axios';
import { getAccessToken } from '@privy-io/react-auth';

import environments from '../utils/environments';

const { API_URL } = environments;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (err) => {
    console.log(err?.response?.data);
    throw new Error((err.response && err.response.data) || err.message);
  }
);

export default api;
