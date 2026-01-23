import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusPill } from '@/components/shared/StatusPill';
import { TicketBadge } from '@/components/shared/TicketBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Search, User, ExternalLink, FolderOpen, CheckCircle, XCircle, Unlock, Clock, Plus, Loader2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import api from '@/services/api';
import { TaskStatus } from '@/types';

const statusSteps: { status: TaskStatus; label: string }[] = [
  { status: 'to_do', label: 'TO DO' },
  { status: 'in_progress', label: 'IN PROGRESS' },
  { status: 'in_review', label: 'IN REVIEW' },
  { status: 'done', label: 'DONE' },
];

interface Task {
  _id: string;
  taskName: string;
  projectId: {
    _id: string;
    name: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    avatar_url?: string;
  };
  status: string;
  ticketUsed: number;
  maxTickets: number;
  approvalReference?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Task request dialog state
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Deletion state
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { role, user } = useAuth();
  console.log('Current User in Pages:', user);
  const permissions = usePermissions();
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data.projects || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tasks');
      setTasks(response.data.tasks || []);
    } catch (error: any) {
      console.error('Error fetching pages:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load pages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!selectedProjectId) {
      toast({
        title: 'Validation Error',
        description: 'Please select a project',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingTask(true);
    try {
      await api.post('/tasks', {
        projectId: selectedProjectId,
        taskName: newTaskName,
        status: 'to_do',
        maxTickets: 2,
      });

      toast({
        title: 'Page Requested',
        description: 'Your task request has been submitted successfully',
      });

      setSelectedProjectId('');
      setIsRequestDialogOpen(false);
      fetchTasks();
    } catch (error: any) {
      console.error('Error creating page:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create task request',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedTask || !newStatus) return;

    setIsUpdating(true);
    try {
      await api.put(`/tasks/${selectedTask._id}`, { status: newStatus });

      toast({
        title: 'Status Updated',
        description: `Page status has been updated to ${newStatus.replace('_', ' ')}`,
      });

      setIsStatusDialogOpen(false);
      setSelectedTask(null);
      setNewStatus('');
      fetchTasks();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApprove = async (task: Task) => {
    try {
      await api.put(`/tasks/${task._id}`, { status: 'approved' });
      toast({
        title: 'Task Approved',
        description: 'The task has been approved successfully',
      });
      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve task',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTask = async (pageId: string) => {
    setIsDeleting(true);
    try {
      await api.delete(`/tasks/${pageId}`);
      toast({
        title: 'Task Deleted',
        description: 'Page has been deleted successfully',
      });
      fetchTasks();
      setTaskToDelete(null);
    } catch (error: any) {
      console.error('Error deleting page:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete task',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReject = async (task: Task) => {
    try {
      await api.put(`/tasks/${task._id}`, { status: 'draft' }); // Rejected pages go back to draft
      toast({
        title: 'Task Rejected',
        description: 'The task has been rejected',
      });
      fetchTasks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject task',
        variant: 'destructive',
      });
    }
  };

  const openStatusDialog = (task: Task) => {
    setSelectedTask(task);
    setNewStatus(task.status);
    setIsStatusDialogOpen(true);
  };

  const filteredTasks = tasks.filter((task) => {
    const projectName = task.projectId?.name || '';
    const matchesSearch = projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingApprovals = tasks.filter(p => p.status === 'to_do').length;

  const getStatusIndex = (status: string) => {
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

  return (
    <MainLayout>
      <PageHeader
        title="Tasks"
        description="View and manage all tasks across your projects."
        actions={
          permissions.canCreatePage && (
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Request Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request New Task</DialogTitle>
                  <DialogDescription>
                    Submit a request for a new task to be developed for a project.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Task Name</Label>
                    <Input
                      placeholder="e.g. Landing Task, Dashboard, etc."
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map(project => (
                          <SelectItem key={project._id} value={project._id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      📝 Your task request will be submitted for approval by the Department Head.
                      Once approved, it will be assigned to a developer.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTask} disabled={isCreatingTask}>
                    {isCreatingTask ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Requesting...
                      </>
                    ) : (
                      'Request Task'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )
        }
      />

      {/* Role Info Banner */}
      {
        role && (
          <div className={cn(
            'mb-6 p-4 rounded-lg border',
            role === 'requester' && 'bg-muted/50 border-muted',
            role === 'developer' && 'bg-info/5 border-info/20',
            role === 'department_head' && 'bg-warning/5 border-warning/20',
            role === 'tech_admin' && 'bg-destructive/5 border-destructive/20'
          )}>
            <p className="text-sm text-muted-foreground">
              {role === 'requester' && '📄 As a Requester, you can request new tasks and view their status.'}
              {role === 'developer' && '🔧 As a Developer, you can update page status through the workflow.'}
              {role === 'department_head' && (
                <>{pendingApprovals > 0 ? `✅ As a Department Head, you can approve/reject tasks. ${pendingApprovals} tasks pending approval.` : '✅ As a Department Head, you can approve/reject tasks.'}</>
              )}
              {role === 'tech_admin' && '🔑 As a Tech Admin, you have full control over all tasks.'}
            </p>
          </div>
        )
      }

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="to_do">TO DO</SelectItem>
            <SelectItem value="in_progress">IN PROGRESS</SelectItem>
            <SelectItem value="in_review">IN REVIEW</SelectItem>
            <SelectItem value="done">DONE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pages List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task._id} className="glass-card hover-lift">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-foreground">{task.taskName || `Task #${task._id.slice(-6)}`}</h3>
                    <StatusPill status={task.status as any} />
                  </div>

                  {/* Status Timeline */}
                  <div className="hidden sm:flex items-center gap-1 mb-3">
                    {statusSteps.map((step, index) => {
                      const currentStepIndex = getStatusIndex(task.status);
                      return (
                        <div key={step.status} className="flex items-center">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full transition-colors',
                              index <= currentStepIndex
                                ? 'bg-primary'
                                : 'bg-muted'
                            )}
                          />
                          {index < statusSteps.length - 1 && (
                            <div
                              className={cn(
                                'w-8 h-0.5 transition-colors',
                                index < currentStepIndex
                                  ? 'bg-primary'
                                  : 'bg-muted'
                              )}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FolderOpen className="w-4 h-4" />
                      <span>{task.projectId?.name || 'Unknown Project'}</span>
                    </div>
                    {task.assignedTo ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarImage src={task.assignedTo.avatar_url} />
                          <AvatarFallback className="text-[10px]">
                            {task.assignedTo.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{task.assignedTo.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground/60">
                        <User className="w-4 h-4" />
                        <span>Unassigned</span>
                      </div>
                    )}
                    <span>Updated {format(new Date(task.updatedAt), 'MMM d, yyyy')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Tickets</p>
                    <TicketBadge used={task.ticketUsed} max={task.maxTickets} />
                  </div>

                  {/* Role-specific actions */}
                  <div className="flex items-center gap-2">
                    {/* Approve/Reject for Dept Head & Tech Admin */}
                    {permissions.canApprovePage && task.status === 'approval_pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-success border-success/30 hover:bg-success/10"
                          onClick={() => handleApprove(task)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => handleReject(task)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {/* Update Status for Developers */}
                    {permissions.canUpdatePageStatus && task.status !== 'done' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={() => openStatusDialog(task)}
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        Update Status
                      </Button>
                    )}

                    {/* Unlock for Dept Head when tickets exhausted */}
                    {permissions.canUnlockPage && task.ticketUsed >= task.maxTickets && (
                      <Button size="sm" variant="outline" className="h-8 text-warning border-warning/30 hover:bg-warning/10">
                        <Unlock className="w-4 h-4 mr-1" />
                        Unlock
                      </Button>
                    )}

                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/tasks/${task._id}`}>
                        View
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>

                    {/* Delete for Admin and Creators of Drafts */}
                    {(permissions.canDeletePage || user?.role === 'admin' || (!task.createdBy || (typeof task.createdBy === 'object' ? (task.createdBy as any)._id : task.createdBy) === user?.id)) && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the task
                              "{task.taskName}" and all associated tickets.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDeleteTask(task._id)}
                            >
                              {isDeleting ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {
        filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No tasks found matching your criteria.</p>
          </div>
        )
      }

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Task Status</DialogTitle>
            <DialogDescription>
              Change the status of this task to move it through the workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="to_do">TO DO</SelectItem>
                  <SelectItem value="in_progress">IN PROGRESS</SelectItem>
                  <SelectItem value="in_review">IN REVIEW</SelectItem>
                  <SelectItem value="done">DONE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout >
  );
}
