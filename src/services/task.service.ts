import api from './api';
import { Task } from '@/types';

export const taskService = {
    async getAll(filters?: { projectId?: string; status?: string }) {
        const params = new URLSearchParams();
        if (filters?.projectId) params.append('projectId', filters.projectId);
        if (filters?.status) params.append('status', filters.status);

        const response = await api.get(`/tasks?${params.toString()}`);
        return response.data.tasks;
    },

    async getById(id: string) {
        const response = await api.get(`/tasks/${id}`);
        return response.data.task;
    },

    async create(data: Partial<Task>) {
        const response = await api.post('/tasks', data);
        return response.data.task;
    },

    async update(id: string, data: Partial<Task>) {
        const response = await api.put(`/tasks/${id}`, data);
        return response.data.task;
    },

    async delete(id: string) {
        const response = await api.delete(`/tasks/${id}`);
        return response.data;
    },
};
