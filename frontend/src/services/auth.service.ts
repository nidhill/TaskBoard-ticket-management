import api from './api';

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    department: string;
    role?: string;
}

export interface UserResponse {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    avatar_url?: string;
    notifications?: {
        email: boolean;
        pageApproval: boolean;
        ticketUpdates: boolean;
        ticketLimit: boolean;
    };
}

export const authService = {
    async login(data: LoginData) {
        const response = await api.post('/auth/login', data);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },

    async register(data: RegisterData) {
        const response = await api.post('/auth/register', data);
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
        }
        return response.data;
    },

    async getCurrentUser(): Promise<UserResponse> {
        const response = await api.get('/auth/me');
        return response.data.user;
    },

    async updateProfile(id: string, data: Partial<UserResponse>) {
        const response = await api.put(`/users/${id}`, data);
        return response.data;
    },

    logout() {
        localStorage.removeItem('token');
    },
};
