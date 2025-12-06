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
        className="flex items-center gap-3 rounded-xl border bg-card p-3 active:scale-[0.98] transition-transform duration-75 group"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 text-lg shrink-0">
          {categoryIcons[task.category]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm">{task.title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Badge variant={priorityVariants[task.priority]} className="text-[10px] px-2 py-0">
              {task.priority}
            </Badge>
            <Badge variant={statusVariants[task.status]} className="text-[10px] px-2 py-0">
              {statusLabels[task.status]}
            </Badge>
          </div>
        </div>
        {task.due_date && (
          <div className={cn(
            "text-right shrink-0",
            isOverdue ? "text-destructive" : "text-muted-foreground"
          )}>
            <span className="text-xs font-medium">{formatDueDate(task.due_date)}</span>
          </div>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      </Link>
    );
  }

  return (
    <Link
      to={`/tasks/${task.id}`}
      className="block rounded-xl border bg-card p-4 active:scale-[0.98] transition-transform duration-75 group"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary text-xl shrink-0">
          {categoryIcons[task.category]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Badge variant={priorityVariants[task.priority]} className="text-[10px] px-2 py-0">
              {task.priority}
            </Badge>
            <Badge variant={statusVariants[task.status]} className="text-[10px] px-2 py-0">
              {statusLabels[task.status]}
            </Badge>
          </div>
          <h3 className="font-semibold text-base truncate">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {task.description}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
        {task.due_date && (
          <div className={cn(
            "flex items-center gap-1",
            isOverdue && "text-destructive"
          )}>
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDueDate(task.due_date)}</span>
          </div>
        )}
        {task.location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate max-w-[100px]">{task.location}</span>
          </div>
        )}
        {task.assignedUsers && task.assignedUsers.length > 0 && (
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{task.assignedUsers.length}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
