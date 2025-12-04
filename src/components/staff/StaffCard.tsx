import { User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Phone,
  Mail,
  MoreHorizontal,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';

interface StaffCardProps {
  user: User;
  onEdit?: () => void;
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

export function StaffCard({ user, onEdit }: StaffCardProps) {
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
        {onEdit && (
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-border text-sm">
        {user.phoneNumber && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{user.phoneNumber}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
        </div>
      </div>
    </div>
  );
}
