import { StaffMember, useDeleteStaff } from '@/hooks/useStaff';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Phone,
  MoreHorizontal,
  Calendar,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';

interface StaffCardProps {
  user: StaffMember;
  onEdit?: () => void;
  onDelete?: () => void;
}

const roleLabels: Record<string, string> = {
  parent: 'Administrator',
  driver: 'Driver',
  chef: 'Chef',
  cleaner: 'Cleaner',
  other: 'Staff',
};

const roleVariants: Record<string, 'parent' | 'driver' | 'chef' | 'cleaner' | 'other'> = {
  parent: 'parent',
  driver: 'driver',
  chef: 'chef',
  cleaner: 'cleaner',
  other: 'other',
};

export function StaffCard({ user, onEdit, onDelete }: StaffCardProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const deleteStaff = useDeleteStaff();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteStaff.mutateAsync(user.id);
      toast({
        title: t('staff.deleteSuccess'),
        description: t('staff.deleteSuccessDescription', { name: user.name }),
      });
      onDelete?.();
    } catch (error: any) {
      toast({
        title: t('staff.deleteError'),
        description: error.message || t('staff.deleteErrorDescription'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-5 transition-all duration-200 hover:shadow-medium animate-fade-in">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold shrink-0">
          {user.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg truncate">{user.name}</h3>
            <Badge 
              variant={user.status === 'active' ? 'success' : 'secondary'}
              className="shrink-0"
            >
              {user.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={roleVariants[user.role]}>
              {roleLabels[user.role]}
            </Badge>
            <span className="text-sm text-muted-foreground">@{user.username}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('staff.deleteConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('staff.deleteConfirmDescription', { name: user.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  {t('common.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? t('common.deleting') : t('common.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-border text-sm">
        {user.phone_number && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{user.phone_number}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Joined {format(new Date(user.created_at), 'MMM d, yyyy')}</span>
        </div>
      </div>
    </div>
  );
}
