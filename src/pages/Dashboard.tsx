import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { TaskCard } from '@/components/tasks/TaskCard';
import { ShoppingListCard } from '@/components/shopping/ShoppingListCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckSquare,
  ShoppingCart,
  Users,
  Lightbulb,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';
import { mockTasks, mockShoppingLists, mockSuggestions, getDashboardStats, mockUsers } from '@/data/mockData';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const stats = getDashboardStats(user?.role || '');
  const isParent = user?.role === 'parent';

  // Filter tasks for current user
  const userTasks = isParent 
    ? mockTasks 
    : mockTasks.filter(t => t.assignedUsers.some(u => u.id === user?.id) || (user?.role && t.assignedRoles?.includes(user.role)));

  const upcomingTasks = userTasks
    .filter(t => t.status !== 'completed')
    .slice(0, 3);

  // Filter shopping lists for current user
  const userShoppingLists = isParent
    ? mockShoppingLists
    : user?.role === 'chef' || user?.role === 'driver'
      ? mockShoppingLists.filter(l => 
          l.createdBy.id === user?.id || 
          l.assignedTo?.id === user?.id
        )
      : [];

  const activeShoppingLists = userShoppingLists
    .filter(l => l.status !== 'completed' && l.status !== 'draft')
    .slice(0, 2);

  const pendingSuggestions = mockSuggestions.filter(s => s.status === 'pending');

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="animate-slide-up">
            <h1 className="text-2xl lg:text-3xl font-bold">
              Welcome back, {user?.name.split(' ')[0]}!
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Tasks"
            value={isParent ? stats.totalTasks : userTasks.length}
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
              value={isParent ? stats.totalShoppingLists : userShoppingLists.length}
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
              value={userTasks.filter(t => t.status === 'to_do').length}
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
                <div className="rounded-xl border bg-card p-8 text-center">
                  <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No upcoming tasks</p>
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
                    <div className="rounded-xl border bg-card p-6 text-center">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No active lists</p>
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
                            by {suggestion.createdBy.name}
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
