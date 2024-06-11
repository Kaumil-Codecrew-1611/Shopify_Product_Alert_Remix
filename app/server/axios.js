import axios from 'axios';
import { authenticate } from '../shopify.server';

// Create an Axios instance
const axiosInstance = axios.create({
    baseURL: 'http://192.168.1.5/alert-app-api/public/api/v1',
    headers: {
        'Content-Type': 'application/json',
        'Access-Token': 'Shopify@2024'
    },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
    async (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
