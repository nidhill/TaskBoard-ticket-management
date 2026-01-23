import { useDraggable } from '@dnd-kit/core';
import { Task } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface KanbanCardProps {
    task: Task;
    onClick: (task: Task) => void;
}

export function KanbanCard({ task, onClick }: KanbanCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: task._id,
        data: { task }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    const projectName = task.projectId && typeof task.projectId === 'object' ? (task.projectId as any).name : 'Unknown';
    const isTicketExhausted = task.ticketUsed >= task.maxTickets;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={() => onClick(task)}
            className={cn(
                "bg-card border-none shadow-sm rounded-sm p-3 cursor-grab active:cursor-grabbing transition-all hover:bg-accent/50 group select-none relative",
                "border-l-[3px] border-l-transparent hover:border-l-primary",
                isDragging && "opacity-50 shadow-lg rotate-2 z-50 ring-2 ring-primary"
            )}
        >
            {/* Task Name */}
            <div className="mb-2">
                <span className="text-sm font-medium text-card-foreground line-clamp-3 leading-tight block">
                    {task.taskName}
                </span>
            </div>

            {/* Project Tag */}
            <div className="mb-3">
                <Badge
                    variant="secondary"
                    className="text-[10px] font-bold px-1.5 py-0 h-5 rounded-[4px] bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 uppercase tracking-tight"
                >
                    {projectName}
                </Badge>
            </div>

            {/* Footer: Icon/ID + Avatar */}
            <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center gap-2">
                    {/* ID */}
                    <div className="flex items-center gap-1.5 text-muted-foreground group-hover:text-foreground transition-colors">
                        {isTicketExhausted ? (
                            <AlertCircle className="w-4 h-4 text-destructive" />
                        ) : (
                            <CheckSquare className="w-4 h-4 text-blue-500" />
                        )}
                        <span className="text-xs font-medium text-muted-foreground hover:underline cursor-pointer">
                            {task._id.slice(-4).toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Ticket Count Warning */}
                    {isTicketExhausted && (
                        <Badge variant="destructive" className="text-[10px] h-4 px-1">
                            {task.ticketUsed}/{task.maxTickets}
                        </Badge>
                    )}

                    {/* Pending Status Label (Optional per request, usually redundant) */}
                    {/* <Badge variant="outline" className="text-[10px] h-5 px-1">{task.status.replace('_', ' ')}</Badge> */}

                    {/* Assignee Avatar */}
                    {task.assignedDeveloper ? (
                        <Avatar className="w-6 h-6 ring-2 ring-background">
                            <AvatarImage src={task.assignedDeveloper.avatar_url} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {task.assignedDeveloper.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center ring-2 ring-background">
                            <span className="text-[10px] text-muted-foreground">?</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
