import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { FolderKanban, CheckSquare } from 'lucide-react';
import api from '@/services/api';

interface SearchTask {
  _id: string;
  taskName: string;
  status: string;
  projectId?: { _id: string; name: string } | null;
}

interface SearchProject {
  _id: string;
  name: string;
  status: string;
  clientName?: string;
}

const TASK_STATUS_COLORS: Record<string, string> = {
  draft: '#6b7280',
  'in-progress': '#3b82f6',
  review: '#f59e0b',
  completed: '#10b981',
  done: '#10b981',
  blocked: '#ef4444',
  cancelled: '#9ca3af',
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  active: '#10b981',
  completed: '#6366f1',
  rejected: '#ef4444',
  'on-hold': '#6b7280',
};

function StatusDot({ status, colorMap }: { status: string; colorMap: Record<string, string> }) {
  const color = colorMap[status] ?? '#9ca3af';
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        marginRight: 6,
      }}
    />
  );
}

export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState<SearchTask[]>([]);
  const [projects, setProjects] = useState<SearchProject[]>([]);
  const [loading, setLoading] = useState(false);

  // Open on Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, []);

  // Listen for custom event dispatched by Sidebar
  useEffect(() => {
    const handleCustomEvent = () => setOpen(true);
    window.addEventListener('open-command-palette', handleCustomEvent);
    return () => window.removeEventListener('open-command-palette', handleCustomEvent);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!open) return;

    const trimmed = query.trim();

    if (!trimmed) {
      setTasks([]);
      setProjects([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [tasksRes, projectsRes] = await Promise.all([
          api.get(`/tasks/search?q=${encodeURIComponent(trimmed)}`),
          api.get(`/projects/search?q=${encodeURIComponent(trimmed)}`),
        ]);
        setTasks(tasksRes.data.tasks ?? []);
        setProjects(projectsRes.data.projects ?? []);
      } catch {
        setTasks([]);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, open]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
    setTasks([]);
    setProjects([]);
  }, []);

  const handleSelectTask = useCallback(
    (id: string) => {
      handleClose();
      navigate(`/tasks/${id}`);
    },
    [navigate, handleClose]
  );

  const handleSelectProject = useCallback(
    (id: string) => {
      handleClose();
      navigate(`/projects/${id}`);
    },
    [navigate, handleClose]
  );

  const hasResults = tasks.length > 0 || projects.length > 0;
  const showEmpty = query.trim().length > 0 && !loading && !hasResults;

  return (
    <CommandDialog
      open={open}
      onOpenChange={(val) => {
        if (!val) handleClose();
      }}
    >
      <CommandInput
        placeholder="Search tasks and projects..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Searching...
          </div>
        )}

        {showEmpty && (
          <CommandEmpty>No results found for &ldquo;{query.trim()}&rdquo;.</CommandEmpty>
        )}

        {!loading && tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {tasks.map((task) => (
              <CommandItem
                key={task._id}
                value={`task-${task._id}-${task.taskName}`}
                onSelect={() => handleSelectTask(task._id)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <CheckSquare className="h-4 w-4 opacity-50 flex-shrink-0" />
                <StatusDot status={task.status} colorMap={TASK_STATUS_COLORS} />
                <span className="flex-1 truncate">{task.taskName}</span>
                {task.projectId?.name && (
                  <span className="ml-auto text-xs text-muted-foreground truncate max-w-[120px]">
                    {task.projectId.name}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!loading && tasks.length > 0 && projects.length > 0 && <CommandSeparator />}

        {!loading && projects.length > 0 && (
          <CommandGroup heading="Projects">
            {projects.map((project) => (
              <CommandItem
                key={project._id}
                value={`project-${project._id}-${project.name}`}
                onSelect={() => handleSelectProject(project._id)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <FolderKanban className="h-4 w-4 opacity-50 flex-shrink-0" />
                <StatusDot status={project.status} colorMap={PROJECT_STATUS_COLORS} />
                <span className="flex-1 truncate">{project.name}</span>
                {project.clientName && (
                  <span className="ml-auto text-xs text-muted-foreground truncate max-w-[120px]">
                    {project.clientName}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
