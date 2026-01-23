import api from './api';
import { Project } from '@/types';

export const projectService = {
    async getAll() {
        const response = await api.get('/projects');
        return response.data.projects;
    },

    async getById(id: string) {
        const response = await api.get(`/projects/${id}`);
        return response.data.project;
    },

    async create(data: Partial<Project>) {
        const response = await api.post('/projects', data);
        return response.data.project;
    },

    async update(id: string, data: Partial<Project>) {
        const response = await api.put(`/projects/${id}`, data);
        return response.data.project;
    },

    async delete(id: string) {
        const response = await api.delete(`/projects/${id}`);
        return response.data;
    },
};
