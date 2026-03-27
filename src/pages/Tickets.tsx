import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusPill } from '@/components/shared/StatusPill';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Plus, Bug, AlertCircle, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';

interface Ticket {
  _id: string;
  taskId: {
    _id: string;
    projectId: {
      name: string;
    };
  };
  requestedBy: {
    _id: string;
    name: string;
    avatar_url?: string;
  };
  issueType: string;
  category: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
}

interface Task {
  _id: string;
  projectId: {
    name: string;
  };
  taskName: string;
  ticketUsed: number;
  maxTickets: number;
  status: string;
}

export default function Tickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [issueType, setIssueType] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [description, setDescription] = useState('');

  const { role } = useAuth();
  const permissions = usePermissions();
  const { toast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchTickets();
    fetchTasks();

    // Check for create param
    if (searchParams.get('create') === 'true') {
      setIsDialogOpen(true);
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('create');
      setSearchParams(newParams, { replace: true });
    }

    // Check for status param
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('status');
      setSearchParams(newParams, { replace: true });
    }
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tickets');
      setTickets(response.data.tickets || []);
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load tickets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks');
      setTasks(response.data.tasks || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleCreateTicket = async () => {
    if (!selectedTaskId || !issueType || !category || !priority || !description) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      await api.post('/tickets', {
        taskId: selectedTaskId,
        issueType,
        category,
        description,
        priority,
      });

      toast({
        title: 'Ticket Created',
        description: 'Your ticket has been created successfully',
      });

      // Reset form
      setSelectedTaskId('');
      setIssueType('');
      setCategory('');
      setPriority('');
      setDescription('');
      setIsDialogOpen(false);

      // Refresh data
      fetchTickets();
      fetchTasks();
    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create ticket',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleResolve = async (ticketId: string) => {
    try {
      await api.put(`/tickets/${ticketId}`, { status: 'resolved' });
      toast({
        title: 'Ticket Resolved',
        description: 'The ticket has been marked as resolved',
      });
      fetchTickets();
      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to resolve ticket',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (ticketId: string) => {
    try {
      await api.put(`/tickets/${ticketId}`, { status: 'rejected' });
      toast({
        title: 'Ticket Rejected',
        description: 'The ticket has been rejected',
      });
      fetchTickets();
      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject ticket',
        variant: 'destructive',
      });
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = ticket.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesType = typeFilter === 'all' || ticket.issueType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="Tickets"
        description="Track and manage all tickets across your pages."
        actions={
          permissions.canCreateTicket && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  New Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Ticket</DialogTitle>
                  <DialogDescription>
                    Raise a new ticket for a page. Change requests count towards the 2-ticket limit.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Page</Label>
                    <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a page" />
                      </SelectTrigger>
                      <SelectContent>
                        {tasks.map(task => (
                          <SelectItem key={task._id} value={task._id}>
                            <div className="flex items-center gap-2">
                              <span>{task.taskName} ({task.projectId?.name || 'Unknown Project'})</span>
                              <Badge variant="outline" className="text-xs">
                                {task.ticketUsed}/{task.maxTickets}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Issue Type</Label>
                    <Select value={issueType} onValueChange={setIssueType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="change_request">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-warning" />
                            <span>Change Request</span>
                            <span className="text-xs text-muted-foreground">(Uses ticket limit)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="bug">
                          <div className="flex items-center gap-2">
                            <Bug className="w-4 h-4 text-destructive" />
                            <span>Development Bug</span>
                            <span className="text-xs text-muted-foreground">(No limit)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="content">Content</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="layout">Layout</SelectItem>
                        <SelectItem value="functionality">Functionality</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe the issue in detail..."
                      className="min-h-[100px]"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTicket} disabled={isCreating}>
                    {isCreating ? (
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
          )
        }
      />

      {/* Role Info Banner */}
      {role && (
        <div className={cn(
          'mb-6 p-4 rounded-lg border',
          role === 'requester' && 'bg-muted/50 border-muted',
          role === 'developer' && 'bg-info/5 border-info/20',
          role === 'department_head' && 'bg-warning/5 border-warning/20',
          role === 'tech_admin' && 'bg-destructive/5 border-destructive/20'
        )}>
          <p className="text-sm text-muted-foreground">
            {role === 'requester' && '📝 As a Requester, you can create tickets for pages (max 2 change requests per page).'}
            {role === 'developer' && '🔧 As a Developer, you can resolve tickets and update their status.'}
            {role === 'department_head' && '✅ As a Department Head, you can review tickets and unlock pages.'}
            {role === 'tech_admin' && '🔑 As a Tech Admin, you have full control over all tickets.'}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="change_request">Change Request</SelectItem>
            <SelectItem value="bug">Dev Bug</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      <div className="space-y-4">
        {filteredTickets.map((ticket) => (
          <Card key={ticket._id} className="glass-card hover-lift">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className={cn(
                  'p-3 rounded-xl self-start',
                  ticket.issueType === 'bug'
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-warning/10 text-warning'
                )}>
                  {ticket.issueType === 'bug' ? (
                    <Bug className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-medium text-foreground">{ticket.description}</h3>
                    <StatusPill status={ticket.status as any} />
                    <Badge variant="outline" className="capitalize">
                      {ticket.priority}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>{ticket.taskId?.projectId?.name || 'Unknown Project'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={ticket.requestedBy?.avatar_url} />
                        <AvatarFallback className="text-[10px]">
                          {ticket.requestedBy?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span>{ticket.requestedBy?.name || 'Unknown'}</span>
                    </div>
                    <span>{format(new Date(ticket.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {ticket.category}
                  </Badge>
                  {ticket.issueType === 'bug' && (
                    <Badge variant="outline" className="text-xs">
                      No limit
                    </Badge>
                  )}

                  {/* Role-specific actions */}
                  {permissions.canResolveTicket && ticket.status !== 'resolved' && ticket.status !== 'rejected' && (
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-success border-success/30 hover:bg-success/10"
                        onClick={() => handleResolve(ticket._id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => handleReject(ticket._id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTickets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No tickets found matching your criteria.</p>
        </div>
      )}
    </MainLayout>
  );
}
