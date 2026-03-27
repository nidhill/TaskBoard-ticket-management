import { Link } from 'react-router-dom';
import { Project } from '@/types';
import { StatusPill } from '@/components/shared/StatusPill';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/button';
import { ArrowRight, ExternalLink, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectsTableProps {
  projects: Project[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const recentProjects = projects.slice(0, 5);

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Active Projects</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Most recently updated</p>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-gray-500 hover:text-gray-900 -mr-2">
          <Link to="/projects" className="flex items-center gap-1.5 text-xs font-medium">
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>

      {/* Body */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <FolderOpen className="w-5 h-5 text-muted-foreground/40" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">No projects yet</p>
          <p className="text-xs text-muted-foreground/70 max-w-[200px]">Create a project to start tracking work.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-[1.2px] py-3 px-6">Project</th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-[1.2px] py-3 px-4">Client</th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-[1.2px] py-3 px-4">Status</th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-[1.2px] py-3 px-4">Progress</th>
                <th className="text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-[1.2px] py-3 px-4">Deadline</th>
                <th className="py-3 px-4" />
              </tr>
            </thead>
            <tbody>
              {recentProjects.map((project) => (
                <tr key={project._id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-6">
                    <p className="text-sm font-semibold text-foreground">{project.name}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-sm text-muted-foreground">{project.clientName}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusPill status={project.status} />
                  </td>
                  <td className="py-3.5 px-4 min-w-[140px]">
                    <ProgressBar value={project.completedPages} max={project.pagesCount || 1} />
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(project.deliveryDate), 'MMM d, yyyy')}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button variant="ghost" size="icon" asChild className="w-7 h-7 text-gray-400 hover:text-gray-700">
                      <Link to={`/projects/${project._id}`}>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
