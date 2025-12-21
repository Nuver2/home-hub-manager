import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, isPast, isFuture } from 'date-fns';
import { Link } from 'react-router-dom';
import { useTasks } from '@/hooks/useTasks';
import { Task } from '@/types/database';
import { cn } from '@/lib/utils';

const priorityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function TasksCalendar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: tasks = [], isLoading } = useTasks();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const isParent = user?.role === 'parent';

  // Get tasks for selected date
  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(task => {
      if (!task.due_date) return false;
      return isSameDay(new Date(task.due_date), date);
    });
  };

  // Get all dates with tasks
  const datesWithTasks = tasks
    .filter(t => t.due_date)
    .map(t => new Date(t.due_date).toDateString());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[600px] rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">{t('tasks.calendar') || 'Task Calendar'}</h1>
            <p className="text-muted-foreground mt-1">
              {t('tasks.viewByDate') || 'View tasks by due date'}
            </p>
          </div>
          {isParent && (
            <Link to="/tasks/new">
              <Button variant="accent">
                <Plus className="h-4 w-4" />
                {t('tasks.newTask')}
              </Button>
            </Link>
          )}
        </div>

        {/* Calendar View */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold">
                    {format(currentDate, 'MMMM yyyy')}
                  </h2>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Calendar Grid */}
                <div className="space-y-2">
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-2">
                    {/* Empty cells for days before month start */}
                    {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                      <div key={`empty-${i}`} className="aspect-square" />
                    ))}

                    {/* Days of month */}
                    {monthDays.map((day) => {
                      const dayTasks = getTasksForDate(day);
                      const hasTasks = dayTasks.length > 0;
                      const isCurrentDay = isToday(day);
                      const isPastDay = isPast(day) && !isCurrentDay;

                      return (
                        <Link
                          key={day.toISOString()}
                          to={`/tasks?date=${format(day, 'yyyy-MM-dd')}`}
                          className={cn(
                            "aspect-square p-2 rounded-lg border transition-all hover:bg-secondary",
                            isCurrentDay && "border-accent bg-accent/10",
                            isPastDay && "opacity-60",
                            hasTasks && "bg-primary/5 border-primary/20"
                          )}
                        >
                          <div className="flex flex-col h-full">
                            <span className={cn(
                              "text-sm font-medium mb-1",
                              isCurrentDay && "text-accent"
                            )}>
                              {format(day, 'd')}
                            </span>
                            {hasTasks && (
                              <div className="flex-1 space-y-1 overflow-hidden">
                                {dayTasks.slice(0, 3).map(task => (
                                  <div
                                    key={task.id}
                                    className={cn(
                                      "text-[10px] px-1 py-0.5 rounded truncate",
                                      priorityColors[task.priority]
                                    )}
                                    title={task.title}
                                  >
                                    {task.title}
                                  </div>
                                ))}
                                {dayTasks.length > 3 && (
                                  <div className="text-[10px] text-muted-foreground">
                                    +{dayTasks.length - 3} more
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Upcoming Tasks */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Upcoming Tasks</h3>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {tasks
                    .filter(t => t.due_date && isFuture(new Date(t.due_date)))
                    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                    .slice(0, 10)
                    .map(task => (
                      <Link
                        key={task.id}
                        to={`/tasks/${task.id}`}
                        className="block p-2 rounded-lg border hover:bg-secondary transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{task.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(task.due_date!), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <Badge className={cn("text-xs shrink-0", priorityColors[task.priority])}>
                            {task.priority}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  {tasks.filter(t => t.due_date && isFuture(new Date(t.due_date))).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No upcoming tasks
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Overdue Tasks */}
            {tasks.filter(t => t.due_date && isPast(new Date(t.due_date)) && t.status !== 'completed').length > 0 && (
              <Card className="border-destructive/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4 text-destructive">Overdue Tasks</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {tasks
                      .filter(t => t.due_date && isPast(new Date(t.due_date)) && t.status !== 'completed')
                      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                      .slice(0, 5)
                      .map(task => (
                        <Link
                          key={task.id}
                          to={`/tasks/${task.id}`}
                          className="block p-2 rounded-lg border border-destructive/20 hover:bg-destructive/5 transition-colors"
                        >
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <p className="text-xs text-destructive">
                            Overdue {format(new Date(task.due_date!), 'MMM d')}
                          </p>
                        </Link>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

