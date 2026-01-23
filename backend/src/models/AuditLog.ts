import mongoose, { Document, Schema } from 'mongoose';

export type AuditAction = 'LOGIN' | 'REGISTER' | 'CREATE_PROJECT' | 'UPDATE_PROJECT_STATUS' | 'CREATE_TICKET' | 'UPDATE_TICKET_STATUS' | 'USER_ROLE_UPDATE' | 'DELETE_PROJECT' | 'DELETE_TICKET' | 'DELETE_USER';

export interface IAuditLog extends Document {
    userId: mongoose.Types.ObjectId;
    action: AuditAction;
    details: string;
    resourceId?: string; // ID of the project/ticket/user affected
    resourceType?: 'Project' | 'Ticket' | 'User' | 'Auth';
    ipAddress?: string;
    createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            required: true,
        },
        details: {
            type: String,
            required: true,
        },
        resourceId: {
            type: String,
        },
        resourceType: {
            type: String,
            enum: ['Project', 'Ticket', 'User', 'Auth'],
        },
        ipAddress: {
            type: String,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false }, // Only createdAt needed
    }
);

const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLog;
