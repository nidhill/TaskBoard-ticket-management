import api from './api';
import { Ticket } from '@/types';

export const ticketService = {
    async getAll(filters?: { pageId?: string; status?: string; priority?: string }) {
        const params = new URLSearchParams();
        if (filters?.pageId) params.append('pageId', filters.pageId);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.priority) params.append('priority', filters.priority);

        const response = await api.get(`/tickets?${params.toString()}`);
        return response.data.tickets;
    },

    async getById(id: string) {
        const response = await api.get(`/tickets/${id}`);
        return response.data.ticket;
    },

    async create(data: Partial<Ticket>) {
        const response = await api.post('/tickets', data);
        return response.data.ticket;
    },

    async update(id: string, data: Partial<Ticket>) {
        const response = await api.put(`/tickets/${id}`, data);
        return response.data.ticket;
    },

    async delete(id: string) {
        const response = await api.delete(`/tickets/${id}`);
        return response.data;
    },
};
