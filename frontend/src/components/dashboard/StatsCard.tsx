import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

export function StatsCard({ title, value, icon: Icon, trend, className, iconClassName }: StatsCardProps) {
  return (
    <Card className={cn('glass-card hover-lift', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-semibold text-foreground">{value}</p>
            {trend && (
              <p className={cn(
                'mt-1 text-xs font-medium',
                trend.isPositive ? 'text-status-approved' : 'text-destructive'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}% from last week
              </p>
            )}
          </div>
          <div className={cn(
            'p-3 rounded-xl',
            iconClassName || 'bg-primary/10 text-primary'
          )}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
