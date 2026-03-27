import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'info' | 'warning' | 'success' | 'error';

export interface INotification extends Document {
    userId: mongoose.Types.ObjectId;
    title: string;
    message: string;
    type: NotificationType;
    read: boolean;
    createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
        },
        message: {
            type: String,
            required: [true, 'Message is required'],
            trim: true,
        },
        type: {
            type: String,
            enum: ['info', 'warning', 'success', 'error'],
            default: 'info',
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
