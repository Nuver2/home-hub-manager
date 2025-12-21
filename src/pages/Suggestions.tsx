import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  Lightbulb,
  Check,
  X,
  Clock,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useSuggestions, useUpdateSuggestion } from '@/hooks/useSuggestions';

const statusVariants: Record<string, 'warning' | 'success' | 'destructive'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
};

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  approved: Check,
  rejected: X,
};

export default function Suggestions() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: suggestions = [], isLoading } = useSuggestions();
  const updateSuggestion = useUpdateSuggestion();
  const isParent = user?.role === 'parent';
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredSuggestions = suggestions.filter(suggestion => {
    const matchesSearch = suggestion.title.toLowerCase().includes(search.toLowerCase()) ||
      suggestion.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || suggestion.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (id: string) => {
    try {
      await updateSuggestion.mutateAsync({ id, status: 'approved' });
      toast.success(t('suggestions.approved'));
    } catch (error) {
      toast.error(t('errors.failedApprove'));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateSuggestion.mutateAsync({ id, status: 'rejected' });
      toast.success(t('suggestions.rejected'));
    } catch (error) {
      toast.error(t('errors.failedReject'));
    }
  };

  const statusTabs = [
    { value: 'all', label: t('status.all') },
    { value: 'pending', label: t('status.pending') },
    { value: 'approved', label: t('status.approved') },
    { value: 'rejected', label: t('status.rejected') },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Skeleton className="h-8 w-40 mb-2 skeleton-shimmer" />
              <Skeleton className="h-4 w-64 skeleton-shimmer" />
            </div>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-10 w-24 rounded-lg skeleton-shimmer" />
            ))}
          </div>
          <div className="space-y-4 stagger-children">
            {[1, 2, 3].map(i => (
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
            <h1 className="text-2xl lg:text-3xl font-bold">{t('suggestions.title')}</h1>
            <p className="text-muted-foreground mt-1">
              {isParent ? t('suggestions.reviewManage') : t('suggestions.submitIdeas')}
            </p>
          </div>
          {!isParent && (
            <Link to="/suggestions/new">
              <Button variant="accent">
                <Plus className="h-4 w-4" />
                {t('suggestions.newSuggestion')}
              </Button>
            </Link>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-6 px-6 lg:mx-0 lg:px-0 scrollbar-hide">
          {statusTabs.map((tab) => {
            const count = tab.value === 'all' 
              ? suggestions.length 
              : suggestions.filter(s => s.status === tab.value).length;
            
            return (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 whitespace-nowrap touch-feedback shrink-0",
                  statusFilter === tab.value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium",
                    statusFilter === tab.value 
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

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('suggestions.searchSuggestions')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11"
          />
        </div>

        {/* Suggestions List */}
        {filteredSuggestions.length > 0 ? (
          <div className="space-y-4">
            {filteredSuggestions.map((suggestion, index) => {
              const StatusIcon = statusIcons[suggestion.status];
              
              return (
                <Card
                  key={suggestion.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning shrink-0">
                          <Lightbulb className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                            <Badge variant={statusVariants[suggestion.status]}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {t(`status.${suggestion.status}`)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {suggestion.createdByProfile?.name || 'Unknown'} • {format(new Date(suggestion.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{suggestion.description}</p>
                    
                    {isParent && suggestion.status === 'pending' && (
                      <div className="flex gap-2 pt-4 border-t border-border">
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleApprove(suggestion.id)}
                          disabled={updateSuggestion.isPending}
                        >
                          <Check className="h-4 w-4" />
                          {t('common.approve')}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleReject(suggestion.id)}
                          disabled={updateSuggestion.isPending}
                        >
                          <X className="h-4 w-4" />
                          {t('common.reject')}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border bg-card p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Lightbulb className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">{t('suggestions.noSuggestionsFound')}</h3>
            <p className="text-muted-foreground mb-4">
              {search || statusFilter !== 'all'
                ? t('suggestions.adjustFilters')
                : isParent 
                  ? t('suggestions.noSubmitted')
                  : t('suggestions.shareIdeas')}
            </p>
            {!isParent && (
              <Link to="/suggestions/new">
                <Button variant="accent">
                  <Plus className="h-4 w-4" />
                  {t('suggestions.createSuggestion')}
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}