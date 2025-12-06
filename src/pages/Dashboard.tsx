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
      <div className="p-4 lg:p-8 space-y-5">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold">
              Hi, {user?.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {format(new Date(), 'EEEE, MMM d')}
            </p>
          </div>
          {isParent && (
            <Link to="/tasks/new" className="hidden sm:block">
              <Button variant="accent" size="sm">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </Link>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard
            title="Tasks"
            value={stats.totalTasks}
            subtitle={`${stats.completedTasks} done`}
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
              title="Shopping"
              value={stats.totalShoppingLists}
              subtitle={`${stats.activeShoppingLists} active`}
              icon={ShoppingCart}
              variant="accent"
            />
          )}
          {isParent && (
            <StatCard
              title="Staff"
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
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Upcoming Tasks */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Upcoming Tasks</h2>
              <Link to="/tasks">
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  View all
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} compact />
                ))
              ) : (
                <div className="rounded-xl border bg-card p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary mx-auto mb-3">
                    <CheckSquare className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">No upcoming tasks</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5">
            {/* Shopping Lists */}
            {(isParent || user?.role === 'chef' || user?.role === 'driver') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Active Shopping</h2>
                  <Link to="/shopping-lists">
                    <Button variant="ghost" size="sm" className="h-8">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
                <div className="space-y-2">
                  {activeShoppingLists.length > 0 ? (
                    activeShoppingLists.map((list) => (
                      <ShoppingListCard key={list.id} list={list} compact />
                    ))
                  ) : (
                    <div className="rounded-xl border bg-card p-5 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 mx-auto mb-2">
                        <ShoppingCart className="h-4 w-4 text-accent" />
                      </div>
                      <p className="text-xs text-muted-foreground">No active lists</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pending Suggestions (Parent Only) */}
            {isParent && pendingSuggestions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">Suggestions</h2>
                  <Badge variant="warning" className="text-[10px]">{pendingSuggestions.length}</Badge>
                </div>
                <div className="space-y-2">
                  {pendingSuggestions.slice(0, 2).map((suggestion) => (
                    <Link
                      key={suggestion.id}
                      to="/suggestions"
                      className="block rounded-xl border bg-card p-3 active:scale-[0.98] transition-transform duration-75"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-warning shrink-0">
                          <Lightbulb className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{suggestion.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            by {suggestion.createdByProfile?.name || 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions - Desktop only */}
            {isParent && (
              <div className="hidden lg:block space-y-3">
                <h2 className="font-semibold">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/tasks/new">
                    <Button variant="outline" className="w-full justify-start h-9 text-xs" size="sm">
                      <CheckSquare className="h-3.5 w-3.5" />
                      New Task
                    </Button>
                  </Link>
                  <Link to="/shopping-lists/new">
                    <Button variant="outline" className="w-full justify-start h-9 text-xs" size="sm">
                      <ShoppingCart className="h-3.5 w-3.5" />
                      New List
                    </Button>
                  </Link>
                  <Link to="/staff/new">
                    <Button variant="outline" className="w-full justify-start h-9 text-xs" size="sm">
                      <Users className="h-3.5 w-3.5" />
                      Add Staff
                    </Button>
                  </Link>
                  <Link to="/projects/new">
                    <Button variant="outline" className="w-full justify-start h-9 text-xs" size="sm">
                      <CalendarDays className="h-3.5 w-3.5" />
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
