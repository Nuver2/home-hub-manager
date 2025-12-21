import { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useShoppingList, useCreateShoppingList, useUpdateShoppingList } from '@/hooks/useShoppingLists';
import { useStaff } from '@/hooks/useStaff';
import { useProjects } from '@/hooks/useProjects';
import { useShoppingListTemplates } from '@/hooks/useShoppingListTemplates';
import { TaskPriority } from '@/types/database';
import { useTranslation } from 'react-i18next';

interface ItemInput {
  name: string;
  quantity: number;
  details: string;
}

export default function ShoppingListForm() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditing = !!id;
  
  const { data: existingList, isLoading: listLoading } = useShoppingList(id);
  const { data: staff = [] } = useStaff();
  const { data: projects = [] } = useProjects();
  const { data: templates = [] } = useShoppingListTemplates();
  const createList = useCreateShoppingList();
  const updateList = useUpdateShoppingList();

  const drivers = staff.filter(s => s.role === 'driver');

  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    priority: 'medium' as TaskPriority,
    due_date: '',
    project_id: '',
    assigned_to: '',
  });

  const [items, setItems] = useState<ItemInput[]>([
    { name: '', quantity: 1, details: '' },
  ]);

  useEffect(() => {
    if (existingList) {
      setFormData({
        title: existingList.title,
        notes: existingList.notes || '',
        priority: existingList.priority,
        due_date: existingList.due_date ? existingList.due_date.split('T')[0] : '',
        project_id: existingList.project_id || '',
        assigned_to: existingList.assigned_to || '',
      });
      if (existingList.items && existingList.items.length > 0) {
        setItems(existingList.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          details: item.details || '',
        })));
      }
    }
  }, [existingList]);

  // Only parents and chefs can access this page
  if (user?.role !== 'parent' && user?.role !== 'chef') {
    return <Navigate to="/dashboard" replace />;
  }

  const addItem = () => {
    setItems(prev => [...prev, { name: '', quantity: 1, details: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof ItemInput, value: string | number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const loadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setItems(template.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        details: item.details || '',
      })));
      if (template.description) {
        setFormData(prev => ({ ...prev, notes: template.description || prev.notes }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    const validItems = items.filter(item => item.name.trim());
    if (validItems.length === 0) {
      toast.error('At least one item is required');
      return;
    }

    try {
      if (isEditing && existingList) {
        await updateList.mutateAsync({
          id: existingList.id,
          title: formData.title,
          notes: formData.notes || undefined,
          priority: formData.priority,
          due_date: formData.due_date || undefined,
          project_id: formData.project_id || undefined,
          assigned_to: formData.assigned_to || undefined,
        });
        toast.success('Shopping list updated successfully');
      } else {
        await createList.mutateAsync({
          title: formData.title,
          notes: formData.notes || undefined,
          priority: formData.priority,
          due_date: formData.due_date || undefined,
          project_id: formData.project_id || undefined,
          assigned_to: formData.assigned_to || undefined,
          items: validItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            details: item.details || undefined,
          })),
        });
        toast.success('Shopping list created successfully');
      }
      navigate('/shopping-lists');
    } catch (error) {
      toast.error(isEditing ? 'Failed to update shopping list' : 'Failed to create shopping list');
    }
  };

  if (isEditing && listLoading) {
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
          <Button variant="ghost" size="icon" onClick={() => navigate('/shopping-lists')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl lg:text-3xl font-bold">
            {isEditing ? 'Edit Shopping List' : 'Create Shopping List'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          {!isEditing && templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('shoppingList.loadFromTemplate')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Select onValueChange={loadTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('shoppingList.selectTemplate')} />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name} ({template.items.length} items)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>List Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter list title"
                  required
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">{t('shoppingList.notes')}</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder={t('shoppingList.additionalNotes')}
                  rows={3}
                />
              </div>

              {/* Priority, Due Date */}
              <div className="grid sm:grid-cols-2 gap-4">
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
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
              </div>

              {/* Assign to Driver */}
              <div className="space-y-2">
                <Label>Assign to Driver</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value === 'none' ? '' : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('shoppingList.selectDriver')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not Assigned</SelectItem>
                    {drivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            </CardContent>
          </Card>

          {/* Items */}
          {!isEditing && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Items</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3 items-start">
                    <div className="flex-1 grid sm:grid-cols-3 gap-3">
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(index, 'name', e.target.value)}
                        placeholder="Item name"
                      />
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        placeholder="Qty"
                      />
                      <Input
                        value={item.details}
                        onChange={(e) => updateItem(index, 'details', e.target.value)}
                        placeholder="Details (optional)"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="submit"
              variant="accent"
              disabled={createList.isPending || updateList.isPending}
            >
              {(createList.isPending || updateList.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {isEditing ? 'Update List' : 'Create List'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/shopping-lists')}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
