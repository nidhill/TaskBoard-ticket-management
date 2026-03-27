import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, max, className, showLabel = true }: ProgressBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  
  const getColor = () => {
    if (percentage >= 100) return 'bg-status-delivered';
    if (percentage >= 75) return 'bg-status-approved';
    if (percentage >= 50) return 'bg-status-in-dev';
    if (percentage >= 25) return 'bg-status-pending';
    return 'bg-muted-foreground';
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', getColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground font-medium min-w-[3rem] text-right">
          {value}/{max}
        </span>
      )}
    </div>
  );
}
