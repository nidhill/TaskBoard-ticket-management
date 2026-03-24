import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { MainLayout } from '@/components/layout/MainLayout';
import { SummaryCards } from '@/components/dashboard/analytics/SummaryCards';
import { StatusDonutChart } from '@/components/dashboard/analytics/StatusDonutChart';
import { PriorityBarChart } from '@/components/dashboard/analytics/PriorityBarChart';
import { ProjectsTable } from '@/components/dashboard/ProjectsTable';
import { RecentTickets } from '@/components/dashboard/RecentTickets';
import { TaskStatusOverview } from '@/components/dashboard/TaskStatusOverview';
import { Button } from '@/components/ui/button';
import {
  FolderPlus, FileText, Ticket, CheckCircle,
  Clock, AlertTriangle, Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export default function Dashboard() {
  const { profile, role } = useAuth();
  const permissions = usePermissions();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>({
    projects: [],
    recentTickets: [],
    stats: null,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const statsRes = await api.get('/dashboard/stats');
        const { counts, recentTickets, activeProjects } = statsRes.data;
        setDashboardData({
          projects: activeProjects || [],
          recentTickets: recentTickets || [],
          stats: counts,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const pendingApprovals = dashboardData.stats?.tasksByStatus?.to_do || 0;
  const openTickets =
    (dashboardData.stats?.ticketsByStatus?.open || 0) +
    (dashboardData.stats?.ticketsByStatus?.in_progress || 0);

  const quickActions = [
    ...(permissions.canCreateProject  ? [{ label: 'Create Project',     href: '/projects',           icon: FolderPlus }] : []),
    ...(permissions.canCreatePage     ? [{ label: 'Request Task',        href: '/tasks?create=true',  icon: FileText   }] : []),
    ...(permissions.canCreateTicket   ? [{ label: 'Raise Ticket',        href: '/tickets?create=true',icon: Ticket     }] : []),
    ...(permissions.canApprovePage    ? [{ label: 'Review Approvals',    href: '/tasks?status=to_do', icon: CheckCircle,  count: pendingApprovals }] : []),
    ...(permissions.canUpdatePageStatus?[{ label: 'Update Task Status',  href: '/tasks',              icon: Clock      }] : []),
    ...(permissions.canResolveTicket  ? [{ label: 'Resolve Tickets',     href: '/tickets?status=open',icon: AlertTriangle,count: openTickets      }] : []),
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-[calc(100vh-100px)] items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[1.5px] text-gray-400 mb-2">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
          <h1 style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}
            className="text-[42px] font-bold leading-[1.05] tracking-tight text-gray-900">
            {getGreeting()},<br />{profile?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            Here's what's happening with your projects today.
          </p>
        </div>
        {permissions.canCreateProject && (
          <Button asChild className="bg-gray-900 hover:bg-gray-800 text-white h-10 px-5 rounded-lg font-medium shrink-0">
            <Link to="/projects?create=true">
              <FolderPlus className="w-4 h-4 mr-2" />
              New Project
            </Link>
          </Button>
        )}
      </div>

      {/* ── Quick Actions ─────────────────────────────────── */}
      {quickActions.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[1.6px] text-gray-400 mb-3">
            Quick Actions
          </p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                to={action.href}
                className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 hover:border-gray-400 hover:shadow-sm transition-all group select-none"
              >
                <div className="w-6 h-6 rounded-md bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0">
                  <action.icon className="w-3.5 h-3.5 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
                {(action as any).count !== undefined && (action as any).count > 0 && (
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {(action as any).count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Summary Stats ─────────────────────────────────── */}
      <SummaryCards stats={dashboardData.stats?.recentStats} />

      {/* ── Charts ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <StatusDonutChart stats={dashboardData.stats?.tasksByStatus} />
        <PriorityBarChart stats={dashboardData.stats?.tasksByPriority} />
      </div>

      {/* ── Projects + Task Status ────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <div className="xl:col-span-2">
          <ProjectsTable projects={dashboardData.projects} />
        </div>
        <div>
          <TaskStatusOverview stats={dashboardData.stats?.tasksByStatus} />
        </div>
      </div>

      {/* ── Recent Tickets ────────────────────────────────── */}
      <RecentTickets tickets={dashboardData.recentTickets} />

    </MainLayout>
  );
}
