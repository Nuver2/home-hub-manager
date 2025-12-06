import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isParent = user?.role === 'parent';
  const isChef = user?.role === 'chef';

  if (!isParent && !isChef) return null;

  const actions: QuickAction[] = [];

  if (isParent) {
    actions.push(
      { label: 'New Task', href: '/tasks/new', icon: CheckSquare, color: 'bg-info text-info-foreground' },
      { label: 'New List', href: '/shopping-lists/new', icon: ShoppingCart, color: 'bg-accent text-accent-foreground' },
      { label: 'Add Staff', href: '/staff/new', icon: Users, color: 'bg-success text-success-foreground' },
      { label: 'New Project', href: '/projects/new', icon: FolderKanban, color: 'bg-warning text-warning-foreground' }
    );
  } else if (isChef) {
    actions.push(
      { label: 'New List', href: '/shopping-lists/new', icon: ShoppingCart, color: 'bg-accent text-accent-foreground' }
    );
  }

  return (
    <div className="fixed bottom-[5.5rem] right-4 z-[60] lg:hidden">
      {/* Action buttons */}
      <div className={cn(
        "absolute bottom-16 right-0 flex flex-col-reverse gap-3 transition-all duration-300",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              to={action.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3 pl-4 pr-5 py-3 rounded-full shadow-lg transition-all duration-200 touch-feedback",
                action.color,
                "animate-scale-in"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium whitespace-nowrap">{action.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Main FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300",
          "bg-accent text-accent-foreground hover:shadow-glow",
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
          className="fixed inset-0 bg-foreground/10 backdrop-blur-sm -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
