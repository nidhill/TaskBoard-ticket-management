import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ProjectsTable } from '@/components/dashboard/ProjectsTable';
import { RecentTickets } from '@/components/dashboard/RecentTickets';
import { TaskStatusOverview } from '@/components/dashboard/TaskStatusOverview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderPlus, FileText, Ticket, CheckCircle, Shield, Users, Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { SummaryCards } from '@/components/dashboard/analytics/SummaryCards';
import { StatusDonutChart } from '@/components/dashboard/analytics/StatusDonutChart';
import { PriorityBarChart } from '@/components/dashboard/analytics/PriorityBarChart';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import api from '@/services/api';
import { Project, Task, Ticket as TicketType } from '@/types';
import { useToast } from '@/hooks/use-toast';

const roleDescriptions = {
  requester: 'You can view projects, request tasks, and raise tickets (up to 2 per task).',
  department_head: 'You can approve/reject tasks and unlock tasks after ticket limit is reached.',
  developer: 'You can update task status and resolve tickets assigned to you.',
  tech_admin: 'You have full access to all features, user management, and system settings.',
};

const roleBadgeColors = {
  requester: 'bg-muted text-muted-foreground',
  department_head: 'bg-warning/15 text-warning border-warning/30',
  developer: 'bg-info/15 text-info border-info/30',
  tech_admin: 'bg-destructive/15 text-destructive border-destructive/30',
};

const roleLabels = {
  requester: 'Requester',
  department_head: 'Department Head',
  developer: 'Developer',
  tech_admin: 'Tech Admin',
};

export default function Dashboard() {
  const { profile, role } = useAuth();
  const permissions = usePermissions();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [projectsRes, tasksRes, ticketsRes] = await Promise.all([
          api.get('/projects'),
          api.get('/tasks'),
          api.get('/tickets')
        ]);

        setProjects(projectsRes.data.projects || []);
        setTasks(tasksRes.data.tasks || []);
        setTickets(ticketsRes.data.tickets || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const pendingApprovals = tasks.filter(p => p.status === 'to_do').length;
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const completedTasks = tasks.filter(p => p.status === 'done').length;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-[calc(100vh-100px)] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title={`Welcome back, ${profile?.name?.split(' ')[0] || 'User'}`}
        description="Here's what's happening with your projects today."
        actions={
          permissions.canCreateProject && (
            <Button asChild>
              <Link to="/projects?create=true">
                <FolderPlus className="w-4 h-4 mr-2" />
                New Project
              </Link>
            </Button>
          )
        }
      />



      {/* Role-Specific Quick Actions */}
      {role && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Quick Actions for {roleLabels[role]}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {permissions.canCreateProject && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/projects">
                  <FolderPlus className="w-4 h-4 mr-2" />
                  Create Project
                </Link>
              </Button>
            )}
            {permissions.canCreatePage && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/projects">
                  <FileText className="w-4 h-4 mr-2" />
                  Request Task
                </Link>
              </Button>
            )}
            {permissions.canCreateTicket && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/tickets">
                  <Ticket className="w-4 h-4 mr-2" />
                  Raise Ticket
                </Link>
              </Button>
            )}
            {permissions.canApprovePage && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/tasks">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Review Approvals ({pendingApprovals})
                </Link>
              </Button>
            )}
            {permissions.canUpdatePageStatus && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/tasks">
                  <Clock className="w-4 h-4 mr-2" />
                  Update Task Status
                </Link>
              </Button>
            )}
            {permissions.canResolveTicket && (
              <Button variant="outline" size="sm" asChild>
                <Link to="/tickets">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Resolve Tickets ({openTickets})
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <SummaryCards tasks={tasks} tickets={tickets} />

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StatusDonutChart tasks={tasks} />
        <PriorityBarChart tasks={tasks} />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2">
          <ProjectsTable projects={projects} />
        </div>
        <div>
          <TaskStatusOverview tasks={tasks} />
        </div>
      </div>

      {/* Recent Tickets */}
      <RecentTickets tickets={tickets} />
    </MainLayout>
  );
}
