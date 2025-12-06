import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-16 pb-20 lg:pt-0 lg:pb-0 lg:pl-72">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
