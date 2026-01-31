import Notification, { NotificationType } from '../models/Notification';
import mongoose from 'mongoose';

/**
 * Send a notification to a single user
 */
export const sendNotification = async (
    userId: string | mongoose.Types.ObjectId,
    title: string,
    message: string,
    type: NotificationType = 'info'
) => {
    try {
        await Notification.create({
            userId,
            title,
            message,
            type,
            read: false
        });
    } catch (error) {
        console.error('Error sending notification:', error);
    }
};

/**
 * Send notifications to multiple users
 */
export const sendNotifications = async (
    userIds: (string | mongoose.Types.ObjectId)[],
    title: string,
    message: string,
    type: NotificationType = 'info'
) => {
    try {
        const notifications = userIds.map(userId => ({
            userId,
            title,
            message,
            type,
            read: false
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        console.error('Error sending notifications:', error);
    }
};
