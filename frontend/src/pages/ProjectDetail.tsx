import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusPill } from '@/components/shared/StatusPill';
import { TicketBadge } from '@/components/shared/TicketBadge';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AddTaskDialog } from '@/components/tasks/AddTaskDialog';
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
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  Plus,
  ExternalLink,
  User,
  CheckCircle,
  XCircle,
  Unlock,
  Loader2,
  Trash2,
  ChevronsUpDown,
  Check
} from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { EditProjectDialog } from '@/components/projects/EditProjectDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { TaskStatus } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const statusSteps: { status: TaskStatus; label: string }[] = [
  { status: 'to_do', label: 'TO DO' },
  { status: 'in_progress', label: 'IN PROGRESS' },
  { status: 'in_review', label: 'IN REVIEW' },
  { status: 'done', label: 'DONE' },
];

interface ProjectDetail {
  _id: string;
  name: string;
  description: string;
  clientName: string;
  startDate: string;
  deliveryDate: string;
  status: string;
  tasksCount: number;
  completedTasks: number;
  projectHeads?: { _id: string; name: string; email: string }[] | string[];
  approvals?: {
    head: string;
    status: 'pending' | 'approved' | 'rejected';
    date?: string;
    comment?: string;
  }[];
  createdBy?: { _id: string; name: string; email: string } | string;
  members?: { user: { _id: string; name: string; email: string; avatar_url?: string } | string; role: string }[];
}

