import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadNotificationsCount } from '@/hooks/useNotifications';
import {
  LayoutDashboard,
  CheckSquare,
  ShoppingCart,
  Bell,
  Menu,
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
    { label: 'Alerts', href: '/notifications', icon: Bell, badge: unreadCount },
    { label: 'More', href: '/settings', icon: Menu },
  ];

  const filteredItems = navItems.filter(item => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  });

  // Limit to 5 items for bottom nav
  const displayItems = filteredItems.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Gradient fade effect */}
      <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      
      {/* Nav bar */}
      <div className="bg-card/95 backdrop-blur-xl border-t border-border px-2 pb-safe">
        <div className="flex items-center justify-around py-2">
          {displayItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[4rem]",
                  isActive
                    ? "text-accent"
                    : "text-muted-foreground active:scale-95"
                )}
              >
                <div className={cn(
                  "relative p-1.5 rounded-xl transition-all duration-200",
                  isActive && "bg-accent/10"
                )}>
                  <Icon className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )} />
                  
                  {/* Badge */}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse-subtle">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                
                <span className={cn(
                  "text-[10px] font-medium transition-colors",
                  isActive ? "text-accent" : "text-muted-foreground"
                )}>
                  {item.label}
                </span>
                
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-accent" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
