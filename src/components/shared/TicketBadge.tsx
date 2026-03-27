import { cn } from '@/lib/utils';

interface TicketBadgeProps {
  used: number;
  max: number;
  className?: string;
}

export function TicketBadge({ used, max, className }: TicketBadgeProps) {
  const getVariant = () => {
    if (used >= max) return 'ticket-exhausted';
    if (used === max - 1) return 'ticket-warning';
    return 'ticket-available';
  };

  return (
    <span className={cn('ticket-badge', getVariant(), className)}>
      {used}/{max}
    </span>
  );
}
