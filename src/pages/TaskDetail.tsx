import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  MapPin,
  Users,
  Edit,
  Trash2,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { TaskStatus } from '@/types/database';
import { Comments } from '@/components/Comments';
import { useTranslation } from 'react-i18next';

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

export default function TaskDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: task, isLoading } = useTask(id);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  
  const isParent = user?.role === 'parent';

  const handleStatusChange = async (status: TaskStatus) => {
    if (!task) return;
    try {
      await updateTask.mutateAsync({ id: task.id, status });
      toast.success('Task status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success('Task deleted');
      navigate('/tasks');
    } catch (error) {
      toast.error('Failed to delete task');
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

  if (!task) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8">
          <div className="rounded-xl border bg-card p-12 text-center">
            <h3 className="font-semibold text-lg mb-2">Task not found</h3>
            <Link to="/tasks">
              <Button variant="outline">Back to Tasks</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/tasks')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{categoryIcons[task.category]}</span>
                <h1 className="text-2xl lg:text-3xl font-bold">{task.title}</h1>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={priorityVariants[task.priority]}>
                  {task.priority}
                </Badge>
                <Badge variant={statusVariants[task.status]}>
                  {statusLabels[task.status]}
                </Badge>
              </div>
            </div>
          </div>
          {isParent && (
            <div className="flex gap-2">
              <Link to={`/tasks/${task.id}/edit`}>
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
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  {task.description || 'No description provided.'}
                </p>
                {task.attachments && task.attachments.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-2">{t('attachments.title')} ({task.attachments.length})</p>
                    <div className="space-y-2">
                      {task.attachments.map((url, index) => {
                        const fileName = url.split('/').pop() || `${t('attachments.attachment')} ${index + 1}`;
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                        
                        return (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg border hover:bg-secondary transition-colors"
                          >
                            {isImage ? (
                              <img src={url} alt={fileName} className="h-12 w-12 object-cover rounded" />
                            ) : (
                              <div className="h-12 w-12 flex items-center justify-center bg-secondary rounded text-2xl">
                                📎
                              </div>
                            )}
                            <span className="text-sm font-medium truncate flex-1">{fileName}</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Update */}
            <Card>
              <CardHeader>
                <CardTitle>Update Status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select 
                  value={task.status} 
                  onValueChange={(value) => handleStatusChange(value as TaskStatus)}
                  disabled={updateTask.isPending}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to_do">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Comments */}
            <Comments taskId={task.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {task.due_date && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Due Date</p>
                      <p className="font-medium">{format(new Date(task.due_date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                )}
                {task.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{task.location}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium">{format(new Date(task.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assigned Users */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assigned To
                </CardTitle>
              </CardHeader>
              <CardContent>
                {task.assignedUsers && task.assignedUsers.length > 0 ? (
                  <div className="space-y-2">
                    {task.assignedUsers.map((assignee) => (
                      <div key={assignee.id} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {assignee.name.charAt(0)}
                        </div>
                        <span className="font-medium">{assignee.name}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No one assigned yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
