import mongoose, { Document, Schema } from 'mongoose';

export type TicketIssueType = 'change_request' | 'bug';
export type TicketCategory = 'content' | 'design' | 'layout' | 'functionality' | 'performance';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'rejected';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface ITicket extends Document {
    taskId: mongoose.Types.ObjectId;
    requestedBy: mongoose.Types.ObjectId;
    issueType: TicketIssueType;
    category: TicketCategory;
    description: string;
    priority: TicketPriority;
    status: TicketStatus;
    approvalReference?: string;
    attachments?: { name: string; url: string; type: string }[];
    createdAt: Date;
    updatedAt: Date;
}

const ticketSchema = new Schema<ITicket>(
    {
        taskId: {
            type: Schema.Types.ObjectId,
            ref: 'Task',
            required: [true, 'Task ID is required'],
        },
        requestedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Requester is required'],
        },
        issueType: {
            type: String,
            enum: ['bug', 'change_request'],
            required: [true, 'Issue type is required'],
        },
        category: {
            type: String,
            enum: ['content', 'design', 'layout', 'functionality', 'performance'],
            required: [true, 'Category is required'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high', 'urgent'],
            default: 'medium',
        },
        status: {
            type: String,
            enum: ['open', 'in_progress', 'resolved', 'rejected'],
            default: 'open',
        },
        approvalReference: {
            type: String,
            default: null,
        },
        attachments: [{
            name: String,
            url: String,
            type: String
        }],
    },
    {
        timestamps: true,
    }
);

const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);

export default Ticket;
