import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Calendar,
  User,
  Package,
  Edit,
  Trash2,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useShoppingList, useUpdateShoppingList, useUpdateShoppingListItem, useDeleteShoppingList } from '@/hooks/useShoppingLists';
import { ShoppingListStatus, ItemStatus } from '@/types/database';
import { cn } from '@/lib/utils';

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

const itemStatusIcons: Record<string, React.ReactNode> = {
  pending: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
  found: <Check className="h-4 w-4 text-success" />,
  not_found: <X className="h-4 w-4 text-destructive" />,
  alternative: <Package className="h-4 w-4 text-warning" />,
};

export default function ShoppingListDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: list, isLoading } = useShoppingList(id);
  const updateList = useUpdateShoppingList();
  const updateItem = useUpdateShoppingListItem();
  const deleteList = useDeleteShoppingList();
  
  const isParent = user?.role === 'parent';
  const isChef = user?.role === 'chef';
  const isDriver = user?.role === 'driver';
  const canUpdateItems = isDriver || isParent;
  const canUpdateStatus = isParent || isChef || isDriver;

  const handleStatusChange = async (status: ShoppingListStatus) => {
    if (!list) return;
    try {
      await updateList.mutateAsync({ id: list.id, status });
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleItemStatusChange = async (itemId: string, status: ItemStatus) => {
    try {
      await updateItem.mutateAsync({ id: itemId, status });
      toast.success('Item updated');
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const handleDelete = async () => {
    if (!list) return;
    if (!confirm('Are you sure you want to delete this shopping list?')) return;
    
    try {
      await deleteList.mutateAsync(list.id);
      toast.success('Shopping list deleted');
      navigate('/shopping-lists');
    } catch (error) {
      toast.error('Failed to delete shopping list');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!list) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <div className="rounded-xl border bg-card p-12 text-center">
            <h3 className="font-semibold text-lg mb-2">Shopping list not found</h3>
            <Link to="/shopping-lists">
              <Button variant="outline">Back to Shopping Lists</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const items = list.items || [];
  const itemsProgress = {
    total: items.length,
    found: items.filter(i => i.status === 'found' || i.status === 'alternative').length,
  };
  const progressPercent = itemsProgress.total > 0 ? (itemsProgress.found / itemsProgress.total) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/shopping-lists')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">{list.title}</h1>
              <div className="flex items-center gap-2">
                <Badge variant={priorityVariants[list.priority]}>
                  {list.priority}
                </Badge>
                <Badge className={cn(statusColors[list.status])}>
                  {statusLabels[list.status]}
                </Badge>
              </div>
            </div>
          </div>
          {isParent && (
            <div className="flex gap-2">
              <Link to={`/shopping-lists/${list.id}/edit`}>
                <Button variant="outline">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Items Found</span>
                  <span className="font-medium">{itemsProgress.found}/{itemsProgress.total}</span>
                </div>
                <Progress value={progressPercent} className="h-3" />
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>Items ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length > 0 ? (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        <div className="shrink-0">
                          {itemStatusIcons[item.status]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} {item.details && `• ${item.details}`}
                          </p>
                          {item.driver_comment && (
                            <p className="text-sm text-warning mt-1">
                              Note: {item.driver_comment}
                            </p>
                          )}
                        </div>
                        {canUpdateItems && (
                          <Select
                            value={item.status}
                            onValueChange={(value) => handleItemStatusChange(item.id, value as ItemStatus)}
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="found">Found</SelectItem>
                              <SelectItem value="not_found">Not Found</SelectItem>
                              <SelectItem value="alternative">Alternative</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No items in this list</p>
                )}
              </CardContent>
            </Card>

            {/* Status Update */}
            {canUpdateStatus && (
              <Card>
                <CardHeader>
                  <CardTitle>Update Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={list.status} 
                    onValueChange={(value) => handleStatusChange(value as ShoppingListStatus)}
                    disabled={updateList.isPending}
                  >
                    <SelectTrigger className="w-full sm:w-[250px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="waiting_confirmation">Waiting Confirmation</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="returned_for_fix">Returned for Fix</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {list.due_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium">{format(new Date(list.due_date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                )}
                {list.createdByProfile && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Created By</p>
                      <p className="font-medium">{list.createdByProfile.name}</p>
                    </div>
                  </div>
                )}
                {list.assignedToProfile && (
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Assigned To</p>
                      <p className="font-medium">{list.assignedToProfile.name}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {list.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{list.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
