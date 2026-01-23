import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Task, TaskStatus } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface BoardSwimlaneProps {
    id: string;
    title: string;
    tasks: Task[];
    columns: { id: TaskStatus; title: string }[];
    onCardClick: (task: Task) => void;
}

export function BoardSwimlane({ id, title, tasks, columns, onCardClick }: BoardSwimlaneProps) {
    const [isOpen, setIsOpen] = useState(true);

    // Group tasks by status for this swimlane
    const tasksByStatus = columns.reduce((acc, col) => {
        acc[col.id] = tasks.filter(task => task.status === col.id);
        return acc;
    }, {} as Record<TaskStatus, Task[]>);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4 border rounded-sm bg-card shadow-sm">
            {/* Swimlane Header */}
            <div className="flex items-center justify-between p-2 bg-muted/20 border-b">
                <div className="flex items-center gap-2">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="p-0 h-6 w-6 hover:bg-muted/50 rounded-sm">
                            {isOpen ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                        </Button>
                    </CollapsibleTrigger>

                    <h3 className="font-semibold text-sm flex items-center gap-2 text-foreground/80">
                        {title}
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 ml-1 bg-muted text-muted-foreground font-normal rounded-full">
                            {tasks.length}
                        </Badge>
                    </h3>
                </div>
            </div>

            {/* Swimlane Content */}
            <CollapsibleContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 min-h-[100px] bg-background/40">
                    {columns.map(column => (
                        <KanbanColumn
                            key={`${id}-${column.id}`}
                            id={column.id}
                            // Create a unique droppable ID: "swimlaneID__statusID"
                            droppableId={`${id}__${column.id}`}
                            title={column.title}
                            tasks={tasksByStatus[column.id]}
                            onCardClick={onCardClick}
                        />
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}
