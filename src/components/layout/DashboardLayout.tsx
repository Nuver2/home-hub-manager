import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-16 lg:pt-0 lg:pl-72">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
