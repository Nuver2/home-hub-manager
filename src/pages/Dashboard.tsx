import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { TaskCard } from '@/components/tasks/TaskCard';
import { ShoppingListCard } from '@/components/shopping/ShoppingListCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckSquare,
  ShoppingCart,
  Users,
  Lightbulb,
  Clock,
  Plus,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useTasks } from '@/hooks/useTasks';
import { useShoppingLists } from '@/hooks/useShoppingLists';
import { useSuggestions } from '@/hooks/useSuggestions';
import { useStaff } from '@/hooks/useStaff';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: shoppingLists = [], isLoading: listsLoading } = useShoppingLists();
  const { data: suggestions = [], isLoading: suggestionsLoading } = useSuggestions();
  const { data: staff = [], isLoading: staffLoading } = useStaff();

  const isParent = user?.role === 'parent';
  const isLoading = tasksLoading || listsLoading || suggestionsLoading || staffLoading;

  // Calculate stats
  const stats = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    pendingTasks: tasks.filter(t => t.status === 'to_do').length,
    totalShoppingLists: shoppingLists.length,
    activeShoppingLists: shoppingLists.filter(l => l.status !== 'completed' && l.status !== 'draft').length,
    totalStaff: staff.length,
  };

  const upcomingTasks = tasks
    .filter(t => t.status !== 'completed')
    .slice(0, 3);

  const activeShoppingLists = shoppingLists
    .filter(l => l.status !== 'completed' && l.status !== 'draft')
    .slice(0, 2);

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Skeleton className="h-8 w-64 mb-2 skeleton-shimmer" />
              <Skeleton className="h-4 w-48 skeleton-shimmer" />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-xl skeleton-shimmer" />
            ))}
          </div>
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-6 w-32 skeleton-shimmer" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-20 rounded-xl skeleton-shimmer" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="animate-slide-up">
            <h1 className="text-2xl lg:text-3xl font-bold">
              Welcome back, {user?.name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-muted-foreground mt-1">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          {isParent && (
            <div className="flex gap-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <Link to="/tasks/new">
                <Button variant="accent">
                  <Plus className="h-4 w-4" />
                  New Task
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          <StatCard
            title="Total Tasks"
            value={stats.totalTasks}
            subtitle={`${stats.completedTasks} completed`}
            icon={CheckSquare}
            variant="default"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgressTasks}
            icon={Clock}
            variant="info"
          />
          {(isParent || user?.role === 'chef' || user?.role === 'driver') && (
            <StatCard
              title="Shopping Lists"
              value={stats.totalShoppingLists}
              subtitle={`${stats.activeShoppingLists} active`}
              icon={ShoppingCart}
              variant="accent"
            />
          )}
          {isParent && (
            <StatCard
              title="Staff Members"
              value={stats.totalStaff}
              icon={Users}
              variant="success"
            />
          )}
          {!isParent && (
            <StatCard
              title="Pending"
              value={stats.pendingTasks}
              icon={CalendarDays}
              variant="warning"
            />
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Tasks */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Upcoming Tasks</h2>
              <Link to="/tasks">
                <Button variant="ghost" size="sm">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task, index) => (
                  <div 
                    key={task.id} 
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <TaskCard task={task} compact />
                  </div>
                ))
              ) : (
                <div className="rounded-xl border bg-card p-8 text-center animate-fade-in group hover:shadow-soft transition-shadow">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <CheckSquare className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium">No upcoming tasks</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Shopping Lists */}
            {(isParent || user?.role === 'chef' || user?.role === 'driver') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Active Shopping</h2>
                  <Link to="/shopping-lists">
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-3">
                  {activeShoppingLists.length > 0 ? (
                    activeShoppingLists.map((list, index) => (
                      <div 
                        key={list.id}
                        className="animate-slide-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <ShoppingListCard list={list} compact />
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border bg-card p-6 text-center animate-fade-in group hover:shadow-soft transition-shadow">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <ShoppingCart className="h-5 w-5 text-accent" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">No active lists</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pending Suggestions (Parent Only) */}
            {isParent && pendingSuggestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Pending Suggestions</h2>
                  <Badge variant="warning">{pendingSuggestions.length}</Badge>
                </div>
                <div className="space-y-3">
                  {pendingSuggestions.slice(0, 2).map((suggestion, index) => (
                    <Link
                      key={suggestion.id}
                      to="/suggestions"
                      className="block rounded-xl border bg-card p-4 transition-all hover:shadow-medium hover:-translate-y-0.5 animate-slide-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning shrink-0">
                          <Lightbulb className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{suggestion.title}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            by {suggestion.createdByProfile?.name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {isParent && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/tasks/new">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <CheckSquare className="h-4 w-4" />
                      New Task
                    </Button>
                  </Link>
                  <Link to="/shopping-lists/new">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <ShoppingCart className="h-4 w-4" />
                      New List
                    </Button>
                  </Link>
                  <Link to="/staff/new">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Users className="h-4 w-4" />
                      Add Staff
                    </Button>
                  </Link>
                  <Link to="/projects/new">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <CalendarDays className="h-4 w-4" />
                      New Project
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
