import { useState, useEffect } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Loader2, LayoutGrid, Table2, Kanban, Layers, Users, Flag, Briefcase, ArrowUpAZ, ArrowDownAZ } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Task, TaskStatus } from '@/types';
import { KanbanColumn } from '@/components/board/KanbanColumn';
import { KanbanCard } from '@/components/board/KanbanCard';
import { BoardSwimlane } from '@/components/board/BoardSwimlane';
import { TaskTableView, SortField, SortDirection } from '@/components/board/TaskTableView';
import api from '@/services/api';
import { useNavigate } from 'react-router-dom';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

// Kanban column definitions
const kanbanColumns = [
    { id: 'to_do' as TaskStatus, title: 'TO DO' },
    { id: 'in_progress' as TaskStatus, title: 'IN PROGRESS' },
    { id: 'in_review' as TaskStatus, title: 'IN REVIEW' },
    { id: 'done' as TaskStatus, title: 'DONE' }
];

type ViewMode = 'board' | 'table';
type GroupBy = 'none' | 'project' | 'assignee' | 'priority';

export default function Board() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [selectedProject, setSelectedProject] = useState<string>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('board');
    const [groupBy, setGroupBy] = useState<GroupBy>('none');

    // Sort State for Table View
    const [sortField, setSortField] = useState<SortField>('updatedAt');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tasksRes, projectsRes] = await Promise.all([
                api.get('/tasks'),
                api.get('/projects')
            ]);
            setTasks(tasksRes.data.tasks || []);
            setProjects(projectsRes.data.projects || []);
        } catch (error: any) {
            console.error('Error fetching data:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to load tasks',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const task = tasks.find(t => t._id === event.active.id);
        setActiveTask(task || null);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id as string;
        let newStatus = over.id as string;
        let swimlaneId = '';

        // Handle swimlane drops (id format: "swimlaneId__statusId")
        if (newStatus.includes('__')) {
            const parts = newStatus.split('__');
            swimlaneId = parts[0];
            newStatus = parts[1];
        }

        const task = tasks.find(t => t._id === taskId);

        if (!task) return;

        // Validate status
        if (!['to_do', 'in_progress', 'in_review', 'done'].includes(newStatus)) return;

        // If status hasn't changed return
        if (task.status === newStatus) return;

        let updates: Partial<Task> = { status: newStatus as TaskStatus };

        // Optimistic update
        setTasks(prevTasks =>
            prevTasks.map(t =>
                t._id === taskId ? { ...t, ...updates } : t
            )
        );

        // Update backend
        try {
            await api.put(`/tasks/${taskId}`, updates);
            toast({
                title: 'Task Updated',
                description: `Task status updated to ${newStatus.replace('_', ' ').toUpperCase()}`,
            });
        } catch (error: any) {
            console.error('Error updating task:', error);
            // Revert on error
            setTasks(prevTasks =>
                prevTasks.map(t =>
                    t._id === taskId ? { ...t, status: task.status } : t
                )
            );
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to update task',
                variant: 'destructive',
            });
        }
    };

    const handleCardClick = (task: Task) => {
        navigate(`/tasks/${task._id}`);
    };

    const getGroupedTasks = () => {
        let filteredTasks = tasks;

        // Apply project filter first
        if (selectedProject !== 'all') {
            filteredTasks = filteredTasks.filter(task =>
                typeof task.projectId === 'object'
                    ? task.projectId._id === selectedProject
                    : task.projectId === selectedProject
            );
        }

        if (groupBy === 'none') {
            return [{ id: 'all', title: 'All Tasks', tasks: filteredTasks }];
        }

        if (groupBy === 'project') {
            const groups: Record<string, Task[]> = {};

            if (selectedProject === 'all') {
                projects.forEach(p => { groups[p._id] = []; });
            }

            filteredTasks.forEach(task => {
                const pId = typeof task.projectId === 'object' ? task.projectId._id : task.projectId;
                if (!groups[pId]) groups[pId] = [];
                groups[pId].push(task);
            });

            return Object.entries(groups).map(([projectId, groupTasks]) => {
                const project = projects.find(p => p._id === projectId);
                return {
                    id: projectId,
                    title: project ? project.name : 'Unknown Project',
                    tasks: groupTasks // tasks are already filtered
                };
            }).sort((a, b) => a.title.localeCompare(b.title));
        }

        if (groupBy === 'assignee') {
            const groups: Record<string, { name: string, tasks: Task[] }> = {};
            const unassigned: Task[] = [];

            filteredTasks.forEach(task => {
                if (task.assignedDeveloper) {
                    const devId = task.assignedDeveloper._id;
                    if (!groups[devId]) {
                        groups[devId] = {
                            name: task.assignedDeveloper.name,
                            tasks: []
                        };
                    }
                    groups[devId].tasks.push(task);
                } else {
                    unassigned.push(task);
                }
            });

            const result = Object.entries(groups).map(([devId, group]) => ({
                id: devId,
                title: group.name,
                tasks: group.tasks
            })).sort((a, b) => a.title.localeCompare(b.title));

            if (unassigned.length > 0) {
                result.push({ id: 'unassigned', title: 'Unassigned', tasks: unassigned });
            }

            return result;
        }

        if (groupBy === 'priority') {
            const priorities = ['high', 'medium', 'low'];
            return priorities.map(p => ({
                id: p,
                title: p.charAt(0).toUpperCase() + p.slice(1),
                tasks: filteredTasks.filter(t => (t.priority || 'medium') === p)
            }));
        }

        return [{ id: 'all', title: 'All Tasks', tasks: filteredTasks }];
    };

    const groupedTasks = getGroupedTasks();

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    const allTasks = tasks.filter(task => {
        // Project Filter
        if (selectedProject !== 'all') {
            const pId = typeof task.projectId === 'object' ? task.projectId._id : task.projectId;
            if (pId !== selectedProject) return false;
        }

        return true;
    });

    return (
        <MainLayout>
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <LayoutGrid className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Task Board</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage tasks and track progress
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Group By Toggle */}
                        {viewMode === 'board' && (
                            <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
                                <SelectTrigger className="w-[140px] h-9">
                                    <Layers className="w-4 h-4 mr-2 text-muted-foreground" />
                                    <SelectValue placeholder="Group By" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        <div className="flex items-center gap-2">
                                            <Kanban className="w-4 h-4" />
                                            <span>No Grouping</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="project">
                                        <div className="flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" />
                                            <span>Project</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="assignee">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            <span>Assignee</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="priority">
                                        <div className="flex items-center gap-2">
                                            <Flag className="w-4 h-4" />
                                            <span>Priority</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}

                        {/* Sort By Toggle (Table View) */}
                        {viewMode === 'table' && (
                            <div className="flex items-center gap-2">
                                <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                                    <SelectTrigger className="w-[140px] h-9">
                                        <ArrowUpAZ className="w-4 h-4 mr-2 text-muted-foreground" />
                                        <SelectValue placeholder="Sort By" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="updatedAt">Updated Date</SelectItem>
                                        <SelectItem value="priority">Priority</SelectItem>
                                        <SelectItem value="status">Status</SelectItem>
                                        <SelectItem value="taskName">Task Name</SelectItem>
                                        <SelectItem value="projectId">Project</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9"
                                    onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                                    title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                                >
                                    {sortDirection === 'asc' ? <ArrowUpAZ className="h-4 w-4" /> : <ArrowDownAZ className="h-4 w-4" />}
                                </Button>
                            </div>
                        )}

                        {/* View Toggle */}
                        <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as ViewMode)}>
                            <ToggleGroupItem value="board" aria-label="Board view" className="gap-2 h-9">
                                <Kanban className="w-4 h-4" />
                                <span className="hidden sm:inline">Board</span>
                            </ToggleGroupItem>
                            <ToggleGroupItem value="table" aria-label="Table view" className="gap-2 h-9">
                                <Table2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Table</span>
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-4 items-center">
                    <div className="w-[200px]">
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {projects.map(project => (
                                    <SelectItem key={project._id} value={project._id}>
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="text-sm text-muted-foreground">
                        {allTasks.length} {allTasks.length === 1 ? 'task' : 'tasks'}
                    </div>
                </div>
            </div>

            {/* View Content */}
            {viewMode === 'table' ? (
                <TaskTableView
                    tasks={allTasks}
                    onTaskClick={handleCardClick}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortChange={(field, direction) => {
                        setSortField(field);
                        setSortDirection(direction);
                    }}
                    onStatusChange={async (taskId, newStatus) => {
                        const task = tasks.find(t => t._id === taskId);
                        if (!task || task.status === newStatus) return;

                        setTasks(prevTasks =>
                            prevTasks.map(t =>
                                t._id === taskId ? { ...t, status: newStatus } : t
                            )
                        );

                        try {
                            await api.put(`/tasks/${taskId}`, { status: newStatus });
                            toast({
                                title: 'Task Updated',
                                description: `Task moved to ${newStatus.replace('_', ' ').toUpperCase()}`,
                            });
                        } catch (error: any) {
                            console.error('Error updating task:', error);
                            setTasks(prevTasks =>
                                prevTasks.map(t =>
                                    t._id === taskId ? { ...t, status: task.status } : t
                                )
                            );
                            toast({
                                title: 'Error',
                                description: error.response?.data?.message || 'Failed to update task',
                                variant: 'destructive',
                            });
                        }
                    }}
                />
            ) : (
                /* Board View */
                <DndContext
                    sensors={sensors}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="h-full">
                        {groupBy === 'none' ? (
                            /* Standard Board View */
                            <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-280px)]">
                                {kanbanColumns.map((column) => {
                                    // Filter tasks for this column
                                    const tasksInColumn = groupedTasks[0] ? groupedTasks[0].tasks.filter(t => t.status === column.id) : [];

                                    return (
                                        <KanbanColumn
                                            key={column.id}
                                            id={column.id}
                                            title={column.title}
                                            count={tasksInColumn.length}
                                            tasks={tasksInColumn}
                                            onCardClick={handleCardClick}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            /* Swimlane View */
                            <div className="space-y-6 pb-8">
                                {groupedTasks.map((group) => (
                                    <BoardSwimlane
                                        key={group.id}
                                        id={group.id}
                                        title={group.title}
                                        tasks={group.tasks}
                                        columns={kanbanColumns}
                                        onCardClick={handleCardClick}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Drag Overlay */}
                    <DragOverlay>
                        {activeTask ? (
                            <div className="rotate-3 opacity-90">
                                <KanbanCard task={activeTask} onClick={() => { }} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            {/* Empty State */}
            {allTasks.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No tasks found.</p>
                    <Button onClick={() => navigate('/board')}>
                        Create Your First Task
                    </Button>
                </div>
            )}
        </MainLayout>
    );
}
