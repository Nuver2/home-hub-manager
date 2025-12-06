import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { FloatingActionButton } from './FloatingActionButton';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Sidebar />
      <main className="pt-16 pb-20 lg:pt-0 lg:pb-0 lg:pl-72">
        <div className="min-h-screen animate-fade-in">
          {children}
        </div>
      </main>
      <MobileBottomNav />
      <FloatingActionButton />
    </div>
  );
}
