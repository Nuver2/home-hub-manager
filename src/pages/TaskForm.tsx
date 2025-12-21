import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTask, useCreateTask, useUpdateTask } from '@/hooks/useTasks';
import { useStaff } from '@/hooks/useStaff';
import { useProjects } from '@/hooks/useProjects';
import { TaskPriority, TaskStatus, TaskCategory } from '@/types/database';
import { FileUpload } from '@/components/FileUpload';

export default function TaskForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;
  
  const { data: existingTask, isLoading: taskLoading } = useTask(id);
  const { data: staff = [] } = useStaff();
  const { data: projects = [] } = useProjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'to_do' as TaskStatus,
    category: 'other' as TaskCategory,
    due_date: '',
    location: '',
    project_id: '',
    assigned_user_ids: [] as string[],
    attachments: [] as string[],
    is_recurring: false,
    recurrence_pattern: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurrence_interval: 1,
    recurrence_end_date: '',
  });

  useEffect(() => {
    if (existingTask) {
      setFormData({
        title: existingTask.title,
        description: existingTask.description || '',
        priority: existingTask.priority,
        status: existingTask.status,
        category: existingTask.category,
        due_date: existingTask.due_date ? existingTask.due_date.split('T')[0] : '',
        location: existingTask.location || '',
        project_id: existingTask.project_id || '',
        assigned_user_ids: existingTask.assignedUsers?.map(u => u.id) || [],
        attachments: existingTask.attachments || [],
        is_recurring: (existingTask as any).is_recurring || false,
        recurrence_pattern: (existingTask as any).recurrence_pattern || 'weekly',
        recurrence_interval: (existingTask as any).recurrence_interval || 1,
        recurrence_end_date: (existingTask as any).recurrence_end_date ? new Date((existingTask as any).recurrence_end_date).toISOString().split('T')[0] : '',
      });
    }
  }, [existingTask]);

  // Only parents can access this page
  if (user?.role !== 'parent') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    try {
      const taskData = {
        title: formData.title,
        description: formData.description || undefined,
        priority: formData.priority,
        status: formData.status,
        category: formData.category,
        due_date: formData.due_date || undefined,
        location: formData.location || undefined,
        project_id: formData.project_id || undefined,
        assigned_user_ids: formData.assigned_user_ids,
        attachments: formData.attachments.length > 0 ? formData.attachments : undefined,
        is_recurring: formData.is_recurring,
        recurrence_pattern: formData.is_recurring ? formData.recurrence_pattern : undefined,
        recurrence_interval: formData.is_recurring ? formData.recurrence_interval : undefined,
        recurrence_end_date: formData.is_recurring && formData.recurrence_end_date ? formData.recurrence_end_date : undefined,
      };

      if (isEditing && existingTask) {
        await updateTask.mutateAsync({ id: existingTask.id, ...taskData });
        toast.success('Task updated successfully');
      } else {
        await createTask.mutateAsync(taskData);
        toast.success('Task created successfully');
      }
      navigate('/tasks');
    } catch (error) {
      toast.error(isEditing ? 'Failed to update task' : 'Failed to create task');
    }
  };

  const toggleAssignee = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_user_ids: prev.assigned_user_ids.includes(userId)
        ? prev.assigned_user_ids.filter(id => id !== userId)
        : [...prev.assigned_user_ids, userId],
    }));
  };

  if (isEditing && taskLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/tasks')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl lg:text-3xl font-bold">
            {isEditing ? 'Edit Task' : 'Create Task'}
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                  rows={4}
                />
              </div>

              {/* Priority, Status, Category */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as TaskPriority }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as TaskStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="to_do">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as TaskCategory }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cleaning">Cleaning</SelectItem>
                      <SelectItem value="kitchen">Kitchen</SelectItem>
                      <SelectItem value="driving">Driving</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Due Date, Location */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Enter location"
                  />
                </div>
              </div>

              {/* Project */}
              <div className="space-y-2">
                <Label>Project (Optional)</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, project_id: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assign Staff */}
              <div className="space-y-2">
                <Label>Assign Staff</Label>
                <div className="grid sm:grid-cols-2 gap-2 p-4 border rounded-lg">
                  {staff.length > 0 ? (
                    staff.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`staff-${member.id}`}
                          checked={formData.assigned_user_ids.includes(member.id)}
                          onCheckedChange={() => toggleAssignee(member.id)}
                        />
                        <label
                          htmlFor={`staff-${member.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {member.name} ({member.role})
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground col-span-2">No staff members available</p>
                  )}
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <Label>Attachments</Label>
                <FileUpload
                  bucket="attachments"
                  folder="tasks"
                  existingFiles={formData.attachments}
                  onUploadComplete={(url) => {
                    setFormData(prev => ({
                      ...prev,
                      attachments: [...prev.attachments, url],
                    }));
                  }}
                  onRemove={(url) => {
                    setFormData(prev => ({
                      ...prev,
                      attachments: prev.attachments.filter(a => a !== url),
                    }));
                  }}
                  maxFiles={5}
                  maxSizeMB={10}
                />
              </div>

              {/* Recurring Task */}
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Recurring Task</Label>
                    <p className="text-sm text-muted-foreground">Create this task on a schedule</p>
                  </div>
                  <Switch
                    checked={formData.is_recurring}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_recurring: checked }))}
                  />
                </div>
                {formData.is_recurring && (
                  <div className="space-y-4 pt-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Repeat Every</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={formData.recurrence_interval}
                            onChange={(e) => setFormData(prev => ({ ...prev, recurrence_interval: parseInt(e.target.value) || 1 }))}
                            className="w-20"
                          />
                          <Select
                            value={formData.recurrence_pattern}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, recurrence_pattern: value as any }))}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">Day(s)</SelectItem>
                              <SelectItem value="weekly">Week(s)</SelectItem>
                              <SelectItem value="monthly">Month(s)</SelectItem>
                              <SelectItem value="yearly">Year(s)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>End Date (Optional)</Label>
                        <Input
                          type="date"
                          value={formData.recurrence_end_date}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurrence_end_date: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  variant="accent"
                  disabled={createTask.isPending || updateTask.isPending}
                >
                  {(createTask.isPending || updateTask.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? 'Update Task' : 'Create Task'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/tasks')}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
