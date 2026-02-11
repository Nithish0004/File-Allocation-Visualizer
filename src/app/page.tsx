
'use client';

import { CheckCircle2, XCircle, FileText, Link as LinkIcon, ListTree, ArrowRight, Cpu } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { AnimatedBackground } from '@/components/animated-background';


interface AllocationCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    pros: string[];
    cons: string[];
    delay: number;
}

function AllocationCard({ icon, title, description, pros, cons, delay }: AllocationCardProps) {
    return (
        <Card className="flex flex-col bg-card/80 backdrop-blur-sm border-border/50 text-center p-8 rounded-2xl opacity-0 animate-fade-in-up transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20" style={{ animationDelay: `${delay}ms`}}>
            <div className="mx-auto flex-shrink-0 mb-6 inline-block">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                       {icon}
                    </div>
                </div>
            </div>

            <h3 className="text-2xl font-bold mb-3">{title}</h3>
            <p className="text-muted-foreground mb-6">{description}</p>
            
            <div className="inline-block text-left mx-auto">
                <h4 className="font-semibold mb-3 text-foreground/90 text-center">Pros:</h4>
                <ul className="space-y-2">
                    {pros.map(pro => (
                        <li key={pro} className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-1" />
                            <span>{pro}</span>
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="mt-6 inline-block text-left mx-auto">
                <h4 className="font-semibold mb-3 text-foreground/90 text-center">Cons:</h4>
                <ul className="space-y-2">
                    {cons.map(con => (
                        <li key={con} className="flex items-start gap-3">
                            <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-1" />
                            <span>{con}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
}

function LandingFooter() {
    return (
        <footer className="relative z-10 flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 mt-auto">
            <p className="text-xs text-muted-foreground text-center">&copy; 2026 File System Visualizer. All rights reserved.</p>
        </footer>
    );
}


export default function LandingPage() {
  return (
    <div className="relative flex flex-col min-h-screen bg-transparent text-foreground">
        <AnimatedBackground />
        <header className="fixed top-0 w-full px-6 h-20 z-20 flex items-center justify-between bg-background/80 backdrop-blur-sm border-b">
            <Link href="/" className="flex items-center gap-2 group">
                <Cpu className="h-8 w-8 text-primary transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                <span className="font-bold text-xl">File System Visualizer</span>
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggle />
            </div>
        </header>
        <main className="relative z-10 flex-1 flex items-center justify-center">
            <section className="w-full py-20 md:py-32 lg:py-40">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="flex flex-col items-center space-y-6 text-center mb-16">
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter animated-gradient-text">
                            Dive into Allocation Strategies
                            </h1>
                            <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl">
                            Discover the three fundamental ways file systems organize data, each with its own trade-offs in performance, flexibility, and efficiency.
                            </p>
                            <Button asChild>
                                <Link href="/visualizer">
                                    Launch Visualization
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <div className="mx-auto grid items-stretch gap-8 sm:grid-cols-1 lg:grid-cols-3 max-w-5xl">
                        <AllocationCard
                            icon={<FileText className="h-7 w-7 text-primary" />}
                            title="Contiguous Allocation"
                            description="Files are stored in a single, continuous block of memory. It's simple and fast for sequential access."
                            pros={["Fast read performance", "Simple to implement", "Excellent for sequential files"]}
                            cons={["Suffers from external fragmentation", "Difficult to grow files", "Requires file size to be known beforehand"]}
                            delay={200}
                        />
                        <AllocationCard
                            icon={<LinkIcon className="h-7 w-7 text-primary" />}
                            title="Linked Allocation"
                            description="File blocks are scattered across the disk and linked together with pointers. It's flexible and avoids fragmentation."
                            pros={["No external fragmentation", "Files can grow easily", "File size doesn't need to be known"]}
                            cons={["Slow for direct access", "Pointers consume space", "A single broken link can lose data"]}
                            delay={400}
                        />
                        <AllocationCard
                            icon={<ListTree className="h-7 w-7 text-primary" />}
                            title="Indexed Allocation"
                            description="A special 'index block' stores pointers to all other data blocks. It offers a balance between contiguous and linked methods."
                            pros={["Supports direct access", "No external fragmentation", "Files can grow easily"]}
                            cons={["Wastes space for the index block", "Can be complex for very large files"]}
                            delay={600}
                        />
                    </div>
                </div>
            </section>
        </main>
        <LandingFooter />
    </div>
  );
}
