import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AppRole } from '@/types/database';

export default function StaffForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: '',
    role: 'other' as AppRole,
    phone_number: '',
  });

  // Only parents can access this page
  if (user?.role !== 'parent') {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password.trim() || !formData.name.trim() || !formData.username.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate password to match edge function requirements
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    if (!/[A-Z]/.test(formData.password)) {
      toast.error('Password must contain at least one uppercase letter');
      return;
    }
    
    if (!/[a-z]/.test(formData.password)) {
      toast.error('Password must contain at least one lowercase letter');
      return;
    }
    
    if (!/[0-9]/.test(formData.password)) {
      toast.error('Password must contain at least one number');
      return;
    }

    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const response = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          username: formData.username,
          role: formData.role,
          phone_number: formData.phone_number || null,
        },
      });

      // Check if response.data contains an error (edge function returned error in body)
      if (response.data && typeof response.data === 'object' && 'error' in response.data) {
        const errorMsg = response.data.error as string;
        throw new Error(errorMsg);
      }

      if (response.error) {
        // Check if it's a 404 (function not deployed)
        if (response.error.message?.includes('404') || response.error.message?.includes('not found')) {
          throw new Error('Edge Function not deployed. Please deploy the "create-user" function to Supabase. See DEPLOY_EDGE_FUNCTION.md for instructions.');
        }
        // Try to extract error message from response
        const errorMsg = response.error.message || response.error.context?.msg || 'Unknown error';
        throw new Error(errorMsg);
      }

      // Check if response itself indicates an error
      if (!response.data || (typeof response.data === 'object' && !('success' in response.data))) {
        console.error('Unexpected response format:', response);
        throw new Error('Unexpected response from server');
      }

      toast.success('Staff member added successfully');
      navigate('/staff');
    } catch (error: any) {
      console.error('Error creating staff:', error);
      const errorMessage = error.message || 'Failed to create staff member';
      toast.error(errorMessage, {
        duration: errorMessage.includes('not deployed') ? 10000 : 5000, // Longer duration for deployment errors
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/staff')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">Add Staff Member</h1>
            <p className="text-muted-foreground">Create a new account for a staff member</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Staff Information</CardTitle>
                  <CardDescription>Enter the details for the new staff member</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name & Username */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                    placeholder="john.doe"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="john@example.com"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Minimum 8 characters with uppercase, lowercase, and number"
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              {/* Role & Phone */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as AppRole }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="chef">Chef</SelectItem>
                      <SelectItem value="cleaner">Cleaner</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    placeholder="+1 555-0100"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  variant="accent"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add Staff Member
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/staff')}>
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
