import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusPill } from '@/components/shared/StatusPill';
import { TicketBadge } from '@/components/shared/TicketBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Loader2,
    ArrowLeft,
    FileText,
    User,
    Calendar,
    AlertCircle,
    Plus,
    Clock,
    CheckCircle2,
    AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PageStatus, Ticket } from '@/types';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import { TicketDetailModal } from '@/components/tickets/TicketDetailModal';

interface Page {
    _id: string;
    projectId: {
        _id: string;
        name: string;
        clientName?: string;
    };
    pageName: string;
    assignedTo?: {
        _id: string;
        name: string;
        avatar_url?: string;
    };
    status: PageStatus;
    ticketUsed: number;
    maxTickets: number;
    createdAt: string;
    updatedAt: string;
}



const statusSteps: { status: PageStatus; label: string }[] = [
    { status: 'draft', label: 'Draft' },
    { status: 'approval_pending', label: 'Pending' },
    { status: 'approved', label: 'Approved' },
    { status: 'in_development', label: 'In Dev' },
    { status: 'developed', label: 'Developed' },
    { status: 'delivered', label: 'Delivered' },
];

export default function PageDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [page, setPage] = useState<Page | null>(null);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);

    // Ticket creation state
    const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false);
    const [isCreatingTicket, setIsCreatingTicket] = useState(false);
    const [newTicket, setNewTicket] = useState({
        issueType: 'bug',
        category: 'content',
        description: '',
        priority: 'medium'
    });

    // Ticket Detail Modal
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

    useEffect(() => {
        if (id) {
            fetchPageData();
        }
    }, [id]);

    const fetchPageData = async () => {
        try {
            setLoading(true);
            const [pageRes, ticketsRes] = await Promise.all([
                api.get(`/pages/${id}`),
                api.get(`/tickets?pageId=${id}`)
            ]);

            setPage(pageRes.data.page);
            setTickets((ticketsRes.data.tickets || []).map((t: any) => t as Ticket));
        } catch (error: any) {
            console.error('Error fetching page data:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to load page data',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async () => {
        if (!newTicket.description.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Please enter a description for the ticket',
                variant: 'destructive'
            });
            return;
        }

        setIsCreatingTicket(true);
        try {
            await api.post('/tickets', {
                pageId: id,
                ...newTicket
            });

            toast({
                title: 'Ticket Created',
                description: 'Your ticket has been submitted successfully',
            });

            setIsCreateTicketOpen(false);
            setNewTicket({
                issueType: 'bug',
                category: 'content',
                description: '',
                priority: 'medium'
            });
            fetchPageData();
        } catch (error: any) {
            console.error('Error creating ticket:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create ticket',
                variant: 'destructive',
            });
        } finally {
            setIsCreatingTicket(false);
        }
    };

    const handleUpdatePageStatus = async (newStatus: PageStatus) => {
        if (!page) return;

        // Don't update if same status
        if (page.status === newStatus) return;

        try {
            // Optimistic update
            setPage({ ...page, status: newStatus });

            await api.put(`/pages/${page._id}`, { status: newStatus });

            toast({
                title: 'Page Status Updated',
                description: `Page moved to ${newStatus.replace('_', ' ')}`,
            });

            fetchPageData();
        } catch (error: any) {
            console.error('Error updating page status:', error);
            toast({
                title: 'Error',
                description: 'Failed to update status',
                variant: 'destructive'
            });
            fetchPageData();
        }
    };

    const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
        try {
            // Optimistic update
            setTickets(tickets.map(t =>
                t._id === ticketId ? { ...t, status: newStatus } : t
            ));

            await api.put(`/tickets/${ticketId}`, { status: newStatus });

            toast({
                title: 'Status Updated',
                description: `Ticket status updated to ${newStatus.replace('_', ' ')}`,
            });

            // Background refresh to ensure consistency
            fetchPageData();
        } catch (error: any) {
            console.error('Error updating ticket status:', error);
            toast({
                title: 'Error',
                description: 'Failed to update ticket status',
                variant: 'destructive'
            });
            // Revert on error
            fetchPageData();
        }
    };

    const getStatusIndex = (status: PageStatus) => {
        return statusSteps.findIndex(s => s.status === status);
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    if (!page || !page.projectId) {
        return (
            <MainLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                    <AlertCircle className="h-12 w-12 text-muted-foreground" />
                    <h2 className="text-2xl font-semibold">Page {(!page) ? 'Not Found' : 'Data Incomplete'}</h2>
                    <p className="text-muted-foreground">The project associated with this page might have been deleted.</p>
                    <Button onClick={() => navigate('/pages')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Pages
                    </Button>
                </div>
            </MainLayout>
        );
    }

    const currentStepIndex = getStatusIndex(page.status);

    return (
        <MainLayout>
            <div className="animate-fade-in space-y-6">
                {/* Back Link */}
                <div className="flex items-center gap-4">
                    <Link
                        to={`/projects/${page.projectId?._id}`}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to {page.projectId?.name || 'Project'}
                    </Link>
                </div>

                {/* Page Header Card */}
                <Card className="glass-card overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-2xl font-bold">{page.pageName}</h1>
                                    <StatusPill status={page.status} />
                                </div>
                                <p className="text-muted-foreground">{page.projectId?.name || 'Unknown Project'}</p>
                            </div>

                            <div className="flex items-center gap-4">
                                <TicketBadge used={page.ticketUsed} max={page.maxTickets} />
                            </div>
                        </div>

                        {/* Status Stepper */}
                        <div className="hidden sm:flex items-center justify-between w-full relative mb-8 px-4">
                            {/* Connecting Line */}
                            <div className="absolute top-4 left-0 w-full h-0.5 bg-muted -z-10" />
                            <div
                                className="absolute top-4 left-0 h-0.5 bg-primary -z-10 transition-all duration-500"
                                style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                            />

                            {statusSteps.map((step, index) => {
                                const isCompleted = index <= currentStepIndex;
                                const isCurrent = index === currentStepIndex;

                                return (
                                    <div
                                        key={step.status}
                                        className="flex flex-col items-center gap-2 bg-background px-2 cursor-pointer group"
                                        onClick={() => handleUpdatePageStatus(step.status)}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 group-hover:scale-110",
                                            isCompleted ? "bg-primary border-primary text-primary-foreground" : "bg-muted border-muted text-muted-foreground",
                                            isCurrent && "ring-4 ring-primary/20"
                                        )}>
                                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                                        </div>
                                        <span className={cn(
                                            "text-xs font-medium transition-colors group-hover:text-primary",
                                            isCompleted ? "text-primary" : "text-muted-foreground"
                                        )}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Meta Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Assigned Developer</p>
                                    <div className="font-medium">
                                        {page.assignedTo ? page.assignedTo.name : 'Unassigned'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Created</p>
                                    <div className="font-medium">
                                        {format(new Date(page.createdAt), 'MMM d, yyyy')}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-0.5">Last Updated</p>
                                    <div className="font-medium">
                                        {format(new Date(page.updatedAt), 'MMM d, yyyy')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tickets Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            Tickets ({tickets.length})
                        </h2>
                        <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Ticket
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Create New Ticket</DialogTitle>
                                    <DialogDescription>
                                        Report an issue or request a change for this page.
                                        {page.ticketUsed >= page.maxTickets && (
                                            <div className="mt-2 flex items-center text-destructive text-sm bg-destructive/10 p-2 rounded">
                                                <AlertTriangle className="w-4 h-4 mr-2" />
                                                Ticket limit reached ({page.maxTickets}/{page.maxTickets})
                                            </div>
                                        )}
                                    </DialogDescription>
                                </DialogHeader>

                                {page.ticketUsed < page.maxTickets ? (
                                    <div className="space-y-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Issue Type</Label>
                                                <Select
                                                    value={newTicket.issueType}
                                                    onValueChange={(v) => setNewTicket({ ...newTicket, issueType: v })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="bug">Bug</SelectItem>
                                                        <SelectItem value="change_request">Change Request</SelectItem>
                                                        <SelectItem value="enhancement">Enhancement</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Category</Label>
                                                <Select
                                                    value={newTicket.category}
                                                    onValueChange={(v) => setNewTicket({ ...newTicket, category: v })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="design">Design</SelectItem>
                                                        <SelectItem value="functionality">Functionality</SelectItem>
                                                        <SelectItem value="content">Content</SelectItem>
                                                        <SelectItem value="performance">Performance</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Priority</Label>
                                            <Select
                                                value={newTicket.priority}
                                                onValueChange={(v) => setNewTicket({ ...newTicket, priority: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="low">Low</SelectItem>
                                                    <SelectItem value="medium">Medium</SelectItem>
                                                    <SelectItem value="high">High</SelectItem>
                                                    <SelectItem value="urgent">Urgent</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Description</Label>
                                            <Textarea
                                                placeholder="Describe the issue or request in detail..."
                                                className="min-h-[100px]"
                                                value={newTicket.description}
                                                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-6 text-center text-muted-foreground">
                                        Cannot create more tickets. Please contact the Department Head or wait for tickets to be resolved.
                                    </div>
                                )}

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsCreateTicketOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleCreateTicket}
                                        disabled={isCreatingTicket || page.ticketUsed >= page.maxTickets}
                                    >
                                        {isCreatingTicket ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Ticket'
                                        )}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {tickets.length === 0 ? (
                        <Card className="glass-card dashed-border">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <FileText className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <h3 className="font-semibold text-lg mb-1">No tickets yet</h3>
                                <p className="text-muted-foreground text-sm max-w-sm">
                                    There are no tickets associated with this page. Create one to report an issue or request a change.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {tickets.map((ticket) => (
                                <Card key={ticket._id} className="glass-card hover-lift">
                                    <CardContent className="p-4">
                                        <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                                            <div className="space-y-1 cursor-pointer" onClick={() => { setSelectedTicket(ticket); setIsTicketModalOpen(true); }}>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="capitalize">
                                                        {ticket.issueType.replace('_', ' ')}
                                                    </Badge>
                                                    <Badge variant="secondary" className="capitalize">
                                                        {ticket.category}
                                                    </Badge>
                                                    {ticket.priority === 'urgent' && (
                                                        <Badge variant="destructive">Urgent</Badge>
                                                    )}
                                                </div>
                                                <p className="font-medium text-foreground">{ticket.description}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{ticket.requestedBy.name}</span>
                                                    <span>•</span>
                                                    <span>{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Select
                                                    defaultValue={ticket.status}
                                                    onValueChange={(val) => handleUpdateTicketStatus(ticket._id, val)}
                                                >
                                                    <SelectTrigger className="w-[130px] h-8">
                                                        <div className="flex items-center gap-2">
                                                            <div className={cn(
                                                                "w-2 h-2 rounded-full",
                                                                ticket.status === 'open' && "bg-blue-500",
                                                                ticket.status === 'in_progress' && "bg-yellow-500",
                                                                ticket.status === 'resolved' && "bg-green-500",
                                                                ticket.status === 'rejected' && "bg-red-500"
                                                            )} />
                                                            <span className="capitalize text-xs">
                                                                {ticket.status.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="open">Open</SelectItem>
                                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                                        <SelectItem value="resolved">Resolved</SelectItem>
                                                        <SelectItem value="rejected">Rejected</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Ticket Detail Modal */}
            {selectedTicket && (
                <TicketDetailModal
                    ticket={selectedTicket}
                    isOpen={isTicketModalOpen}
                    onClose={() => {
                        setIsTicketModalOpen(false);
                        setSelectedTicket(null);
                    }}
                    onUpdate={() => {
                        fetchPageData(); // Refresh list to get status updates
                    }}
                />
            )}
        </MainLayout>
    );
}
