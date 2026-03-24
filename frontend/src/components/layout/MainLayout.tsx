import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { usePageTitle } from '@/hooks/usePageTitle';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  usePageTitle();

  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset>
        {/* Mobile-only top bar */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-gray-200/60 bg-white/80 backdrop-blur px-5 sticky top-0 z-10 md:hidden">
          <SidebarTrigger className="-ml-1 text-gray-500 hover:text-gray-900" />
          <Separator orientation="vertical" className="mr-2 h-4 bg-gray-200" />
          <span style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }} className="font-bold text-sm tracking-tight text-gray-900">Slate</span>
        </header>
        <div className="flex-1 p-7 lg:p-10">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
