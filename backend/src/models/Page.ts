import mongoose, { Document, Schema } from 'mongoose';

export type PageStatus = 'draft' | 'approval_pending' | 'approved' | 'in_development' | 'developed' | 'delivered';

export interface IPage extends Document {
    projectId: mongoose.Types.ObjectId;
    pageName: string;
    assignedDeveloper?: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    status: PageStatus;
    ticketUsed: number;
    maxTickets: number;
    approvalReference?: string;
    createdAt: Date;
    updatedAt: Date;
}

const pageSchema = new Schema<IPage>(
    {
        projectId: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'Project ID is required'],
        },
        pageName: {
            type: String,
            required: [true, 'Page name is required'],
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
            enum: ['draft', 'approval_pending', 'approved', 'in_development', 'developed', 'delivered'],
            default: 'draft',
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
        approvalReference: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Page = mongoose.model<IPage>('Page', pageSchema);

export default Page;
