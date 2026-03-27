import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageStatus, Page } from '@/types';
import { cn } from '@/lib/utils';
import { Box } from 'lucide-react';

interface PageStatusOverviewProps {
  pages: Page[];
}

const statusOrder: PageStatus[] = [
  'draft',
  'approval_pending',
  'approved',
  'in_development',
  'developed',
  'delivered'
];

const statusLabels: Record<PageStatus, string> = {
  draft: 'Draft',
  approval_pending: 'Pending',
  approved: 'Approved',
  in_development: 'In Dev',
  developed: 'Developed',
  delivered: 'Delivered'
};

const statusColors: Record<PageStatus, string> = {
  draft: 'bg-muted-foreground',
  approval_pending: 'bg-status-pending',
  approved: 'bg-status-approved',
  in_development: 'bg-status-in-dev',
  developed: 'bg-status-developed',
  delivered: 'bg-status-delivered'
};

export function PageStatusOverview({ pages }: PageStatusOverviewProps) {
  const statusCounts = statusOrder.reduce((acc, status) => {
    acc[status] = pages.filter(p => p.status === status).length;
    return acc;
  }, {} as Record<PageStatus, number>);

  const total = pages.length;

  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Page Status Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Box className="w-10 h-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No pages to analyze</p>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="flex h-4 rounded-full overflow-hidden mb-6 bg-muted/30">
              {statusOrder.map((status) => {
                const percentage = (statusCounts[status] / total) * 100;
                if (percentage === 0) return null;
                return (
                  <div
                    key={status}
                    className={cn(statusColors[status], 'transition-all duration-500 h-full')}
                    style={{ width: `${percentage}%` }}
                    title={`${statusLabels[status]}: ${statusCounts[status]}`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-2">
              {statusOrder.map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <div className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', statusColors[status])} />
                  <span className="text-xs text-muted-foreground truncate">{statusLabels[status]}</span>
                  <span className="text-xs font-semibold text-foreground ml-auto">
                    {statusCounts[status]}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
