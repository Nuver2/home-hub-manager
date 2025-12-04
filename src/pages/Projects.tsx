import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Search,
  FolderKanban,
  Calendar,
  CheckSquare,
  ShoppingCart,
  ChevronRight,
} from 'lucide-react';
import { mockProjects } from '@/data/mockData';
import { Link, Navigate } from 'react-router-dom';
import { format, isFuture, isPast } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Projects() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  // Only parents can access this page
  if (user?.role !== 'parent') {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredProjects = mockProjects.filter(project => {
    return project.title.toLowerCase().includes(search.toLowerCase()) ||
      project.description?.toLowerCase().includes(search.toLowerCase());
  });

  const upcomingProjects = filteredProjects.filter(p => isFuture(new Date(p.date)));
  const pastProjects = filteredProjects.filter(p => isPast(new Date(p.date)));

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Organize tasks and shopping lists into projects
            </p>
          </div>
          <Link to="/projects/new">
            <Button variant="accent">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredProjects.length > 0 ? (
          <div className="space-y-8">
            {/* Upcoming Projects */}
            {upcomingProjects.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Upcoming</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {upcomingProjects.map((project, index) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="block animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <Card className="h-full transition-all duration-200 hover:shadow-medium hover:-translate-y-0.5 group">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                <FolderKanban className="h-5 w-5" />
                              </div>
                              <div>
                                <CardTitle className="group-hover:text-accent transition-colors">
                                  {project.title}
                                </CardTitle>
                                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {format(new Date(project.date), 'MMM d, yyyy')}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          {project.description && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <CheckSquare className="h-4 w-4" />
                              <span>{project.tasks.length} tasks</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <ShoppingCart className="h-4 w-4" />
                              <span>{project.shoppingLists.length} lists</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Past Projects */}
            {pastProjects.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-muted-foreground">Past</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {pastProjects.map((project, index) => (
                    <Link
                      key={project.id}
                      to={`/projects/${project.id}`}
                      className="block animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <Card className="h-full transition-all duration-200 hover:shadow-medium hover:-translate-y-0.5 group opacity-75 hover:opacity-100">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                                <FolderKanban className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <CardTitle className="group-hover:text-accent transition-colors">
                                  {project.title}
                                </CardTitle>
                                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {format(new Date(project.date), 'MMM d, yyyy')}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <CheckSquare className="h-4 w-4" />
                              <span>{project.tasks.length} tasks</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <ShoppingCart className="h-4 w-4" />
                              <span>{project.shoppingLists.length} lists</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <FolderKanban className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? 'Try adjusting your search'
                : 'Get started by creating your first project'}
            </p>
            <Link to="/projects/new">
              <Button variant="accent">
                <Plus className="h-4 w-4" />
                Create Project
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
