import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { FloatingActionButton } from './FloatingActionButton';
import { PageTransition } from './PageTransition';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Sidebar />
      <main className="pt-16 pb-32 lg:pt-0 lg:pb-8 lg:pl-72">
        <PageTransition className="min-h-screen">
          {children}
        </PageTransition>
      </main>
      <MobileBottomNav />
      <FloatingActionButton />
    </div>
  );
}
