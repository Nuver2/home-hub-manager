import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ShoppingListCard } from '@/components/shopping/ShoppingListCard';
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
  ShoppingCart,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useShoppingLists, useUpdateShoppingList, useDeleteShoppingList } from '@/hooks/useShoppingLists';
import { usePagination } from '@/hooks/usePagination';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

export default function ShoppingLists() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: shoppingLists = [], isLoading } = useShoppingLists();
  const updateList = useUpdateShoppingList();
  const deleteList = useDeleteShoppingList();
  const isParent = user?.role === 'parent';
  const isChef = user?.role === 'chef';
  const isMobile = useIsMobile();
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const filteredLists = shoppingLists.filter(list => {
    const matchesSearch = list.title.toLowerCase().includes(search.toLowerCase()) ||
      list.notes?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || list.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || list.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
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
  } = usePagination({ data: filteredLists, itemsPerPage: 12 });

  // Bulk selection
  const {
    isSelected,
    toggleSelection,
    toggleSelectAll,
    deselectAll,
    isAllSelected,
    isSomeSelected,
    selectedCount,
    selectedIds,
  } = useBulkSelection({ items: paginatedData });

  const statusTabs = [
    { value: 'all', label: t('status.all') },
    { value: 'draft', label: t('status.draft') },
    { value: 'assigned', label: t('status.assigned') },
    { value: 'in_progress', label: t('status.inProgress') },
    { value: 'delivered', label: t('status.delivered') },
    { value: 'completed', label: t('status.completed') },
  ];

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['shopping-lists'] });
  }, [queryClient]);

  const handleBulkComplete = async () => {
    try {
      await Promise.all(
        Array.from(selectedIds).map(id =>
          updateList.mutateAsync({ id, status: 'completed' })
        )
      );
      toast.success(`${selectedCount} ${t('shoppingLists.markedCompleted')}`);
      deselectAll();
    } catch {
      toast.error(t('errors.failedUpdate'));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        Array.from(selectedIds).map(id => deleteList.mutateAsync(id))
      );
      toast.success(`${selectedCount} ${t('shoppingLists.deleted')}`);
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
              <Skeleton className="h-8 w-48 mb-2 skeleton-shimmer" />
              <Skeleton className="h-4 w-64 skeleton-shimmer" />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-10 w-24 rounded-lg skeleton-shimmer shrink-0" />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-56 rounded-xl skeleton-shimmer" />
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
          <h1 className="text-2xl lg:text-3xl font-bold">{t('shoppingLists.title')}</h1>
          <p className="text-muted-foreground mt-1">
            {isParent 
              ? t('shoppingLists.manageAll')
              : isChef 
                ? t('shoppingLists.createManage')
                : t('shoppingLists.viewAssigned')}
          </p>
        </div>
        {(isParent || isChef) && (
          <Link to="/shopping-lists/new">
            <Button variant="accent">
              <Plus className="h-4 w-4" />
              {t('shoppingLists.newList')}
            </Button>
          </Link>
        )}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 lg:mx-0 lg:px-0 scrollbar-hide">
        {statusTabs.map((tab) => {
          const count = tab.value === 'all' 
            ? shoppingLists.length 
            : shoppingLists.filter(l => l.status === tab.value).length;
          
          return (
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
              {count > 0 && (
                <span className={cn(
                  "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium",
                  statusFilter === tab.value 
                    ? "bg-primary-foreground/20 text-primary-foreground" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('shoppingLists.searchLists')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
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

      {/* Shopping Lists Grid */}
      {paginatedData.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {paginatedData.map((list) => (
              <div key={list.id} className={cn("relative", isParent && "group")}>
                {isParent && (
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={isSelected(list.id)}
                      onCheckedChange={() => toggleSelection(list.id)}
                      className="bg-background"
                    />
                  </div>
                )}
                <ShoppingListCard list={list} />
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
          <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">{t('shoppingLists.noListsFound')}</h3>
          <p className="text-muted-foreground mb-4">
            {search || statusFilter !== 'all' || priorityFilter !== 'all'
              ? t('shoppingLists.adjustFilters')
              : t('shoppingLists.createFirst')}
          </p>
          {(isParent || isChef) && (
            <Link to="/shopping-lists/new">
              <Button variant="accent">
                <Plus className="h-4 w-4" />
                {t('shoppingLists.createList')}
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