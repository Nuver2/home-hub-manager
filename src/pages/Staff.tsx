import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StaffCard } from '@/components/staff/StaffCard';
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
  Users,
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useStaff } from '@/hooks/useStaff';

export default function Staff() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: staffMembers = [], isLoading } = useStaff();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Only parents can access this page
  if (user?.role !== 'parent') {
    return <Navigate to="/dashboard" replace />;
  }

  const filteredStaff = staffMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.username.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const roleTabs = [
    { value: 'all', label: t('staff.allStaff') },
    { value: 'driver', label: t('staff.drivers') },
    { value: 'chef', label: t('staff.chefs') },
    { value: 'cleaner', label: t('staff.cleaners') },
    { value: 'other', label: t('staff.other') },
  ];

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
              <Skeleton key={i} className="h-40 rounded-xl skeleton-shimmer" />
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
            <h1 className="text-2xl lg:text-3xl font-bold">{t('staff.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('staff.manage')}
            </p>
          </div>
          <Link to="/staff/new">
            <Button variant="accent">
              <Plus className="h-4 w-4" />
              {t('staff.addStaff')}
            </Button>
          </Link>
        </div>

        {/* Role Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 lg:mx-0 lg:px-0 scrollbar-hide">
          {roleTabs.map((tab) => {
            const count = tab.value === 'all' 
              ? staffMembers.length 
              : staffMembers.filter(m => m.role === tab.value).length;
            
            return (
              <button
                key={tab.value}
                onClick={() => setRoleFilter(tab.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap touch-feedback shrink-0",
                  roleFilter === tab.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium",
                    roleFilter === tab.value 
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
              placeholder={t('staff.searchStaff')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('status.all')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('status.all')}</SelectItem>
              <SelectItem value="active">{t('status.active')}</SelectItem>
              <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Staff Grid */}
        {filteredStaff.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
            {filteredStaff.map((member) => (
              <div key={member.id}>
                <StaffCard user={member} />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-12 text-center animate-fade-in">
            <div className="mx-auto w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Users className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{t('staff.noStaffFound')}</h3>
            <p className="text-muted-foreground mb-4">
              {search || roleFilter !== 'all' || statusFilter !== 'all'
                ? t('staff.adjustFilters')
                : t('staff.addFirst')}
            </p>
            <Link to="/staff/new">
              <Button variant="accent">
                <Plus className="h-4 w-4" />
                {t('staff.addMember')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}