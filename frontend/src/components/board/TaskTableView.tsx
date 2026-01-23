import { useState } from 'react';
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Task, TaskStatus } from '@/types';
import { DraggableTableRow } from './DraggableTableRow';
import { Card } from '@/components/ui/card';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface TaskTableViewProps {
    tasks: Task[];
    onTaskClick: (task: Task) => void;
    onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
}

type SortField = 'taskName' | 'projectId' | 'status' | 'updatedAt';
type SortDirection = 'asc' | 'desc';

const STATUS_ORDER: TaskStatus[] = ['to_do', 'in_progress', 'in_review', 'done'];

export function TaskTableView({ tasks, onTaskClick, onStatusChange }: TaskTableViewProps) {
    const [sortField, setSortField] = useState<SortField>('updatedAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedTasks = [...tasks].sort((a, b) => {
        let aVal: any, bVal: any;

        switch (sortField) {
            case 'taskName':
                aVal = a.taskName.toLowerCase();
                bVal = b.taskName.toLowerCase();
                break;
            case 'projectId':
                aVal = typeof a.projectId === 'object' ? a.projectId.name : '';
                bVal = typeof b.projectId === 'object' ? b.projectId.name : '';
                break;
            case 'status':
                aVal = STATUS_ORDER.indexOf(a.status);
                bVal = STATUS_ORDER.indexOf(b.status);
                break;
            case 'updatedAt':
                aVal = new Date(a.updatedAt).getTime();
                bVal = new Date(b.updatedAt).getTime();
                break;
            default:
                return 0;
        }

        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const handleDragStart = (event: DragStartEvent) => {
        const task = tasks.find(t => t._id === event.active.id);
        setActiveTask(task || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveTask(null);
        // Table reordering logic could go here if implemented
    };

    const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <button
            onClick={() => handleSort(field)}
            className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
            {children}
            <ArrowUpDown className={cn(
                'w-3 h-3',
                sortField === field ? 'text-primary' : 'text-muted-foreground'
            )} />
        </button>
    );

    if (tasks.length === 0) {
        return (
            <div className="p-12 text-center border rounded-lg bg-card text-muted-foreground">
                No tasks to display
            </div>
        );
    }

    return (
        <div className="bg-card rounded-md shadow-sm border">
            <div className="p-0">
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b-primary/10">
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead className="w-[100px]">ID</TableHead>
                                <TableHead className="w-[300px]">
                                    <SortButton field="taskName">Task Name</SortButton>
                                </TableHead>
                                <TableHead>
                                    <SortButton field="projectId">Project</SortButton>
                                </TableHead>
                                <TableHead>Assignee</TableHead>
                                <TableHead>
                                    <SortButton field="status">Status</SortButton>
                                </TableHead>
                                <TableHead>Tickets</TableHead>
                                <TableHead>
                                    <SortButton field="updatedAt">Updated</SortButton>
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <SortableContext items={sortedTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                                {sortedTasks.map((task) => (
                                    <DraggableTableRow
                                        key={task._id}
                                        task={task}
                                        onClick={() => onTaskClick(task)}
                                    />
                                ))}
                            </SortableContext>
                        </TableBody>
                    </Table>
                </DndContext>
            </div>
        </div>
    );
}
