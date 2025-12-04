import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { mockActivityLog } from '@/data/mockData';
import { Navigate } from 'react-router-dom';
import { format } from 'date-fns';

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
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  // Only parents can access this page
  if (user?.role !== 'parent') {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredActivities = mockActivityLog.filter(activity => {
    const matchesSearch = activity.details?.toLowerCase().includes(search.toLowerCase()) ||
      activity.user.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || activity.targetType === typeFilter;
    const matchesAction = actionFilter === 'all' || activity.action === actionFilter;
    
    return matchesSearch && matchesType && matchesAction;
  });

  return (
    <DashboardLayout>
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
        {filteredActivities.length > 0 ? (
          <div className="space-y-4">
            {filteredActivities.map((activity, index) => {
              const Icon = targetTypeIcons[activity.targetType] || Activity;
              
              return (
                <div
                  key={activity.id}
                  className="flex gap-4 rounded-xl border bg-card p-4 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium">{activity.user.name}</span>
                      <span className={actionColors[activity.action] || 'text-muted-foreground'}>
                        {activity.action.replace('_', ' ')}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {activity.targetType.replace('_', ' ')}
                      </Badge>
                    </div>
                    {activity.details && (
                      <p className="text-sm text-muted-foreground">{activity.details}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(activity.createdAt), 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Activity className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No activities found</h3>
            <p className="text-muted-foreground">
              {search || typeFilter !== 'all' || actionFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Activities will appear here as actions are taken'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
