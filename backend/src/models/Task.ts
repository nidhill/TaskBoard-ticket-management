import mongoose, { Document, Schema } from 'mongoose';

export type TaskStatus = 'to_do' | 'in_progress' | 'in_review' | 'done';

export interface ITask extends Document {
    projectId: mongoose.Types.ObjectId;
    taskName: string;
    assignedDeveloper?: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    status: TaskStatus;
    ticketUsed: number;
    maxTickets: number;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
    startDate?: Date;
    approvalReference?: string;
    attachments?: {
        name: string;
        url: string;
        type: string;
    }[];
    urls?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'Project ID is required'],
        },
        taskName: {
            type: String,
            required: [true, 'Task name is required'],
            trim: true,
        },
        assignedDeveloper: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['to_do', 'in_progress', 'in_review', 'done'],
            default: 'to_do',
        },
        ticketUsed: {
            type: Number,
            default: 0,
            min: 0,
        },
        maxTickets: {
            type: Number,
            default: 2,
            min: 0,
        },
        description: {
            type: String,
            default: '',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        dueDate: {
            type: Date,
            default: null,
        },
        startDate: {
            type: Date,
            default: null,
        },
        approvalReference: {
            type: String,
            default: null,
        },
        attachments: [
            {
                name: String,
                url: String,
                type: String
            }
        ],
        urls: [String],
    },
    {
        timestamps: true,
    }
);

const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task;
