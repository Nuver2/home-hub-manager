import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/Pagination';
import { PullToRefresh } from '@/components/PullToRefresh';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Activity,
  CheckSquare,
  ShoppingCart,
  Users,
  Lightbulb,
  FolderKanban,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useActivityLog } from '@/hooks/useActivityLog';
import { usePagination } from '@/hooks/usePagination';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatRelativeTime } from '@/lib/date-utils';

const targetTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  task: CheckSquare,
  shopping_list: ShoppingCart,
  user: Users,
  suggestion: Lightbulb,
  project: FolderKanban,
};

const actionColors: Record<string, string> = {
  created: 'text-success',
  updated: 'text-info',
  deleted: 'text-destructive',
  status_changed: 'text-warning',
};

export default function ActivityLog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: activities = [], isLoading } = useActivityLog();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Only parents can access this page
  if (user?.role !== 'parent') {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.details?.toLowerCase().includes(search.toLowerCase()) ||
      activity.userProfile?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || activity.target_type === typeFilter;
    const matchesAction = actionFilter === 'all' || activity.action === actionFilter;
    
    return matchesSearch && matchesType && matchesAction;
  });

  // Pagination
  const {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination({ data: filteredActivities, itemsPerPage: 20 });

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['activity-log'] });
  }, [queryClient]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 space-y-6">
          <div>
            <Skeleton className="h-8 w-40 mb-2 skeleton-shimmer" />
            <Skeleton className="h-4 w-64 skeleton-shimmer" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-11 flex-1 skeleton-shimmer" />
            <Skeleton className="h-11 w-40 skeleton-shimmer" />
            <Skeleton className="h-11 w-40 skeleton-shimmer" />
          </div>
          <div className="space-y-4 stagger-children">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-24 rounded-xl skeleton-shimmer" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const content = (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground mt-1">
          Track all actions and changes in the system
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="task">Tasks</SelectItem>
            <SelectItem value="shopping_list">Shopping Lists</SelectItem>
            <SelectItem value="user">Users</SelectItem>
            <SelectItem value="suggestion">Suggestions</SelectItem>
            <SelectItem value="project">Projects</SelectItem>
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="created">Created</SelectItem>
            <SelectItem value="updated">Updated</SelectItem>
            <SelectItem value="deleted">Deleted</SelectItem>
            <SelectItem value="status_changed">Status Changed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity List */}
      {paginatedData.length > 0 ? (
        <>
          <div className="space-y-3 stagger-children">
            {paginatedData.map((activity) => {
              const Icon = targetTypeIcons[activity.target_type] || Activity;
              
              return (
                <div
                  key={activity.id}
                  className="flex gap-4 rounded-xl border bg-card p-4 card-interactive group touch-feedback"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary shrink-0 group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium">{activity.userProfile?.name || 'Unknown User'}</span>
                      <span className={actionColors[activity.action] || 'text-muted-foreground'}>
                        {activity.action.replace('_', ' ')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {activity.target_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    {activity.details && (
                      <p className="text-sm text-muted-foreground">{activity.details}</p>
                    )}
                    <p className="text-xs text-muted-foreground/70 mt-2">
                      {formatRelativeTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex} to {endIndex} of {totalItems} activities
              </p>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
              />
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border bg-card p-12 text-center animate-fade-in">
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Activity className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No activities found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {search || typeFilter !== 'all' || actionFilter !== 'all'
              ? 'Try adjusting your filters to find what you\'re looking for'
              : 'Activities will appear here as actions are taken in the system'}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      {isMobile ? (
        <PullToRefresh onRefresh={handleRefresh}>
          {content}
        </PullToRefresh>
      ) : (
        content
      )}
    </DashboardLayout>
  );
}
