import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { Task } from '@/types';
import { BoardCard } from './BoardCard';
import { cn } from '@/lib/utils';

interface BoardColumnProps {
    id: string; // The status ID (e.g., 'to_do')
    droppableId?: string; // Unique ID for dnd-kit (e.g., 'project-1-to_do')
    title: string;
    count?: number;
    tasks: Task[];
    onCardClick: (task: Task) => void;
    onCreateClick?: () => void;
}

const columnColors: Record<string, string> = {
    to_do: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    in_review: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    done: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
};

export function BoardColumn({ id, droppableId, title, count, tasks, onCardClick, onCreateClick }: BoardColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: droppableId || id,
    });

    const displayCount = count !== undefined ? count : tasks.length;

    return (
        <div className="flex flex-col h-full min-w-[280px] w-[280px] shrink-0">
            {/* Column Header */}
            <div className="mb-2 px-1 flex items-center justify-between bg-transparent">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <span className="truncate">{title}</span>
                    {displayCount > 0 && (
                        <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full text-[10px]">
                            {displayCount}
                        </span>
                    )}
                </div>
                <div className="flex gap-1">
                    {/* Optional: Add column actions here if needed */}
                </div>
            </div>

            {/* Droppable Area / Column Body */}
            <div
                ref={setNodeRef}
                className={cn(
                    'flex-1 rounded-sm p-1.5 transition-colors min-h-[150px] flex flex-col gap-2',
                    'bg-secondary/30 dark:bg-accent/10', // Jira-like light gray column background
                    isOver ? 'bg-primary/5 ring-2 ring-primary/20' : ''
                )}
            >
                <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                    {tasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="text-muted-foreground/40 text-xs font-medium">No tasks</div>
                        </div>
                    ) : (
                        tasks.map((task) => (
                            <BoardCard key={task._id} task={task} onClick={onCardClick} />
                        ))
                    )}
                </SortableContext>

                {/* Create Button (inside the column at bottom) */}
                {onCreateClick && (
                    <button
                        onClick={onCreateClick}
                        className="w-full py-1.5 px-2 text-left text-sm text-foreground/70 hover:bg-background/50 rounded hover:text-foreground transition-colors flex items-center gap-2 mt-auto"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="font-medium">Create</span>
                    </button>
                )}
            </div>
        </div>
    );
}
