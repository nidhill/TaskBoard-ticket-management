import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { SummaryCards } from '@/components/dashboard/analytics/SummaryCards';
import { StatusDonutChart } from '@/components/dashboard/analytics/StatusDonutChart';
import { PriorityBarChart } from '@/components/dashboard/analytics/PriorityBarChart';
import { ProjectsTable } from '@/components/dashboard/ProjectsTable';
import { RecentTickets } from '@/components/dashboard/RecentTickets';
import { TaskStatusOverview } from '@/components/dashboard/TaskStatusOverview';
import {
  FolderPlus, FileText, Ticket, CheckCircle,
  Clock, AlertTriangle, Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { profile } = useAuth();
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
    ...(permissions.canCreateProject   ? [{ label: 'Create Project',    href: '/projects',            icon: FolderPlus   }] : []),
    ...(permissions.canCreatePage      ? [{ label: 'Request Task',       href: '/tasks?create=true',   icon: FileText     }] : []),
    ...(permissions.canCreateTicket    ? [{ label: 'Raise Ticket',       href: '/tickets?create=true', icon: Ticket       }] : []),
    ...(permissions.canApprovePage     ? [{ label: 'Update Status',      href: '/tasks?status=to_do',  icon: CheckCircle, count: pendingApprovals }] : []),
    ...(permissions.canUpdatePageStatus? [{ label: 'Update Task Status', href: '/tasks',               icon: Clock        }] : []),
    ...(permissions.canResolveTicket   ? [{ label: 'Resolve Tickets',    href: '/tickets?status=open', icon: AlertTriangle, count: openTickets }] : []),
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

      {/* ── Header ── */}
      <div className="mb-9">
        <h1
          style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}
          className="text-[52px] font-bold leading-[1.05] tracking-tight text-gray-900 mb-2"
        >
          Welcome back
        </h1>
        <p className="text-[15px] text-gray-400">Your workspace at a glance.</p>
      </div>

      {/* ── Quick Actions ── */}
      {quickActions.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] font-bold uppercase tracking-[1.8px] text-gray-400 mb-4">
            Quick Actions
          </p>
          <div className="flex flex-wrap gap-3">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                to={action.href}
                className="group flex flex-col items-center justify-center gap-3 bg-white border border-gray-100 rounded-xl px-6 py-5 min-w-[130px] flex-1 hover:border-gray-300 hover:shadow-md transition-all select-none"
                style={{ textDecoration: 'none', maxWidth: 200 }}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-50 group-hover:bg-gray-100 flex items-center justify-center transition-colors relative">
                  <action.icon className="w-4.5 h-4.5 text-gray-600" style={{ width: 18, height: 18 }} />
                  {(action as any).count !== undefined && (action as any).count > 0 && (
                    <span style={{
                      position: 'absolute', top: -5, right: -5,
                      background: '#111', color: '#fff',
                      fontSize: 9, fontWeight: 700,
                      minWidth: 16, height: 16,
                      borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 4px',
                    }}>
                      {(action as any).count}
                    </span>
                  )}
                </div>
                <span className="text-[12px] font-semibold text-gray-600 group-hover:text-gray-900 text-center leading-tight transition-colors">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Summary Stats ── */}
      <SummaryCards stats={dashboardData.stats?.recentStats} />

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <StatusDonutChart stats={dashboardData.stats?.tasksByStatus} />
        <PriorityBarChart stats={dashboardData.stats?.tasksByPriority} />
      </div>

      {/* ── Projects + Task Status ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-6">
        <div className="xl:col-span-2">
          <ProjectsTable projects={dashboardData.projects} />
        </div>
        <div>
          <TaskStatusOverview stats={dashboardData.stats?.tasksByStatus} />
        </div>
      </div>

      {/* ── Recent Tickets ── */}
      <RecentTickets tickets={dashboardData.recentTickets} />

    </MainLayout>
  );
}
