import api from './api';
import { Notification } from '@/types';

export const notificationService = {
    async getAll() {
        const response = await api.get('/notifications');
        return response.data.notifications;
    },

    async markAsRead(id: string) {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data.notification;
    },

    async markAllAsRead() {
        const response = await api.put('/notifications/read-all');
        return response.data;
    },
};
