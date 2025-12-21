import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import {
  User,
  Lock,
  Bell,
  Palette,
  LogOut,
  Sun,
  Moon,
  Monitor,
  Languages,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useUpdateProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export default function Settings() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { isSupported, isSubscribed, isLoading, subscribe, unsubscribe } = usePushNotifications();
  const updateProfile = useUpdateProfile();

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone_number: user?.phone_number || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sync profile data with user
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone_number: user.phone_number || '',
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    if (!profileData.name.trim()) {
      toast.error(t('settings.nameRequired') || 'Name is required');
      return;
    }

    setIsSavingProfile(true);
    try {
      await updateProfile.mutateAsync({
        id: user.id,
        name: profileData.name.trim(),
        phone_number: profileData.phone_number.trim() || null,
      });
      toast.success(t('success.profileUpdated'));
    } catch (error: any) {
      toast.error(error.message || t('errors.failedUpdate'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error(t('settings.allFieldsRequired') || 'All fields are required');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error(t('settings.passwordMinLength') || 'Password must be at least 8 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('settings.passwordsDontMatch') || 'Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast.success(t('success.passwordChanged'));
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      toast.error(error.message || t('errors.failedUpdate'));
    } finally {
      setIsChangingPassword(false);
    }
  };

  const themeOptions = [
    { value: 'light', label: t('settings.light'), icon: Sun },
    { value: 'dark', label: t('settings.dark'), icon: Moon },
    { value: 'system', label: t('settings.system'), icon: Monitor },
  ] as const;

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
        {/* Header */}
        <div className="animate-slide-up">
          <h1 className="text-2xl lg:text-3xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('settings.manageAccount')}</p>
        </div>

        {/* Profile Section */}
        <Card className="animate-slide-up overflow-hidden" style={{ animationDelay: '50ms' }}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{t('settings.profile')}</CardTitle>
                <CardDescription>{t('settings.updateInfo')}</CardDescription>
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
                    {t(`roles.${user?.role}`)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">@{user?.username}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t('settings.fullName')}</Label>
                <Input 
                  id="name" 
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="h-11" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t('settings.phoneNumber')}</Label>
                <Input 
                  id="phone" 
                  value={profileData.phone_number}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="h-11" 
                />
              </div>
            </div>

            <Button 
              onClick={handleSaveProfile} 
              disabled={isSavingProfile}
              className="touch-feedback"
            >
              {isSavingProfile && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('settings.saveChanges')}
            </Button>
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
                <CardTitle>{t('settings.appearance')}</CardTitle>
                <CardDescription>{t('settings.customize')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base">{t('settings.theme')}</Label>
              <p className="text-sm text-muted-foreground mb-3">{t('settings.chooseTheme')}</p>
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
                      <span className={cn("text-sm font-medium", isSelected && "text-accent")}>
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-base">{t('settings.language')}</Label>
              <p className="text-sm text-muted-foreground mb-3">{t('settings.chooseLanguage')}</p>
              <LanguageSwitcher />
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
                <CardTitle>{t('settings.security')}</CardTitle>
                <CardDescription>{t('settings.managePassword')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current-password">{t('settings.currentPassword')}</Label>
                <Input 
                  id="current-password" 
                  type="password" 
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="h-11" 
                />
              </div>
              <div></div>
              <div className="space-y-2">
                <Label htmlFor="new-password">{t('settings.newPassword')}</Label>
                <Input 
                  id="new-password" 
                  type="password" 
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  className="h-11" 
                />
                <p className="text-xs text-muted-foreground">Minimum 8 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('settings.confirmPassword')}</Label>
                <Input 
                  id="confirm-password" 
                  type="password" 
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="h-11" 
                />
              </div>
            </div>

            <Button 
              onClick={handleChangePassword} 
              disabled={isChangingPassword}
              className="touch-feedback"
            >
              {isChangingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('settings.changePassword')}
            </Button>
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
                <CardTitle>{t('settings.notificationSettings')}</CardTitle>
                <CardDescription>{t('settings.configureNotifications')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Push Notifications Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border bg-card">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">Push Notifications</p>
                  {!isSupported && (
                    <Badge variant="outline" className="text-xs">Not Supported</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isSupported 
                    ? 'Receive browser push notifications even when the app is closed'
                    : 'Your browser does not support push notifications'}
                </p>
              </div>
              {isSupported && (
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={async (checked) => {
                    if (checked) {
                      await subscribe();
                    } else {
                      await unsubscribe();
                    }
                  }}
                  disabled={isLoading}
                />
              )}
            </div>

            {/* Notification Preferences */}
            <div>
              <Label className="text-base mb-3 block">Notification Preferences</Label>
              <div className="space-y-1">
                {[
                  { label: t('settings.taskAssignments'), description: t('settings.whenTaskAssigned') },
                  { label: t('settings.taskUpdates'), description: t('settings.whenTaskChanges') },
                  { label: t('settings.shoppingUpdates'), description: t('settings.whenListUpdated') },
                  { label: t('settings.comments'), description: t('settings.whenCommented') },
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
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card className="animate-slide-up border-destructive/20" style={{ animationDelay: '250ms' }}>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium">{t('settings.signOutAccount')}</p>
                <p className="text-sm text-muted-foreground">{t('settings.needSignIn')}</p>
              </div>
              <Button variant="destructive" onClick={logout} className="touch-feedback shrink-0">
                <LogOut className="h-4 w-4" />
                {t('nav.signOut')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
