import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import {
  LayoutDashboard,
  CheckSquare,
  ShoppingCart,
  BellRing,
  Settings,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  badge?: number;
}

export function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  const navItems: NavItem[] = [
    { label: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Tasks', href: '/tasks', icon: CheckSquare },
    { label: 'Shopping', href: '/shopping-lists', icon: ShoppingCart, roles: ['parent', 'driver', 'chef'] },
    { label: 'Alerts', href: '/notifications', icon: BellRing, badge: unreadCount },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const filteredItems = navItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  const displayItems = filteredItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Gradient fade effect */}
      <div className="absolute inset-x-0 -top-4 h-4 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      {/* Nav bar */}
      <div className="bg-card/98 backdrop-blur-lg border-t border-border/50 px-1 pb-safe shadow-lg">
        <div className="flex items-center justify-around">
          {displayItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[60px] transition-colors duration-100",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                <div className="relative p-1">
                  <Icon className={cn(
                    "h-5 w-5",
                    isActive && "text-primary"
                  )} />
                  
                  {/* Badge */}
                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                
                <span className={cn(
                  "text-[10px] font-medium",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
