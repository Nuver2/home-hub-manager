import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TaskCard } from '@/components/tasks/TaskCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/Pagination';
import { BulkActionsBar } from '@/components/BulkActionsBar';
import { PullToRefresh } from '@/components/PullToRefresh';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTasks, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { usePagination } from '@/hooks/usePagination';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Tasks() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: tasks = [], isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const isParent = user?.role === 'parent';
  const isMobile = useIsMobile();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
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
  } = usePagination({ data: filteredTasks, itemsPerPage: 12 });

  // Bulk selection
  const {
    selectedIds,
    isSelected,
    toggleSelection,
    toggleSelectAll,
    deselectAll,
    isAllSelected,
    isSomeSelected,
    selectedCount,
    hasSelection,
  } = useBulkSelection({ items: paginatedData });

  const statusCounts = {
    all: tasks.length,
    to_do: tasks.filter(t => t.status === 'to_do').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    on_hold: tasks.filter(t => t.status === 'on_hold').length,
  };

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }, [queryClient]);

  const handleBulkComplete = async () => {
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          updateTask.mutateAsync({ id, status: 'completed' })
        )
      );
      toast.success(`${selectedCount} ${t('tasks.markedCompleted')}`);
      deselectAll();
    } catch {
      toast.error(t('errors.failedUpdate'));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => deleteTask.mutateAsync(id))
      );
      toast.success(`${selectedCount} ${t('tasks.deleted')}`);
      deselectAll();
    } catch {
      toast.error(t('errors.failedDelete'));
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Skeleton className="h-8 w-32 mb-2 skeleton-shimmer" />
              <Skeleton className="h-4 w-48 skeleton-shimmer" />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-10 w-24 rounded-lg skeleton-shimmer shrink-0" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-48 rounded-xl skeleton-shimmer" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const content = (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">{t('tasks.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {isParent ? t('tasks.manageAll') : t('tasks.viewAssigned')}
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

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 lg:mx-0 lg:px-0 scrollbar-hide">
        {[
          { value: 'all', label: t('status.all'), count: statusCounts.all },
          { value: 'to_do', label: t('status.toDo'), count: statusCounts.to_do },
          { value: 'in_progress', label: t('status.inProgress'), count: statusCounts.in_progress },
          { value: 'completed', label: t('status.completed'), count: statusCounts.completed },
          { value: 'on_hold', label: t('status.onHold'), count: statusCounts.on_hold },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap touch-feedback shrink-0",
              statusFilter === tab.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {tab.label}
            <span className={cn(
              "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium",
              statusFilter === tab.value 
                ? "bg-primary-foreground/20 text-primary-foreground" 
                : "bg-muted text-muted-foreground"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('tasks.searchTasks')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
        <div className="flex gap-2">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('priority.all')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('priority.all')}</SelectItem>
              <SelectItem value="low">{t('priority.low')}</SelectItem>
              <SelectItem value="medium">{t('priority.medium')}</SelectItem>
              <SelectItem value="high">{t('priority.high')}</SelectItem>
              <SelectItem value="urgent">{t('priority.urgent')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('category.all')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('category.all')}</SelectItem>
              <SelectItem value="cleaning">{t('category.cleaning')}</SelectItem>
              <SelectItem value="kitchen">{t('category.kitchen')}</SelectItem>
              <SelectItem value="driving">{t('category.driving')}</SelectItem>
              <SelectItem value="shopping">{t('category.shopping')}</SelectItem>
              <SelectItem value="maintenance">{t('category.maintenance')}</SelectItem>
              <SelectItem value="other">{t('category.other')}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-lg border bg-secondary p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Select All (for bulk actions) */}
      {isParent && paginatedData.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={isAllSelected}
            onCheckedChange={toggleSelectAll}
            className="data-[state=indeterminate]:bg-primary"
            {...(isSomeSelected ? { 'data-state': 'indeterminate' } : {})}
          />
          <span>{t('common.selectAll')} ({paginatedData.length} {t('common.items')})</span>
        </div>
      )}

      {/* Tasks Grid/List */}
      {paginatedData.length > 0 ? (
        <>
          <div className={cn(
            viewMode === 'grid' 
              ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" 
              : "space-y-3"
          )}>
            {paginatedData.map((task, index) => (
              <div
                key={task.id}
                className={cn(
                  "animate-fade-in relative",
                  isParent && "group"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {isParent && (
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={isSelected(task.id)}
                      onCheckedChange={() => toggleSelection(task.id)}
                      className="bg-background"
                    />
                  </div>
                )}
                <TaskCard task={task} compact={viewMode === 'list'} />
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {t('common.showing')} {startIndex} - {endIndex} {t('common.of')} {totalItems}
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
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Search className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">{t('tasks.noTasksFound')}</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            {search || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all'
              ? t('tasks.adjustFilters')
              : t('tasks.createFirst')}
          </p>
          {isParent && (
            <Link to="/tasks/new">
              <Button variant="accent" size="lg" className="touch-feedback">
                <Plus className="h-4 w-4" />
                {t('tasks.createFirstTask')}
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {isParent && (
        <BulkActionsBar selectedCount={selectedCount} onClear={deselectAll}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBulkComplete}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {t('common.complete')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBulkDelete}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {t('common.delete')}
          </Button>
        </BulkActionsBar>
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