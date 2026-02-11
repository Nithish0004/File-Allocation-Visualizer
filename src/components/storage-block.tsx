
"use client";

import React, { useMemo } from 'react';
import type { Block, FileSystemFile, AllocationStrategy } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { FileText, Album, Link2 } from "lucide-react";

interface StorageBlockProps {
  block: Block;
  file?: FileSystemFile;
  isSelected: boolean;
  isNewlyAllocated: boolean;
  isNewlyFreed: boolean;
  animationDelay: number;
  isIndexBlock: boolean;
  sequenceIndex: number;
}

export function StorageBlock({
  block,
  file,
  isSelected,
  isNewlyAllocated,
  isNewlyFreed,
  animationDelay,
  isIndexBlock,
  sequenceIndex,
}: StorageBlockProps) {

  const status = file ? (isSelected ? 'selected' : 'used') : 'free';

  const baseClasses = "aspect-square rounded-md transition-all duration-300 border-2";
  
  const colorClasses = useMemo(() => {
    if (!file) return { used: '', selected: '' };

    const colors: Record<AllocationStrategy, { used: string, selected: string }> = {
        contiguous: {
            used: 'bg-primary/20 border-primary/30',
            selected: 'bg-primary/40 border-primary ring-primary'
        },
        linked: {
            used: 'bg-file-linked/20 border-file-linked/30',
            selected: 'bg-file-linked/40 border-file-linked ring-file-linked'
        },
        indexed: {
            used: 'bg-file-indexed/20 border-file-indexed/30',
            selected: 'bg-file-indexed/40 border-file-indexed ring-file-indexed'
        }
    };
    return colors[file.allocationStrategy] || colors.contiguous;

  }, [file]);

  const statusClasses = {
    free: "bg-muted border-transparent hover:bg-muted/80",
    used: colorClasses.used,
    selected: `${colorClasses.selected} ring-2 ring-offset-2 ring-offset-background`,
  };
  
  const animationClasses = isNewlyAllocated
    ? 'animate-block-fade-in'
    : isNewlyFreed
    ? 'animate-block-fade-out'
    : '';
  
  const isVisualizing = sequenceIndex !== -1;

  const nextBlockIndex = useMemo(() => {
    if (file && file.allocationStrategy === 'linked') {
      const dataIndex = file.blockIndices.indexOf(block.id);
      if (dataIndex > -1 && dataIndex < file.blockIndices.length - 1) {
        return file.blockIndices[dataIndex + 1];
      }
    }
    return null;
  }, [file, block.id]);

  const blockElement = (
    <div className="relative h-full w-full group">
      <div
        className={cn(
          baseClasses,
          statusClasses[status],
          animationClasses,
          "transition-transform duration-200 group-hover:scale-105"
        )}
        style={{ animationDelay: `${animationDelay}ms` }}
      />
      {isIndexBlock && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md ring-4 ring-yellow-400 dark:ring-yellow-500 pointer-events-none">
          <Album className="h-1/2 w-1/2 text-yellow-400/80 dark:text-yellow-500/80" />
        </div>
      )}
       {isVisualizing && (
        <div
          className="absolute inset-0 rounded-md animate-link-pulse"
          style={{ animationDelay: `${sequenceIndex * 150}ms`, '--ring-color': `hsl(var(--${file?.allocationStrategy === 'contiguous' ? 'primary' : `file-${file?.allocationStrategy}`}))` } as React.CSSProperties}
        />
      )}
    </div>
  );

  if (!file) {
    return <div className={cn(baseClasses, statusClasses.free, "transition-transform duration-200 hover:scale-105")} />;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{blockElement}</PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none flex items-center">
                {isIndexBlock ? <Album className="mr-2 h-4 w-4"/> : <FileText className="mr-2 h-4 w-4"/>}
                {isIndexBlock ? 'Index Block' : 'Data Block'} Details
            </h4>
            <p className="text-sm text-muted-foreground">
              {isIndexBlock 
                ? "This block points to the file's data blocks."
                : "This block holds a chunk of the file's data."
              }
            </p>
          </div>
          <div className="grid gap-2 text-sm">
            <div className="grid grid-cols-2 items-center gap-2">
              <span className="font-semibold">File Name:</span>
              <span className="truncate">{file.name}</span>
            </div>
             <div className="grid grid-cols-2 items-center gap-2">
              <span className="font-semibold">Block ID:</span>
              <span>{block.id}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-2">
                <span className="font-semibold">Allocation:</span>
                <span className="capitalize">{file.allocationStrategy}</span>
            </div>
            <div className="grid grid-cols-2 items-center gap-2">
              <span className="font-semibold">Total Size:</span>
              <span>{file.size} data blocks</span>
            </div>

            {nextBlockIndex !== null && (
              <div className="grid grid-cols-2 items-center gap-2 text-sky-500 dark:text-sky-400">
                <span className="font-semibold flex items-center"><Link2 className="mr-2 h-4 w-4" /> Next Block:</span>
                <span>{nextBlockIndex}</span>
              </div>
            )}
            
            <div className="grid grid-cols-[auto,1fr] items-start gap-x-2">
              <span className="font-semibold pt-1">{isIndexBlock ? 'Points to:' : 'File Blocks:'}</span>
              <div className="flex flex-wrap gap-1 break-all max-h-24 overflow-y-auto">
                {file.blockIndices.map((blockIndex, i) => (
                    <span key={i} className={cn(
                        "font-mono text-xs px-1.5 py-0.5 rounded",
                         block.id === blockIndex ? "bg-accent text-accent-foreground" : "bg-muted"
                    )}>
                        {blockIndex}
                    </span>
                ))}
              </div>
            </div>
            {file.indexBlock !== undefined && (
                 <div className="grid grid-cols-2 items-center gap-2">
                    <span className="font-semibold">Index Block:</span>
                    <span>{file.indexBlock}</span>
                </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
