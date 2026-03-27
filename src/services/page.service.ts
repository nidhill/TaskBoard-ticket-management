import api from './api';
import { Page } from '@/types';

export const pageService = {
    async getAll(filters?: { projectId?: string; status?: string }) {
        const params = new URLSearchParams();
        if (filters?.projectId) params.append('projectId', filters.projectId);
        if (filters?.status) params.append('status', filters.status);

        const response = await api.get(`/pages?${params.toString()}`);
        return response.data.pages;
    },

    async getById(id: string) {
        const response = await api.get(`/pages/${id}`);
        return response.data.page;
    },

    async create(data: Partial<Page>) {
        const response = await api.post('/pages', data);
        return response.data.page;
    },

    async update(id: string, data: Partial<Page>) {
        const response = await api.put(`/pages/${id}`, data);
        return response.data.page;
    },

    async delete(id: string) {
        const response = await api.delete(`/pages/${id}`);
        return response.data;
    },
};
