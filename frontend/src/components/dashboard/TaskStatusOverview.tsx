import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskStatus, Task } from '@/types';
import { cn } from '@/lib/utils';
import { Box } from 'lucide-react';

interface TaskStatusOverviewProps {
  stats: Record<TaskStatus, number> | undefined;
}

const statusOrder: TaskStatus[] = [
  'to_do',
  'in_progress',
  'in_review',
  'done'
];

const statusLabels: Record<TaskStatus, string> = {
  to_do: 'TO DO',
  in_progress: 'IN PROGRESS',
  in_review: 'IN REVIEW',
  done: 'DONE'
};

const statusColors: Record<TaskStatus, string> = {
  to_do: 'bg-muted-foreground',
  in_progress: 'bg-blue-500',
  in_review: 'bg-yellow-500',
  done: 'bg-green-500'
};

export function TaskStatusOverview({ stats }: TaskStatusOverviewProps) {
  const statusCounts = stats || { to_do: 0, in_progress: 0, in_review: 0, done: 0 };

  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Task Status Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Box className="w-10 h-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No tasks to analyze</p>
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
