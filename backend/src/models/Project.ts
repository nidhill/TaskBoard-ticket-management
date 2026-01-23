import mongoose, { Document, Schema } from 'mongoose';

export type ProjectStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'on_hold' | 'completed' | 'cancelled';

export interface IProject extends Document {
    name: string;
    description?: string;
    clientName?: string;
    startDate?: Date;
    deliveryDate?: Date;
    status: ProjectStatus;
    createdBy: mongoose.Types.ObjectId;
    assignedTo?: mongoose.Types.ObjectId;
    projectHead: mongoose.Types.ObjectId;
    members: {
        user: mongoose.Types.ObjectId;
        role: 'developer' | 'designer' | 'manager' | 'qa' | 'other';
    }[];
    department?: string;
    approvedAt?: Date;
    rejectionReason?: string;

    createdAt: Date;
    updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
    {
        name: {
            type: String,
            required: [true, 'Project name is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        clientName: {
            type: String,
            trim: true,
        },
        startDate: {
            type: Date,
        },
        deliveryDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['draft', 'pending', 'approved', 'active', 'on_hold', 'completed', 'cancelled'],
            default: 'draft',
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        department: {
            type: String,
            trim: true,
        },
        projectHead: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Project Head is required'],
        },
        members: [
            {
                user: {
                    type: Schema.Types.ObjectId,
                    ref: 'User',
                    required: true,
                },
                role: {
                    type: String,
                    enum: ['developer', 'designer', 'manager', 'qa', 'other'],
                    default: 'developer',
                },
            },
        ],
        approvedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

const Project = mongoose.model<IProject>('Project', projectSchema);

export default Project;
