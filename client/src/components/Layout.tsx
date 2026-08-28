import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="pl-64">
        <div className="py-8 px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
