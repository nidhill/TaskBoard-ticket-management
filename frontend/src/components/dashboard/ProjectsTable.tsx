import { Link } from 'react-router-dom';
import { Project } from '@/types';
import { StatusPill } from '@/components/shared/StatusPill';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ExternalLink, Box } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectsTableProps {
  projects: Project[];
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const recentProjects = projects.slice(0, 5);

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Projects</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/projects" className="flex items-center gap-1">
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-lg">
            <Box className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground font-medium mb-1">No projects yet</p>
            <p className="text-xs text-muted-foreground/70 max-w-[200px]">
              Create a new project to get started tracking your work.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                    Project
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                    Client
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                    Progress
                  </th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                    Deadline
                  </th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider py-3 px-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentProjects.map((project) => (
                  <tr key={project._id} className="hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4">
                      <p className="font-medium text-foreground">{project.name}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-muted-foreground">{project.clientName}</p>
                    </td>
                    <td className="py-4 px-4">
                      <StatusPill status={project.status} />
                    </td>
                    <td className="py-4 px-4 min-w-[150px]">
                      <ProgressBar
                        value={project.completedPages}
                        max={project.pagesCount || 1} // Avoid divide by zero
                      />
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(project.deliveryDate), 'MMM d, yyyy')}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/projects/${project._id}`}>
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
