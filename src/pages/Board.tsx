import { useState, useEffect, useRef } from 'react';
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
import { Loader2, LayoutGrid, Table2, Kanban, Layers, Users, Flag, Briefcase, ArrowUpAZ, ArrowDownAZ, Download, CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
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
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth, isPast, isToday } from 'date-fns';

// Kanban column definitions
const kanbanColumns = [
    { id: 'to_do' as TaskStatus, title: 'TO DO' },
    { id: 'in_progress' as TaskStatus, title: 'IN PROGRESS' },
    { id: 'in_review' as TaskStatus, title: 'IN REVIEW' },
    { id: 'done' as TaskStatus, title: 'DONE' }
];

type ViewMode = 'board' | 'table' | 'calendar';
type GroupBy = 'none' | 'project' | 'assignee' | 'priority';

const COOLDOWN_MS = 30_000; // 30 seconds per task

export default function Board() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const lastStatusUpdate = useRef<Map<string, number>>(new Map());
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

    // Bulk select state
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [bulkStatus, setBulkStatus] = useState<TaskStatus>('in_progress');

    // Calendar state
    const [calendarDate, setCalendarDate] = useState(new Date());

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

        // 30-second cooldown per task
        const lastUpdate = lastStatusUpdate.current.get(taskId) || 0;
        const elapsed = Date.now() - lastUpdate;
        if (elapsed < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
            toast({
                title: 'Update limit',
                description: `Please wait ${remaining}s before moving this task again.`,
                variant: 'destructive',
            });
            return;
        }
        lastStatusUpdate.current.set(taskId, Date.now());

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

    const exportCSV = () => {
        const headers = ['ID', 'Task Name', 'Project', 'Assignee', 'Status', 'Priority', 'Tickets Used', 'Max Tickets', 'Due Date', 'Updated At'];
        const rows = allTasks.map(t => [
            t._id.slice(-6),
            t.taskName,
            typeof t.projectId === 'object' ? (t.projectId as any).name : '',
            t.assignedDeveloper?.name || 'Unassigned',
            t.status.replace(/_/g, ' '),
            t.priority || 'medium',
            t.ticketUsed,
            t.maxTickets,
            t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
            new Date(t.updatedAt).toLocaleDateString(),
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'tasks-export.csv'; a.click();
        URL.revokeObjectURL(url);
    };

    const handleBulkUpdate = async () => {
        if (!selectedTaskIds.length) return;
        try {
            await Promise.all(selectedTaskIds.map(id => api.put(`/tasks/${id}`, { status: bulkStatus })));
            setTasks(prev => prev.map(t => selectedTaskIds.includes(t._id) ? { ...t, status: bulkStatus } : t));
            toast({ title: 'Bulk Update', description: `${selectedTaskIds.length} tasks moved to ${bulkStatus.replace(/_/g, ' ')}.` });
            setSelectedTaskIds([]);
        } catch {
            toast({ title: 'Error', description: 'Failed to update some tasks.', variant: 'destructive' });
        }
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

                        {/* CSV Export */}
                        <Button variant="outline" size="sm" className="h-9 gap-2" onClick={exportCSV}>
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export</span>
                        </Button>

                        {/* View Toggle */}
                        <ToggleGroup type="single" value={viewMode} onValueChange={(value) => { if (value) { setViewMode(value as ViewMode); setSelectedTaskIds([]); } }}>
                            <ToggleGroupItem value="board" aria-label="Board view" className="gap-2 h-9">
                                <Kanban className="w-4 h-4" />
                                <span className="hidden sm:inline">Board</span>
                            </ToggleGroupItem>
                            <ToggleGroupItem value="table" aria-label="Table view" className="gap-2 h-9">
                                <Table2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Table</span>
                            </ToggleGroupItem>
                            <ToggleGroupItem value="calendar" aria-label="Calendar view" className="gap-2 h-9">
                                <CalendarDays className="w-4 h-4" />
                                <span className="hidden sm:inline">Calendar</span>
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
            {viewMode === 'calendar' ? (
                /* ── Calendar View ── */
                (() => {
                    const monthStart = startOfMonth(calendarDate);
                    const monthEnd = endOfMonth(calendarDate);
                    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
                    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
                    const days = eachDayOfInterval({ start: calStart, end: calEnd });
                    const priorityDot: Record<string, string> = { high: '#f97316', medium: '#eab308', low: '#3b82f6' };
                    return (
                        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
                            {/* Calendar header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b">
                                <h2 className="font-semibold text-lg">{format(calendarDate, 'MMMM yyyy')}</h2>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-8" onClick={() => setCalendarDate(new Date())}>Today</Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCalendarDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                            {/* Day headers */}
                            <div className="grid grid-cols-7 border-b">
                                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                                    <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">{d}</div>
                                ))}
                            </div>
                            {/* Calendar grid */}
                            <div className="grid grid-cols-7">
                                {days.map((day, i) => {
                                    const dayTasks = allTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day));
                                    const isCurrentMonth = isSameMonth(day, calendarDate);
                                    const isOverdueDay = isPast(day) && !isToday(day);
                                    return (
                                        <div key={i} className={cn('min-h-[110px] p-2 border-b border-r', !isCurrentMonth && 'bg-muted/30', i % 7 === 6 && 'border-r-0')}>
                                            <span className={cn('text-xs font-semibold inline-flex w-6 h-6 items-center justify-center rounded-full mb-1',
                                                isToday(day) && 'bg-primary text-primary-foreground',
                                                !isCurrentMonth && 'text-muted-foreground',
                                                isCurrentMonth && !isToday(day) && 'text-foreground'
                                            )}>
                                                {format(day, 'd')}
                                            </span>
                                            <div className="space-y-0.5">
                                                {dayTasks.slice(0, 3).map(t => {
                                                    const overdue = t.status !== 'done' && isOverdueDay;
                                                    return (
                                                        <div key={t._id} onClick={() => navigate(`/tasks/${t._id}`)}
                                                            className={cn('text-[10px] px-1.5 py-0.5 rounded cursor-pointer truncate flex items-center gap-1 font-medium',
                                                                overdue ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-primary/10 text-primary hover:bg-primary/20'
                                                            )}>
                                                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: priorityDot[t.priority || 'medium'] }} />
                                                            {t.taskName}
                                                        </div>
                                                    );
                                                })}
                                                {dayTasks.length > 3 && <div className="text-[10px] text-muted-foreground px-1">+{dayTasks.length - 3} more</div>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()
            ) : viewMode === 'table' ? (
                <TaskTableView
                    tasks={allTasks}
                    onTaskClick={handleCardClick}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortChange={(field, direction) => {
                        setSortField(field);
                        setSortDirection(direction);
                    }}
                    selectedIds={selectedTaskIds}
                    onSelectionChange={setSelectedTaskIds}
                    onStatusChange={async (taskId, newStatus) => {
                        const task = tasks.find(t => t._id === taskId);
                        if (!task || task.status === newStatus) return;

                        // 30-second cooldown per task
                        const lastUpdate = lastStatusUpdate.current.get(taskId) || 0;
                        const elapsed = Date.now() - lastUpdate;
                        if (elapsed < COOLDOWN_MS) {
                            const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
                            toast({
                                title: 'Update limit',
                                description: `Please wait ${remaining}s before updating this task again.`,
                                variant: 'destructive',
                            });
                            return;
                        }
                        lastStatusUpdate.current.set(taskId, Date.now());

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

            {/* Bulk Action Bar */}
            {selectedTaskIds.length > 0 && viewMode === 'table' && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-xl shadow-2xl px-5 py-3 flex items-center gap-3 z-50 border border-gray-700">
                    <span className="text-sm font-semibold">{selectedTaskIds.length} selected</span>
                    <div className="w-px h-4 bg-gray-600" />
                    <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as TaskStatus)}>
                        <SelectTrigger className="h-8 w-[140px] bg-gray-800 border-gray-600 text-white text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="to_do">To Do</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="in_review">In Review</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button size="sm" className="h-8 bg-white text-gray-900 hover:bg-gray-100 font-semibold" onClick={handleBulkUpdate}>
                        Apply
                    </Button>
                    <button onClick={() => setSelectedTaskIds([])} className="text-gray-400 hover:text-white transition-colors ml-1">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </MainLayout>
    );
}
