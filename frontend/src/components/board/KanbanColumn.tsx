import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { Task } from '@/types';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanColumnProps {
    id: string; // The status ID (e.g., 'to_do')
    droppableId?: string; // Unique ID for dnd-kit
    title: string;
    count?: number;
    tasks: Task[];
    onCardClick: (task: Task) => void;
    onCreateClick?: () => void;
}

export function KanbanColumn({ id, droppableId, title, count, tasks, onCardClick, onCreateClick }: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: droppableId || id,
    });

    const displayCount = count !== undefined ? count : tasks.length;

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[280px] shrink-0">
            {/* Column Header */}
            <div className="mb-3 px-1 flex items-center justify-between text-muted-foreground">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                    <span className="truncate text-foreground/80">{title}</span>
                    <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] min-w-[20px] justify-center">
                        {displayCount}
                    </Badge>
                </div>
            </div>

            {/* Droppable Area / Column Body */}
            <div
                ref={setNodeRef}
                className={cn(
                    'flex-1 rounded-md p-2 transition-all flex flex-col gap-2 relative group/col',
                    'bg-secondary/40 hover:bg-secondary/50', // Jira-like column background
                    isOver && 'ring-2 ring-primary/20 bg-primary/5'
                )}
            >
                <div className="flex-1 overflow-y-auto min-h-[150px] custom-scrollbar space-y-2 pr-1">
                    {tasks.map((task) => (
                        <KanbanCard key={task._id} task={task} onClick={onCardClick} />
                    ))}

                    {tasks.length === 0 && !isOver && (
                        <div className="flex flex-col items-center justify-center py-8 text-center opacity-0 group-hover/col:opacity-100 transition-opacity">
                            <div className="text-muted-foreground/40 text-xs font-medium">Drop tasks here</div>
                        </div>
                    )}
                </div>

                {/* Create Button (inside bottom) */}
                {onCreateClick && (
                    <button
                        onClick={onCreateClick}
                        className="w-full py-2 px-2 text-left text-sm text-muted-foreground hover:bg-background/80 hover:text-foreground rounded-sm transition-colors flex items-center gap-2 mt-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">Create issue</span>
                    </button>
                )}
            </div>
        </div>
    );
}
