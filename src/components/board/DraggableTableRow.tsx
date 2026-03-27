import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '@/types';
import { GripVertical, ExternalLink, Clock } from 'lucide-react';
import { StatusPill } from '@/components/shared/StatusPill';
import { TicketBadge } from '@/components/shared/TicketBadge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format, isPast, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface DraggableTableRowProps {
    task: Task;
    onClick: (task: Task) => void;
    isSelected?: boolean;
    onSelectChange?: (checked: boolean) => void;
}

export function DraggableTableRow({ task, onClick, isSelected = false, onSelectChange }: DraggableTableRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const projectName = task.projectId && typeof task.projectId === 'object' ? (task.projectId as any).name : 'Unknown';
    const isOverdue = task.dueDate && task.status !== 'done' && isPast(new Date(task.dueDate));
    const overdueDays = isOverdue ? Math.abs(differenceInDays(new Date(), new Date(task.dueDate!))) : 0;

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={cn(
                'border-b hover:bg-muted/50 transition-colors',
                isDragging && 'opacity-50 bg-muted',
                isSelected && 'bg-primary/5'
            )}
        >
            {/* Checkbox */}
            <td className="px-4 py-3 w-10" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => onSelectChange?.(!!checked)}
                    aria-label={`Select task ${task.taskName}`}
                />
            </td>

            {/* Drag Handle */}
            <td className="px-4 py-3 w-12">
                <button
                    className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
                    {...attributes}
                    {...listeners}
                >
                    <GripVertical className="w-4 h-4" />
                </button>
            </td>

            {/* Task ID */}
            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                #{task._id.slice(-6)}
            </td>

            {/* Task Name */}
            <td className="px-4 py-3">
                <div className="font-medium text-foreground max-w-xs truncate">
                    {task.taskName}
                </div>
                {isOverdue && (
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-red-500">
                        <Clock className="w-3 h-3" />
                        {overdueDays === 0 ? 'Due today' : `${overdueDays}d overdue`}
                    </div>
                )}
            </td>

            {/* Project */}
            <td className="px-4 py-3">
                <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                    {projectName}
                </div>
            </td>

            {/* Assignee */}
            <td className="px-4 py-3">
                {task.assignedDeveloper ? (
                    <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                            <AvatarImage src={task.assignedDeveloper.avatar_url} />
                            <AvatarFallback className="text-xs">
                                {task.assignedDeveloper.name.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate max-w-[120px]">
                            {task.assignedDeveloper.name}
                        </span>
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                )}
            </td>

            {/* Status */}
            <td className="px-4 py-3">
                <StatusPill status={task.status} />
            </td>

            {/* Priority */}
            <td className="px-4 py-3">
                <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium border capitalize",
                    task.priority === 'high' && "bg-orange-50 text-orange-700 border-orange-200",
                    (task.priority === 'medium' || !task.priority) && "bg-blue-50 text-blue-700 border-blue-200",
                    task.priority === 'low' && "bg-slate-50 text-slate-700 border-slate-200"
                )}>
                    {task.priority || 'medium'}
                </span>
            </td>

            {/* Tickets */}
            <td className="px-4 py-3">
                <TicketBadge used={task.ticketUsed} max={task.maxTickets} />
            </td>

            {/* Updated */}
            <td className="px-4 py-3 text-sm text-muted-foreground">
                {format(new Date(task.updatedAt), 'MMM d, yyyy')}
            </td>

            {/* Actions */}
            <td className="px-4 py-3">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onClick(task)}
                >
                    <ExternalLink className="w-4 h-4" />
                </Button>
            </td>
        </tr>
    );
}
