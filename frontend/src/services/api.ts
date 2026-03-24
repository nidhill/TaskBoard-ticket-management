import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: { 'Content-Type': 'application/json' },
});

// Check both storages (sessionStorage = no "remember me", localStorage = "remember me")
const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');
const getRefreshToken = () => localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
const getTokenStorage = () => (sessionStorage.getItem('token') ? sessionStorage : localStorage);

// Attach access token to every request
api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: { resolve: (v: any) => void; reject: (e: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
    failedQueue = [];
};

// Auto-refresh access token on 401
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isAuthRoute = originalRequest?.url?.includes('/auth/login') ||
            originalRequest?.url?.includes('/auth/refresh');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                window.location.href = '/auth';
                return Promise.reject(error);
            }

            try {
                const storage = getTokenStorage();
                const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
                storage.setItem('token', data.token);
                storage.setItem('refreshToken', data.refreshToken);
                api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
                processQueue(null, data.token);
                originalRequest.headers.Authorization = `Bearer ${data.token}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                sessionStorage.removeItem('token');
                sessionStorage.removeItem('refreshToken');
                window.location.href = '/auth';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
