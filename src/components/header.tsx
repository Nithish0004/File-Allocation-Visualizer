'use client';

import { Cpu } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Skeleton } from './ui/skeleton';

const ThemeToggle = dynamic(() => import('./theme-toggle').then(mod => mod.ThemeToggle), {
    ssr: false,
    loading: () => <Skeleton className="h-10 w-10 rounded-md" />,
});

export function Header() {
  return (
    <header className="px-4 lg:px-6 h-20 flex items-center border-b shrink-0 relative">
      <div className="absolute left-6 top-1/2 -translate-y-1/2">
        <Link href="/" className="flex items-center gap-2 group" prefetch={false}>
          <Cpu className="h-8 w-8 text-primary transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
        </Link>
      </div>
      <div className="flex-1 flex justify-center">
        <h1 className="text-3xl font-bold tracking-tight animated-gradient-text">
            File System Visualizer
        </h1>
      </div>
      <div className="absolute right-6 top-1/2 -translate-y-1/2">
        <ThemeToggle />
      </div>
    </header>
  );
}
