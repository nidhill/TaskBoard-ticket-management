import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusPill } from '@/components/shared/StatusPill';
// import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Search, Calendar, Users, ExternalLink, Loader2, Trash2, CheckCircle, XCircle, FolderPlus } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import api from '@/services/api';
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog';

interface Project {
  _id: string;
  name: string;
  clientName?: string;
  description?: string;
  startDate?: string;
  deliveryDate?: string;
  status: string;
  createdBy: {
    _id: string;
    name: string;
  };
  projectHeads?: {
    _id: string;
    name: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Project creation dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Deletion state
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const permissions = usePermissions();

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    fetchProjects();

    // Check for create param
    if (searchParams.get('create') === 'true') {
      setIsCreateDialogOpen(true);
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('create');
      setSearchParams(newParams, { replace: true });
    }
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects');
      console.log('Projects API Response:', response.data);
      setProjects(response.data.projects || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load projects',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    setIsDeleting(true);
    try {
      await api.delete(`/projects/${projectId}`);
      toast({
        title: 'Project Deleted',
        description: 'Project has been deleted successfully',
      });
      fetchProjects();
      setProjectToDelete(null);
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete project',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateStatus = async (projectId: string, newStatus: 'active' | 'rejected', rejectionReason?: string) => {
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/projects/${projectId}/status`, {
        status: newStatus,
        rejectionReason
      });
      toast({
        title: newStatus === 'active' ? 'Project Approved' : 'Project Rejected',
        description: `Project has been ${newStatus}.`,
      });
      fetchProjects();
    } catch (error: any) {
      console.error('Error updating project status:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update project status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };


  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
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
        title="Projects"
        description="Manage all your projects and track their progress."
        actions={
          permissions.canCreateProject ? (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <FolderPlus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          ) : undefined
        }
      />

      <CreateProjectDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchProjects}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map((project, index) => (
          <Card key={project._id || index} className="glass-card hover-lift group relative">
            <CardContent className="p-6">
              {/* Delete Button (Absolute for Tech Admin) */}
              {(user?.role === 'admin' || (user?.id === project.createdBy?._id && project.status === 'draft')) && (
                <div className="absolute bottom-3 right-3 z-10">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
                          onClick={() => handleDeleteProject(project._id)}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 pr-8">
                  <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  {project.clientName && (
                    <p className="text-xs font-medium text-primary mb-1">
                      {project.clientName}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description || 'No description'}
                  </p>
                </div>
                <StatusPill status={project.status as any} />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Created By</p>
                    <p className="text-sm font-semibold truncate">
                      {project.createdBy?._id === user?.id ? 'You' : (project.createdBy?.name || 'Unknown')}
                    </p>
                  </div>
                  {/* Show Project Heads if present */}
                  <div className="p-3 rounded-lg bg-muted/50">
                    <Users className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Project Head{(project.projectHeads?.length || 0) > 1 ? 's' : ''}</p>
                    <p className="text-sm font-semibold truncate">
                      {project.projectHeads && project.projectHeads.length > 0 ? (
                        project.projectHeads.length === 1 ? (
                          project.projectHeads[0]._id === user?.id ? 'You' : project.projectHeads[0].name
                        ) : (
                          `${project.projectHeads[0]._id === user?.id ? 'You' : project.projectHeads[0].name} +${project.projectHeads.length - 1}`
                        )
                      ) : (
                        'Pending'
                      )}
                    </p>
                  </div>
                </div>

                {/* Day-wise Countdown */}
                <div className="flex items-center justify-center p-2 rounded-lg bg-primary/5 border border-primary/10">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Time Remaining</p>
                    {project.deliveryDate ? (
                      (() => {
                        const daysLeft = differenceInDays(new Date(project.deliveryDate), new Date());
                        if (daysLeft < 0) return <span className="text-sm font-bold text-destructive">Overdue by {Math.abs(daysLeft)} days</span>;
                        if (daysLeft === 0) return <span className="text-sm font-bold text-warning">Due Today</span>;
                        return <span className="text-sm font-bold text-primary">{daysLeft} Days Left</span>;
                      })()
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">No Deadline</span>
                    )}
                  </div>
                </div>

                {project.status === 'pending' && project.projectHeads?.some(head => head._id === user?.id) ? (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus(project._id, 'active')}
                    >
                      {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      size="sm"
                      disabled={isUpdatingStatus}
                      onClick={() => handleUpdateStatus(project._id, 'rejected')}
                    >
                      {isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                      Reject
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/projects/${project._id}`}>
                      View Details
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {
        filteredProjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {projects.length === 0
                ? 'No projects yet. Create your first project to get started!'
                : 'No projects found matching your criteria.'}
            </p>
          </div>
        )
      }
    </MainLayout >
  );
}


