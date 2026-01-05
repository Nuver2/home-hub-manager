import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import {
  Plus,
  X,
  CheckSquare,
  ShoppingCart,
  Users,
  FolderKanban,
} from 'lucide-react';

interface QuickAction {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export function FloatingActionButton() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isParent = user?.role === 'parent';
  const isChef = user?.role === 'chef';

  if (!isParent && !isChef) return null;

  const actions: QuickAction[] = [];

  if (isParent) {
    actions.push(
      { label: t('mobile.newTask'), href: '/tasks/new', icon: CheckSquare, color: 'bg-info text-info-foreground' },
      { label: t('mobile.newList'), href: '/shopping-lists/new', icon: ShoppingCart, color: 'bg-accent text-accent-foreground' },
      { label: t('mobile.addStaff'), href: '/staff/new', icon: Users, color: 'bg-success text-success-foreground' },
      { label: t('mobile.newProject'), href: '/projects/new', icon: FolderKanban, color: 'bg-warning text-warning-foreground' }
    );
  } else if (isChef) {
    actions.push(
      { label: t('mobile.newList'), href: '/shopping-lists/new', icon: ShoppingCart, color: 'bg-accent text-accent-foreground' }
    );
  }

  return (
    <div className="fixed bottom-[6.5rem] right-4 z-[35] lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
      {/* Action buttons */}
      <div className={cn(
        "absolute bottom-16 right-0 flex flex-col-reverse gap-2 transition-all duration-150",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      )}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              to={action.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full shadow-lg",
                action.color
              )}
              style={{ 
                transform: isOpen ? 'scale(1)' : 'scale(0.8)',
                transitionDelay: isOpen ? `${index * 30}ms` : '0ms',
                transitionDuration: '100ms'
              }}
            >
              <Icon className="h-4 w-4" />
              <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-150",
          "bg-primary text-primary-foreground active:scale-95",
          isOpen && "rotate-45 bg-muted text-muted-foreground"
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Plus className="h-6 w-6" />
        )}
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/60 z-[30]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
