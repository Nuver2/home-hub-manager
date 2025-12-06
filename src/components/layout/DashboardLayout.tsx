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
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-14 pb-24 lg:pt-0 lg:pb-6 lg:pl-72">
        <PageTransition className="min-h-screen">
          {children}
        </PageTransition>
      </main>
      <MobileBottomNav />
      <FloatingActionButton />
    </div>
  );
}
