import { ShoppingListWithRelations } from '@/hooks/useShoppingLists';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import {
  Calendar,
  ShoppingCart,
  User,
  Package,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ShoppingListCardProps {
  list: ShoppingListWithRelations;
  compact?: boolean;
}

const priorityVariants: Record<string, 'priority-low' | 'priority-medium' | 'priority-high' | 'priority-urgent'> = {
  low: 'priority-low',
  medium: 'priority-medium',
  high: 'priority-high',
  urgent: 'priority-urgent',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  delivered: 'Delivered',
  waiting_confirmation: 'Awaiting Confirmation',
  completed: 'Completed',
  returned_for_fix: 'Needs Fix',
};

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  assigned: 'bg-info/10 text-info',
  in_progress: 'bg-status-progress/10 text-status-progress',
  delivered: 'bg-warning/10 text-warning',
  waiting_confirmation: 'bg-accent/10 text-accent',
  completed: 'bg-success/10 text-success',
  returned_for_fix: 'bg-destructive/10 text-destructive',
};

export function ShoppingListCard({ list, compact = false }: ShoppingListCardProps) {
  const formatDueDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const isOverdue = list.due_date && isPast(new Date(list.due_date)) && list.status !== 'completed';
  
  const items = list.items || [];
  const itemsProgress = {
    total: items.length,
    found: items.filter(i => i.status === 'found' || i.status === 'alternative').length,
    notFound: items.filter(i => i.status === 'not_found').length,
  };

  if (compact) {
    return (
      <Link
        to={`/shopping-lists/${list.id}`}
        className="flex items-center gap-4 rounded-xl border bg-card p-4 card-interactive group touch-feedback"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0 group-hover:scale-110 transition-transform">
          <ShoppingCart className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate group-hover:text-accent transition-colors">{list.title}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant={priorityVariants[list.priority]} className="text-xs">
              {list.priority}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {itemsProgress.found}/{itemsProgress.total} items
            </span>
          </div>
        </div>
        <Badge className={cn("text-xs shrink-0", statusColors[list.status])}>
          {statusLabels[list.status]}
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5" />
      </Link>
    );
  }

  return (
    <Link
      to={`/shopping-lists/${list.id}`}
      className="block rounded-xl border bg-card p-5 card-interactive group animate-fade-in touch-feedback"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={priorityVariants[list.priority]}>
                {list.priority}
              </Badge>
              <Badge className={cn(statusColors[list.status])}>
                {statusLabels[list.status]}
              </Badge>
            </div>
            <h3 className="font-semibold text-lg truncate group-hover:text-accent transition-colors">
              {list.title}
            </h3>
            {list.notes && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {list.notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {itemsProgress.total > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Items Progress</span>
            <span className="font-medium">{itemsProgress.found}/{itemsProgress.total}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-success transition-all duration-300"
              style={{ width: `${(itemsProgress.found / itemsProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
        {list.due_date && (
          <div className={cn(
            "flex items-center gap-1.5",
            isOverdue && "text-destructive"
          )}>
            <Calendar className="h-4 w-4" />
            <span>{formatDueDate(list.due_date)}</span>
            {isOverdue && <span className="font-medium">(Overdue)</span>}
          </div>
        )}
        {list.createdByProfile && (
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4" />
            <span>By {list.createdByProfile.name.split(' ')[0]}</span>
          </div>
        )}
        {list.assignedToProfile && (
          <div className="flex items-center gap-1.5">
            <Package className="h-4 w-4" />
            <span>Assigned to {list.assignedToProfile.name.split(' ')[0]}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
