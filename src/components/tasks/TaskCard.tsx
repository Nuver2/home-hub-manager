import { TaskWithAssignees } from '@/hooks/useTasks';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import {
  Calendar,
  MapPin,
  Users,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TaskCardProps {
  task: TaskWithAssignees;
  compact?: boolean;
}

const priorityVariants: Record<string, 'priority-low' | 'priority-medium' | 'priority-high' | 'priority-urgent'> = {
  low: 'priority-low',
  medium: 'priority-medium',
  high: 'priority-high',
  urgent: 'priority-urgent',
};

const statusVariants: Record<string, 'status-todo' | 'status-progress' | 'status-completed' | 'status-hold'> = {
  to_do: 'status-todo',
  in_progress: 'status-progress',
  completed: 'status-completed',
  on_hold: 'status-hold',
};

const statusLabels: Record<string, string> = {
  to_do: 'To Do',
  in_progress: 'In Progress',
  completed: 'Completed',
  on_hold: 'On Hold',
};

const categoryIcons: Record<string, string> = {
  cleaning: '🧹',
  kitchen: '👨‍🍳',
  driving: '🚗',
  shopping: '🛒',
  maintenance: '🔧',
  other: '📋',
};

export function TaskCard({ task, compact = false }: TaskCardProps) {
  const formatDueDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed';

  if (compact) {
    return (
      <Link
        to={`/tasks/${task.id}`}
        className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-all duration-200 hover:shadow-medium hover:-translate-y-0.5 group"
      >
        <span className="text-xl">{categoryIcons[task.category]}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate group-hover:text-accent transition-colors">{task.title}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={priorityVariants[task.priority]} className="text-xs">
              {task.priority}
            </Badge>
            <Badge variant={statusVariants[task.status]} className="text-xs">
              {statusLabels[task.status]}
            </Badge>
          </div>
        </div>
        {task.due_date && (
          <span className={cn(
            "text-sm",
            isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
          )}>
            {formatDueDate(task.due_date)}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
    );
  }

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="block rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-medium hover:-translate-y-0.5 group animate-fade-in"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-2xl shrink-0">
            {categoryIcons[task.category]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={priorityVariants[task.priority]}>
                {task.priority}
              </Badge>
              <Badge variant={statusVariants[task.status]}>
                {statusLabels[task.status]}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg truncate group-hover:text-accent transition-colors">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
        {task.due_date && (
          <div className={cn(
            "flex items-center gap-1.5",
            isOverdue && "text-destructive"
          )}>
            <Calendar className="h-4 w-4" />
            <span>{formatDueDate(task.due_date)}</span>
            {isOverdue && <span className="font-medium">(Overdue)</span>}
          </div>
        )}
        {task.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            <span>{task.location}</span>
          </div>
        )}
        {task.assignedUsers && task.assignedUsers.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{task.assignedUsers.map(u => u.name.split(' ')[0]).join(', ')}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
