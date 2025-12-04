import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ShoppingListCard } from '@/components/shopping/ShoppingListCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useShoppingLists } from '@/hooks/useShoppingLists';

export default function ShoppingLists() {
  const { user } = useAuth();
  const { data: shoppingLists = [], isLoading } = useShoppingLists();
  const isParent = user?.role === 'parent';
  const isChef = user?.role === 'chef';
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredLists = shoppingLists.filter(list => {
    const matchesSearch = list.title.toLowerCase().includes(search.toLowerCase()) ||
      list.notes?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || list.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || list.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'completed', label: 'Completed' },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-56 rounded-xl" />
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
            <h1 className="text-2xl lg:text-3xl font-bold">Shopping Lists</h1>
            <p className="text-muted-foreground mt-1">
              {isParent 
                ? 'Manage all shopping lists' 
                : isChef 
                  ? 'Create and manage your shopping lists'
                  : 'View your assigned shopping lists'}
            </p>
          </div>
          {(isParent || isChef) && (
            <Link to="/shopping-lists/new">
              <Button variant="accent">
                <Plus className="h-4 w-4" />
                New List
              </Button>
            </Link>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {statusTabs.map((tab) => {
            const count = tab.value === 'all' 
              ? shoppingLists.length 
              : shoppingLists.filter(l => l.status === tab.value).length;
            
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  statusFilter === tab.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {tab.label}
                {count > 0 && (
                  <Badge variant={statusFilter === tab.value ? "secondary" : "outline"} className="ml-1">
                    {count}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shopping lists..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Shopping Lists Grid */}
        {filteredLists.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLists.map((list, index) => (
              <div
                key={list.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ShoppingListCard list={list} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <ShoppingCart className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No shopping lists found</h3>
            <p className="text-muted-foreground mb-4">
              {search || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first shopping list'}
            </p>
            {(isParent || isChef) && (
              <Link to="/shopping-lists/new">
                <Button variant="accent">
                  <Plus className="h-4 w-4" />
                  Create Shopping List
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
