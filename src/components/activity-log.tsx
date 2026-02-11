"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "./ui/scroll-area";
import type { LogEntry } from "@/lib/types";
import { History } from "lucide-react";

interface ActivityLogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logs: LogEntry[];
}

export function ActivityLog({ open, onOpenChange, logs }: ActivityLogProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col w-full sm:w-[450px] sm:max-w-none">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <History />
            Recent Activity
          </SheetTitle>
          <SheetDescription>
            A log of all operations performed in the file system.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 -mx-6">
            <div className="space-y-4 px-6 py-4">
            {logs.length > 0 ? logs.map((log, index) => (
                <div key={index} className="flex gap-4 text-sm">
                <time className="text-muted-foreground w-16 shrink-0 font-mono text-xs">
                    {log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </time>
                <p className="flex-1">{log.message}</p>
                </div>
            )) : (
              <div className="text-center text-muted-foreground py-10">
                <p>No activity yet.</p>
              </div>
            )}
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
