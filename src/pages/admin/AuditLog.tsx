import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
    Search,
    Filter,
    Shield,
    FileText,
    User as UserIcon,
    Layout,
    LogIn
} from 'lucide-react';
import api from '@/services/api';
import { AuditLogEntry } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const AuditLog = () => {
    const navigate = useNavigate();
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [filterAction, setFilterAction] = useState('');

    useEffect(() => {
        if (!loading && user?.role !== 'admin') {
            navigate('/');
            return;
        }

        if (user?.role === 'admin') {
            fetchLogs();
        }
    }, [user, loading, navigate, filterAction]);

    const fetchLogs = async () => {
        setIsLoadingLogs(true);
        try {
            const params: any = {};
            if (filterAction) params.action = filterAction;

            const response = await api.get('/audit-logs', { params });
            // response.data.logs
            setLogs(response.data.logs);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch audit logs',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingLogs(false);
        }
    };

    const getActionIcon = (action: string) => {
        if (action.includes('LOGIN') || action.includes('REGISTER')) return <LogIn className="w-4 h-4 text-blue-500" />;
        if (action.includes('PROJECT')) return <Layout className="w-4 h-4 text-purple-500" />;
        if (action.includes('TICKET')) return <FileText className="w-4 h-4 text-orange-500" />;
        if (action.includes('USER') || action.includes('AUTH')) return <UserIcon className="w-4 h-4 text-green-500" />;
        return <Shield className="w-4 h-4 text-gray-500" />;
    };

    if (loading || isLoadingLogs && logs.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit Log</h1>
                <p className="text-muted-foreground">
                    Track system activities, security events, and user actions.
                </p>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4 bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search logs..."
                        className="w-full pl-9 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        disabled
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <select
                        className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                    >
                        <option value="">All Actions</option>
                        <option value="LOGIN">Login</option>
                        <option value="REGISTER">Register</option>
                        <option value="CREATE_PROJECT">Create Project</option>
                        <option value="UPDATE_PROJECT_STATUS">Update Project Status</option>
                        <option value="CREATE_TICKET">Create Ticket</option>
                        <option value="UPDATE_TICKET_STATUS">Update Ticket Status</option>
                        <option value="DELETE_PROJECT">Delete Project</option>
                        <option value="DELETE_TICKET">Delete Ticket</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-md border bg-card shadow-sm overflow-hidden flex-1">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground font-medium">
                            <tr>
                                <th className="px-4 py-3">Timestamp</th>
                                <th className="px-4 py-3">Action</th>
                                <th className="px-4 py-3">User</th>
                                <th className="px-4 py-3">Details</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {logs.map((log) => (
                                <tr key={log._id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                                        {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        <div className="flex items-center space-x-2">
                                            {getActionIcon(log.action)}
                                            <span>{log.action.replace(/_/g, ' ')}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center space-x-2">
                                            {log.userId?.avatar_url && (
                                                <img
                                                    src={log.userId.avatar_url}
                                                    alt={log.userId.name}
                                                    className="w-6 h-6 rounded-full bg-secondary"
                                                />
                                            )}
                                            <span>{log.userId?.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 max-w-md truncate" title={log.details}>
                                        {log.details}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                            {log.resourceType || 'Other'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                                        {log.ipAddress || '-'}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                        No audit logs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
