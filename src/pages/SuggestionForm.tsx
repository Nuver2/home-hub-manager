import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { useCreateSuggestion } from '@/hooks/useSuggestions';

export default function SuggestionForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createSuggestion = useCreateSuggestion();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  // Parents typically don't create suggestions - they review them
  // But allow all authenticated users to create suggestions
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    try {
      await createSuggestion.mutateAsync({
        title: formData.title,
        description: formData.description,
      });
      toast.success('Suggestion submitted successfully');
      navigate('/suggestions');
    } catch (error) {
      toast.error('Failed to submit suggestion');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/suggestions')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl lg:text-3xl font-bold">New Suggestion</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Share Your Idea</CardTitle>
                  <CardDescription>Submit a suggestion for improving the household</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Give your suggestion a clear title"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your suggestion in detail..."
                  rows={6}
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  variant="accent"
                  disabled={createSuggestion.isPending}
                >
                  {createSuggestion.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Submit Suggestion
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/suggestions')}>
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
