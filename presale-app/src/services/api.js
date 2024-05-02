import axios from 'axios';
import { signOut } from 'firebase/auth';

import { auth } from '../configs/firebase.config';
import environments from '../utils/environments';

const { BACKEND_URL } = environments;

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await auth.currentUser?.getIdToken();
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
    console.log(err.response.data);
    if (err.response.status === 401) {
      signOut(auth);
    }
    throw new Error((err.response && err.response.data) || err.message);
  }
);

export default api;