interface Task {
  id: string;
  _id: string;
  taskName: string;
  status: TaskStatus;
  ticketUsed: number;
  maxTickets: number;
  updatedAt: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignedDeveloper?: {
    name: string;
    avatar?: string;
  };
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const permissions = usePermissions();
  const { toast } = useToast();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditProjectDialogOpen, setIsEditProjectDialogOpen] = useState(false);

  // Add page dialog state
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Deletion state
  const [isDeleting, setIsDeleting] = useState(false);

  // Description expansion state
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  useEffect(() => {
    if (id === 'new') {
      navigate('/projects?create=true', { replace: true });
      return;
    }

    // Validate ID format (24 hex characters)
    if (id && !/^[0-9a-fA-F]{24}$/.test(id)) {
      toast({
        title: 'Invalid Project',
        description: 'The project ID is invalid.',
        variant: 'destructive',
      });
      navigate('/projects', { replace: true });
      return;
    }

    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      // Fetch project details
      const projectRes = await api.get(`/projects/${id}`);
      setProject(projectRes.data.project);

      // Fetch tasks for this project
      const tasksRes = await api.get(`/tasks?projectId=${id}`);
      setTasks(tasksRes.data.tasks || []);
    } catch (error: any) {
      console.error('Error fetching project details:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load project details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a task name',
        variant: 'destructive',
      });
      return;
    }

    setIsAddingTask(true);
    try {
      await api.post('/tasks', {
        projectId: id,
        taskName: newTaskName,
        status: 'to_do',
        maxTickets: 2,
      });

      toast({
        title: 'Task Added',
        description: 'Task has been successfully created',
      });

      setNewTaskName('');
      setIsAddTaskDialogOpen(false);
      fetchProjectDetails();
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add task',
        variant: 'destructive',
      });
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleApproveTask = async (taskId: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: 'approved' });
      toast({
        title: 'Task Approved',
        description: 'Task has been successfully approved',
      });
      fetchProjectDetails();
    } catch (error: any) {
      console.error('Error approving page:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to approve page',
        variant: 'destructive',
      });
    }
  };

  const handleRejectTask = async (taskId: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: 'draft' }); // Rejecting moves back to draft/rejected
      toast({
        title: 'Task Rejected',
        description: 'Task has been rejected',
      });
      fetchProjectDetails();
    } catch (error: any) {
      console.error('Error rejecting page:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reject page',
        variant: 'destructive',
      });
    }
  };

  const handleUnlockTask = async (taskId: string) => {
    try {
      // Assuming unlock implies increasing ticket limit or resetting? 
      // For now, let's assume it increases limit by 5
      await api.put(`/tasks/${taskId}`, { maxTickets: 10 }); // Example logic
      toast({
        title: 'Task Unlocked',
        description: 'Ticket limit has been increased',
      });
      fetchProjectDetails();
    } catch (error: any) {
      console.error('Error unlocking page:', error);
      toast({
        title: 'Error',
        description: 'Failed to unlock page',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await api.delete(`/projects/${id}`);
      toast({
        title: 'Project Deleted',
        description: 'Project has been deleted successfully',
      });
      navigate('/projects');
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete project',
        variant: 'destructive',
      });
      setIsDeleting(false);
    }
  };

  // Team Member Management
  const [openMemberCombobox, setOpenMemberCombobox] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState('developer');

  useEffect(() => {
    if (openMemberCombobox) {
      searchUsers('');
    }
  }, [openMemberCombobox]);

  const searchUsers = async (query: string) => {
    try {
      const response = await api.get(`/users/search?q=${query}`);
      setFoundUsers(response.data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!project) return;

    // Check if already a member
    // Check if already a member
    if (project.members?.some(m => {
      const id = typeof m.user === 'object' ? m.user._id : m.user;
      return id === userId;
    })) {
      toast({ title: "User already added", variant: "destructive" });
      return;
    }

    // Prepare new members list
    // We need to send IDs, not objects. 
    // Existing members might be populated objects, so we map them back to { user: id, role }
    const currentMembers = project.members?.map(m => ({
      user: (m.user as any)._id || m.user,
      role: m.role
    })) || [];

    const newMembers = [...currentMembers, { user: userId, role: selectedRole }];

    try {
      await api.put(`/projects/${project._id}`, { members: newMembers });
      toast({ title: 'Member Added', description: 'Team member added successfully' });
      setOpenMemberCombobox(false);
      fetchProjectDetails();
    } catch (error: any) {
      console.error('Error adding member:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add member',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!project) return;

    const newMembers = project.members?.filter(m => {
      const mId = (m.user as any)._id || m.user;
      return mId !== userId;
    }).map(m => ({
      user: (m.user as any)._id || m.user,
      role: m.role
    }));

    try {
      await api.put(`/projects/${project._id}`, { members: newMembers });
      toast({ title: 'Member Removed', description: 'Team member removed successfully' });
      fetchProjectDetails();
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to remove member',
        variant: 'destructive'
      });
    }
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

  if (!project) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Project not found.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/projects">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Link>
          </Button>
        </div>
      </MainLayout>
    );
  }

  const daysUntilDeadline = project.deliveryDate ? differenceInDays(new Date(project.deliveryDate), new Date()) : 0;

  const getStatusIndex = (status: TaskStatus) => {
    return statusSteps.findIndex(s => s.status === status);
  };

  // const { user } = useAuth(); // Moved to top level

  const isProjectHead = project && user && project.projectHeads && (
    Array.isArray(project.projectHeads) && project.projectHeads.some((head: any) =>
      (typeof head === 'string' ? head === user.id : head._id === user.id)
    )
  );

  const isProjectActive = project?.status === 'active';
  const canManageTeam = (permissions.canUpdateProject || isProjectHead) && isProjectActive;

  const isCreator = project && user && (
    (typeof project.createdBy === 'string' && project.createdBy === user.id) ||
    (typeof project.createdBy === 'object' && (project.createdBy as any)._id === user.id)
  );

  console.log('Project Deletion Debug:', {
    projectCreatedBy: project?.createdBy,
    userId: user?.id,
    isCreator,
    canDelete: permissions.canDeleteProject
  });

  return (
    <MainLayout>
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/projects" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Link>
        </Button>
      </div>

      {/* Custom Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <p className="text-muted-foreground mt-1">{project.clientName}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill status={project.status as any} />

            {permissions.canDeleteProject && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Project
                  </Button>
                </AlertDialogTrigger>
                {isCreator ? (
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Action Restricted</AlertDialogTitle>
                      <AlertDialogDescription>
                        As the project creator, you do not have permission to delete this project.
                        Please contact an administrator if deletion is required.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Close</AlertDialogCancel>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                ) : (
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the project
                        "{project.name}" and all associated pages and tickets.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={handleDeleteProject}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                )}
              </AlertDialog>
            )}

            {canManageTeam && (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditProjectDialogOpen(true)}>
                  Edit Project
                </Button>
                {project && (
                  <EditProjectDialog
                    project={project}
                    open={isEditProjectDialogOpen}
                    onOpenChange={setIsEditProjectDialogOpen}
                    onSuccess={() => {
                      fetchProjectDetails();
                    }}
                  />
                )}
              </>
            )}

            {permissions.canCreatePage && isProjectActive && (
              <>
                <Button onClick={() => setIsAddTaskDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
                <AddTaskDialog
                  projectId={id!}
                  projectMembers={project.members || []}
                  open={isAddTaskDialogOpen}
                  onOpenChange={setIsAddTaskDialogOpen}
                  onSuccess={() => {
                    fetchProjectDetails();
                  }}
                />
              </>
            )}
          </div>
        </div>

        {/* Modern Description Card */}
        {project.description && (
          <Card className="glass-card overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 mt-0.5">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    Project Requirements Document (PRD)
                  </h3>
                  <div className={cn(
                    "text-sm text-muted-foreground leading-relaxed transition-all duration-300",
                    !isDescriptionExpanded && "line-clamp-3"
                  )}>
                    {project.description}
                  </div>
                  {project.description && project.description.length > 200 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 text-xs font-medium text-primary hover:text-primary/80"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    >
                      {isDescriptionExpanded ? '← Show Less' : 'Read More →'}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Role Info Banner */}
      {role && (
        <div className={cn(
          'mb-6 p-4 rounded-lg border',
          role === 'user' && 'bg-muted/50 border-muted',
          role === 'admin' && 'bg-destructive/5 border-destructive/20'
        )}>
          <p className="text-sm text-muted-foreground">
            {role === 'user' && '📄 As a User, you can manage your projects and collaborate on tasks.'}
            {role === 'admin' && '🔑 As an Admin, you have full control over the system.'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 space-y-6">
          {/* Project Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Pages</p>
                  <p className="text-2xl font-semibold">{tasks.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10">
                  <Calendar className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="text-lg font-semibold">
                    {project.startDate ? format(new Date(project.startDate), 'MMM d, yyyy') : 'N/A'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={cn(
                  'p-3 rounded-xl',
                  daysUntilDeadline < 7 ? 'bg-destructive/10' : 'bg-warning/10'
                )}>
                  <Clock className={cn(
                    'w-5 h-5',
                    daysUntilDeadline < 7 ? 'text-destructive' : 'text-warning'
                  )} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className="text-lg font-semibold">
                    {project.deliveryDate ? format(new Date(project.deliveryDate), 'MMM d, yyyy') : 'N/A'}
                  </p>
                  <p className={cn(
                    'text-xs',
                    daysUntilDeadline < 7 ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {project.deliveryDate ? (daysUntilDeadline > 0 ? `${daysUntilDeadline} days left` : 'Overdue') : 'No deadline'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">Progress</p>
                <p className="text-2xl font-semibold mb-2">
                  {tasks.length ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0}%
                </p>
                <ProgressBar
                  value={tasks.filter(t => t.status === 'done').length}
                  max={tasks.length || 1}
                  showLabel={false}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Team Members Card */}
        <div className="md:col-span-1">
          <Card className="glass-card h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Team Members
              </CardTitle>
              {/* Add Member Button - Only for Project Head or Admin (or Creator) */}
              {canManageTeam && (
                <Popover open={openMemberCombobox} onOpenChange={setOpenMemberCombobox}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[300px]" align="end">
                    <div className="p-2 border-b">
                      <p className="text-sm font-medium mb-1.5 px-1">Role</p>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="developer">Developer</SelectItem>
                          <SelectItem value="designer">Designer</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="qa">QA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Search users..."
                        value={memberSearchQuery}
                        onValueChange={(val) => {
                          setMemberSearchQuery(val);
                          searchUsers(val);
                        }}
                      />
                      <CommandList>
                        <CommandEmpty>No users found.</CommandEmpty>
                        <CommandGroup heading="Suggestions">
                          {foundUsers.map((user) => {
                            // Check if already added
                            const isAdded = project.members?.some(m => {
                              const mId = (m.user as any)._id || m.user;
                              return mId === user._id;
                            }) || (project.projectHeads as any[])?.some((h: any) => (h._id || h) === user._id);

                            return (
                              <CommandItem
                                key={user._id}
                                value={user._id}
                                onSelect={() => handleAddMember(user._id)}
                                disabled={isAdded}
                                className="flex items-center gap-2"
                              >
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={user.avatar_url} />
                                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span>{user.name}</span>
                                  <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                                {isAdded && <Check className="ml-auto h-4 w-4 opacity-50" />}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Project Head */}
                {/* Project Heads */}
                {project.projectHeads && project.projectHeads.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {project.projectHeads.map((head: any, index: number) => {
                      const headId = typeof head === 'object' ? head._id : head;
                      const approval = project.approvals?.find(a => a.head === headId);
                      const status = approval?.status || 'pending';

                      return (
                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-primary/5 border border-primary/10">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {typeof head === 'object' ? head.name?.charAt(0) : 'H'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="overflow-hidden flex-1">
                            <p className="text-sm font-medium truncate">
                              {typeof head === 'object' ? head.name : 'Project Head'}
                            </p>
                            <div className="flex items-center gap-2">
                              {/* <p className="text-xs text-muted-foreground">Project Head</p> */}
                              {status === 'approved' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">Approved</span>}
                              {status === 'rejected' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20">Rejected</span>}
                              {status === 'pending' && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 border border-orange-500/20">Pending</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Users Lists */}
                {project.members && project.members.length > 0 ? (
                  project.members.map((member: any, index: number) => (
                    <div key={index} className="flex items-center justify-between group p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={member.user?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {member.user?.name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium truncate">{member.user?.name || 'Unknown User'}</p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        </div>
                      </div>
                      {/* Remove Button */}
                      {canManageTeam && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                          onClick={() => handleRemoveMember(member.user._id || member.user)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No additional members</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pages List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Tasks ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tasks found for this project.
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const currentStepIndex = getStatusIndex(task.status);

                return (
                  <div
                    key={task._id || task.id}
                    className="p-4 rounded-xl border border-border bg-background/50 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Page Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-foreground">{task.taskName}</h4>
                          <StatusPill status={task.status} />
                        </div>

                        {/* Status Timeline */}
                        <div className="hidden sm:flex items-center gap-1 mb-3">
                          {statusSteps.map((step, index) => (
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
                          ))}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {task.assignedDeveloper ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="w-5 h-5">
                                <AvatarImage src={task.assignedDeveloper.avatar} />
                                <AvatarFallback className="text-[10px]">
                                  {task.assignedDeveloper.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{task.assignedDeveloper.name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-muted-foreground/60">
                              <User className="w-4 h-4" />
                              <span>Unassigned</span>
                            </div>
                          )}
                          <span>Updated {task.updatedAt ? format(new Date(task.updatedAt), 'MMM d') : 'Recently'}</span>
                        </div>
                      </div>

                      {/* Ticket Counter & Actions */}
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-1">Tickets</p>
                          <TicketBadge used={task.ticketUsed || 0} max={task.maxTickets || 5} />
                        </div>

                        {/* Role-specific actions */}
                        <div className="flex items-center gap-2">
                          {/* Note: No approval needed in new Jira workflow - remove this block if not needed */}
                          {permissions.canApprovePage && task.status === 'to_do' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-success border-success/30 hover:bg-success/10"
                                onClick={() => handleApproveTask(task._id || task.id)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
                                onClick={() => handleRejectTask(task._id || task.id)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}

                          {permissions.canUnlockPage && (task.ticketUsed >= (task.maxTickets || 5)) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-warning border-warning/30 hover:bg-warning/10"
                              onClick={() => handleUnlockTask(task._id || task.id)}
                            >
                              <Unlock className="w-4 h-4" />
                            </Button>
                          )}

                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/tasks/${task._id || task.id}`}>
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
