
"use client";

import { useFileSystem } from "@/contexts/file-system-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Album, BookOpenCheck, Palette, PieChart } from "lucide-react";
import { Progress } from "./ui/progress";

function Legend() {
    return (
      <Card className="mt-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette />
            Color Legend
            </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-sm bg-primary" />
            <span>Contiguous File</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-sm bg-file-linked" />
            <span>Linked File</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-sm bg-file-indexed" />
            <span>Indexed File</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-5 h-5">
                <div className="absolute inset-0 w-full h-full rounded-sm bg-file-indexed/40" />
                <div className="absolute inset-0 flex items-center justify-center rounded-sm ring-2 ring-yellow-400 dark:ring-yellow-500">
                  <Album className="h-3 w-3 text-yellow-400/80 dark:text-yellow-500/80" />
                </div>
            </div>
            <span>Index Block</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-sm bg-muted" />
            <span>Free Block</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-sm bg-primary/40 ring-2 ring-offset-2 ring-offset-background ring-primary" />
            <span>Selected File</span>
          </div>
        </CardContent>
      </Card>
    );
  }

function FragmentationAnalysis() {
  const { fragmentationData } = useFileSystem();
  const { totalFreeBlocks, largestFreeSegment, externalFragmentation } = fragmentationData;

  const fragmentationPercentage = totalFreeBlocks > 0 ? Math.round(externalFragmentation * 100) : 0;

  return (
    <Card className="mt-8 animate-fade-in-up" style={{ animationDelay: '350ms' }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart />
          Fragmentation Analysis
        </CardTitle>
        <CardDescription>
          A measure of how much free space is wasted in non-contiguous chunks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">External Fragmentation</span>
            <span className="font-medium">{fragmentationPercentage}%</span>
          </div>
          <Progress value={fragmentationPercentage} aria-label={`${fragmentationPercentage}% fragmentation`} />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
          <div>Total Free: <span className="font-medium text-foreground">{totalFreeBlocks} blocks</span></div>
          <div>Largest Segment: <span className="font-medium text-foreground">{largestFreeSegment} blocks</span></div>
        </div>
        <div className="text-xs text-muted-foreground pt-2 space-y-1 bg-muted/50 p-3 rounded-md border">
            <p className="font-semibold text-foreground/80">How it's calculated:</p>
            <p><strong className="font-mono">1 - (Largest Free Segment / Total Free Blocks)</strong></p>
            <p className="pt-1">This value indicates the proportion of free blocks that are not in a single large chunk. It primarily affects the <strong className="text-primary/90">contiguous</strong> strategy.</p>
        </div>
      </CardContent>
    </Card>
  )
}

function Explanation() {
    const { allocationStrategy, setAllocationStrategy } = useFileSystem();

    return (
        <Card className="mt-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BookOpenCheck />
                    Allocation Strategies
                </CardTitle>
                <CardDescription>Learn how different file allocation methods work.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={allocationStrategy} onValueChange={(value) => setAllocationStrategy(value as any)} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="contiguous">Contiguous</TabsTrigger>
                        <TabsTrigger value="linked">Linked</TabsTrigger>
                        <TabsTrigger value="indexed">Indexed</TabsTrigger>
                    </TabsList>
                    <TabsContent value="contiguous" className="pt-4 text-sm text-muted-foreground data-[state=active]:animate-fade-in-up">
                        <p className="font-semibold text-foreground mb-2">How it works:</p>
                        <p>A single continuous set of blocks is allocated to a file at the time of its creation. This is simple and fast for reading files because the disk head doesn't have to move much.</p>
                        <p className="mt-2"><strong className="text-foreground">Pros:</strong> Fast access, simple logic.</p>
                        <p className="mt-1"><strong className="text-foreground">Cons:</strong> Can lead to external fragmentation, making it hard to find large enough free blocks.</p>
                    </TabsContent>
                    <TabsContent value="linked" className="pt-4 text-sm text-muted-foreground data-[state=active]:animate-fade-in-up">
                        <p className="font-semibold text-foreground mb-2">How it works:</p>
                        <p>Each file is a linked list of disk blocks, which may be scattered anywhere on the disk. Each block contains a pointer to the next block in the chain.</p>
                        <p className="mt-2"><strong className="text-foreground">Pros:</strong> No external fragmentation. Files can grow dynamically as needed.</p>
                        <p className="mt-1"><strong className="text-foreground">Cons:</strong> Slow for direct access (must traverse the list). Pointers use space. One broken link can lose the rest of the file.</p>
                    </TabsContent>
                    <TabsContent value="indexed" className="pt-4 text-sm text-muted-foreground data-[state=active]:animate-fade-in-up">
                         <p className="font-semibold text-foreground mb-2">How it works:</p>
                        <p>All pointers for a file are grouped into a special "index block". This block then points to all the actual data blocks, which can be scattered across the disk.</p>
                        <p className="mt-2"><strong className="text-foreground">Pros:</strong> Solves fragmentation and allows for fast direct access to any part of the file.</p>
                        <p className="mt-1"><strong className="text-foreground">Cons:</strong> Wastes space on the index block (one extra block per file). Very large files might need multiple linked index blocks.</p>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

export function InfoPanel() {
    return (
        <>
            <Legend />
            <FragmentationAnalysis />
            <Explanation />
        </>
    )
}
