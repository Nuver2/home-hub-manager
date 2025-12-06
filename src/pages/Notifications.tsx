import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  Check,
  CheckCheck,
  CheckSquare,
  ShoppingCart,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '@/hooks/useNotifications';
import { formatRelativeTime } from '@/lib/date-utils';

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  task_assigned: CheckSquare,
  task_status_changed: CheckSquare,
  shopping_list_assigned: ShoppingCart,
  shopping_list_status_changed: ShoppingCart,
  suggestion_approved: Lightbulb,
  suggestion_rejected: Lightbulb,
  new_comment: MessageSquare,
};

export default function Notifications() {
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkNotificationRead();
  const markAllAsRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead.mutateAsync(id);
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Skeleton className="h-8 w-40 mb-2 skeleton-shimmer" />
              <Skeleton className="h-4 w-64 skeleton-shimmer" />
            </div>
          </div>
          <div className="space-y-3 stagger-children">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-20 rounded-xl skeleton-shimmer" />
            ))}
          </div>
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl lg:text-3xl font-bold">Notifications</h1>
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} new</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Stay updated with your tasks and activities
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              onClick={handleMarkAllAsRead}
              disabled={markAllAsRead.isPending}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification, index) => {
              const Icon = typeIcons[notification.type] || Bell;
              
              return (
                <div
                  key={notification.id}
                  className={cn(
                    "flex gap-4 rounded-xl border p-4 transition-all duration-200 animate-slide-up group touch-feedback",
                    notification.read 
                      ? "bg-card hover:bg-secondary/30" 
                      : "bg-accent/5 border-accent/20 hover:bg-accent/10"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl shrink-0 transition-transform group-hover:scale-110",
                    notification.read ? "bg-secondary" : "bg-accent/10"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5",
                      notification.read ? "text-muted-foreground" : "text-accent"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm",
                      !notification.read && "font-medium"
                    )}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatRelativeTime(notification.created_at)}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => handleMarkAsRead(notification.id)}
                      disabled={markAsRead.isPending}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-12 text-center animate-fade-in">
            <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Bell className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">All caught up!</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              You have no notifications right now. We'll let you know when something needs your attention.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
