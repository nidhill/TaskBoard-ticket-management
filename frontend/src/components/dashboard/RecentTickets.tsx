import { StatusPill } from '@/components/shared/StatusPill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, AlertCircle, Bug, Box } from 'lucide-react';
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
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Tickets</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/tickets" className="flex items-center gap-1">
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-lg">
            <Box className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium mb-1">No tickets yet</p>
            <p className="text-xs text-muted-foreground/70 max-w-[200px]">
              Issues tracked on pages will appear here.
            </p>
          </div>
        ) : (
          recentTickets.map((ticket) => (
            <div
              key={ticket._id}
              className="flex items-start gap-4 p-4 rounded-lg border border-border bg-background/50 hover:bg-muted/50 transition-colors"
            >
              <div className={cn(
                'p-2 rounded-lg',
                ticket.issueType === 'dev_bug'
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-warning/10 text-warning'
              )}>
                {ticket.issueType === 'dev_bug' ? (
                  <Bug className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    {ticket.description}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {/* @ts-ignore - pageId is populated */}
                  {ticket.taskId?.taskName || 'Unknown Task'} • {format(new Date(ticket.createdAt), 'MMM d, yyyy')}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-5 h-5">
                      <AvatarImage src={ticket.requestedBy?.avatar_url || ticket.requestedBy?.avatar} />
                      <AvatarFallback className="text-[10px]">
                        {ticket.requestedBy?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {ticket.requestedBy?.name || 'Unknown User'}
                    </span>
                  </div>
                  <StatusPill status={ticket.status} />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
