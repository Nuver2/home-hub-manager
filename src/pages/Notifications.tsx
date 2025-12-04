import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Check,
  CheckCheck,
  CheckSquare,
  ShoppingCart,
  Lightbulb,
  MessageSquare,
} from 'lucide-react';
import { mockNotifications } from '@/data/mockData';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

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
  const [notifications, setNotifications] = useState(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

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
            <Button variant="outline" onClick={markAllAsRead}>
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
                    "flex gap-4 rounded-xl border p-4 transition-all duration-200 animate-fade-in",
                    notification.read 
                      ? "bg-card" 
                      : "bg-accent/5 border-accent/20"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
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
                      {format(new Date(notification.createdAt), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No notifications</h3>
            <p className="text-muted-foreground">
              You're all caught up! Notifications will appear here.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
