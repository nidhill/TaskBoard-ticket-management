import { StatusPill } from '@/components/shared/StatusPill';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, Bug, AlertCircle, Inbox } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Ticket } from '@/types';

interface RecentTicketsProps {
  tickets: Ticket[];
}

export function RecentTickets({ tickets }: RecentTicketsProps) {
  const recentTickets = tickets.slice(0, 5);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recent Tickets</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Latest issues raised across projects</p>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground -mr-2">
          <Link to="/tickets" className="flex items-center gap-1.5 text-xs font-medium">
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>

      {/* Body */}
      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Inbox className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">No tickets yet</p>
          <p className="text-xs text-muted-foreground/70 max-w-[200px]">Issues raised on tasks will appear here.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {recentTickets.map((ticket) => (
            <div
              key={ticket._id}
              className="flex items-start gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
            >
              {/* Icon */}
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                ticket.issueType === 'dev_bug'
                  ? 'bg-red-50 text-red-500'
                  : 'bg-amber-50 text-amber-500'
              )}>
                {ticket.issueType === 'dev_bug'
                  ? <Bug className="w-3.5 h-3.5" />
                  : <AlertCircle className="w-3.5 h-3.5" />
                }
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate mb-0.5">
                  {ticket.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {/* @ts-ignore */}
                  {ticket.taskId?.taskName || 'Unknown Task'} · {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                </p>
              </div>

              {/* Right side: avatar + status */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <Avatar className="w-5 h-5">
                    <AvatarImage src={ticket.requestedBy?.avatar_url || ticket.requestedBy?.avatar} />
                    <AvatarFallback className="text-[9px] bg-muted text-muted-foreground">
                      {ticket.requestedBy?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground">{ticket.requestedBy?.name || 'Unknown'}</span>
                </div>
                <StatusPill status={ticket.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
