import { cn } from '@/lib/utils';
import { TaskStatus, ProjectStatus, TicketStatus } from '@/types';

interface StatusPillProps {
  status: TaskStatus | ProjectStatus | TicketStatus;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Task statuses (Jira-style)
  to_do: { label: 'TO DO', className: 'bg-muted-foreground/10 text-muted-foreground' },
  in_progress: { label: 'IN PROGRESS', className: 'bg-blue-500/10 text-blue-600' },
  in_review: { label: 'IN REVIEW', className: 'bg-yellow-500/10 text-yellow-600' },
  done: { label: 'DONE', className: 'bg-green-500/10 text-green-600' },

  // Project statuses
  pending: { label: 'Pending', className: 'status-pending' },
  active: { label: 'Active', className: 'status-in-dev' },
  on_hold: { label: 'On Hold', className: 'status-pending' },
  completed: { label: 'Completed', className: 'status-delivered' },
  cancelled: { label: 'Cancelled', className: 'status-draft' },

  // Ticket statuses
  open: { label: 'Open', className: 'status-pending' },
  resolved: { label: 'Resolved', className: 'status-delivered' },
  rejected: { label: 'Rejected', className: 'status-draft' },
};

export function StatusPill({ status, className }: StatusPillProps) {
  const config = statusConfig[status] || { label: status, className: 'status-draft' };

  return (
    <span className={cn('status-pill', config.className, className)}>
      {config.label}
    </span>
  );
}
