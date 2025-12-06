import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  User,
  Lock,
  Bell,
  Palette,
  LogOut,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

const roleLabels: Record<string, string> = {
  parent: 'Administrator',
  driver: 'Driver',
  chef: 'Chef',
  cleaner: 'Cleaner',
  other: 'Staff',
};

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleSaveProfile = () => {
    toast.success('Profile updated successfully');
  };

  const handleChangePassword = () => {
    toast.success('Password changed successfully');
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-2xl lg:text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </div>

        {/* Profile Section */}
        <Card className="animate-slide-up overflow-hidden" style={{ animationDelay: '50ms' }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Profile</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-secondary/50 to-secondary/30">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold shadow-lg">
                {user?.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-lg">{user?.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={user?.role as 'parent' | 'driver' | 'chef' | 'cleaner' | 'other'}>
                    {roleLabels[user?.role || '']}
                  </Badge>
                  <span className="text-sm text-muted-foreground">@{user?.username}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={user?.name} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" defaultValue={user?.phone_number || ''} className="h-11" />
              </div>
            </div>

            <Button onClick={handleSaveProfile} className="touch-feedback">Save Changes</Button>
          </CardContent>
        </Card>

        {/* Appearance Section */}
        <Card className="animate-slide-up overflow-hidden" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Palette className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the app looks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-base">Theme</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choose your preferred color scheme
              </p>
              <div className="grid grid-cols-3 gap-3">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = theme === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 touch-feedback",
                        isSelected
                          ? "border-accent bg-accent/5 shadow-sm"
                          : "border-border hover:border-accent/50 hover:bg-secondary/50"
                      )}
                    >
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                        isSelected ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={cn(
                        "text-sm font-medium",
                        isSelected && "text-accent"
                      )}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="animate-slide-up" style={{ animationDelay: '150ms' }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your password and security settings</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" className="h-11" />
              </div>
              <div></div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" className="h-11" />
              </div>
            </div>

            <Button onClick={handleChangePassword} className="touch-feedback">Change Password</Button>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {[
                { label: 'Task assignments', description: 'When a task is assigned to you' },
                { label: 'Task updates', description: 'When a task status changes' },
                { label: 'Shopping list updates', description: 'When a shopping list is updated' },
                { label: 'Comments', description: 'When someone comments on your tasks' },
              ].map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-4 rounded-xl hover:bg-secondary/50 transition-colors group"
                >
                  <div>
                    <p className="font-medium group-hover:text-accent transition-colors">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card className="animate-slide-up border-destructive/20" style={{ animationDelay: '250ms' }}>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium">Sign out of your account</p>
                <p className="text-sm text-muted-foreground">You will need to sign in again to access the app</p>
              </div>
              <Button variant="destructive" onClick={logout} className="touch-feedback shrink-0">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
