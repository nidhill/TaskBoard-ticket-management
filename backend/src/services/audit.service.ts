import AuditLog, { AuditAction } from '../models/AuditLog';

interface LogData {
    userId: string;
    action: AuditAction;
    details: string;
    resourceId?: string;
    resourceType?: 'Project' | 'Ticket' | 'User' | 'Auth';
    ipAddress?: string;
}

export const logAudit = async (data: LogData) => {
    try {
        await AuditLog.create({
            userId: data.userId,
            action: data.action,
            details: data.details,
            resourceId: data.resourceId,
            resourceType: data.resourceType,
            ipAddress: data.ipAddress
        });
    } catch (error) {
        console.error('Audit Log Error:', error);
        // We don't want to crash the request if logging fails, just log to console
    }
};
