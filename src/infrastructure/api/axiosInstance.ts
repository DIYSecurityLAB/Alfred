import { getCsrfToken } from '@/utils/Csrf';
import axios from 'axios';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'x-api-key': import.meta.env.VITE_API_KEY,
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    config.headers['X-CSRF-Token'] = getCsrfToken();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const axiosCoupon = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'x-api-key': import.meta.env.VITE_API_KEY,
  },
  withCredentials: true,
});

axiosCoupon.interceptors.request.use(
  (config) => {
    config.headers['X-CSRF-Token'] = getCsrfToken();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};
