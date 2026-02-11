
"use client";

import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateFileDialog, SettingsDialog, ResizeFileDialog, ChangePermissionDialog } from "@/components/file-dialogs";
import { useFileSystem } from "@/contexts/file-system-context";
import { File, MoreVertical, PlusCircle, Trash2, Search, Activity, Settings, ServerCog, Edit, HardDrive, FolderSearch, Files, Shuffle, Shield, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Input } from './ui/input';
import { ActivityLog } from './activity-log';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { AllocationStrategy } from '@/lib/types';

const getFileExtension = (filename: string) => {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return `.${parts.pop()}`;
  }
  return '.txt';
};

const fileColorClass = (strategy?: AllocationStrategy) => {
    switch (strategy) {
      case 'contiguous': return 'bg-primary';
      case 'linked': return 'bg-file-linked';
      case 'indexed': return 'bg-file-indexed';
      default: return 'bg-muted';
    }
};

const octalToRwx = (octal: string) => {
    if (!/^[0-7]{3}$/.test(octal)) return '---------';
    const rwx = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
    return octal.split('').map(digit => rwx[parseInt(digit, 8)]).join('');
};

export function FileManager() {
  const { files, blocks, selectFile, selectedFileId, deleteFile, largestFile, logs, defragmentDisk, diskSize, allocationStrategy, setAllocationStrategy } = useFileSystem();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [isResizeOpen, setResizeOpen] = useState(false);
  const [isPermissionOpen, setPermissionOpen] = useState(false);
  const [selectedExtension, setSelectedExtension] = useState('all');

  const usedBlocks = blocks.filter(b => b.fileId !== null).length;
  const freeBlocks = diskSize - usedBlocks;
  const usagePercentage = diskSize > 0 ? Math.round((usedBlocks / diskSize) * 100) : 0;

  const availableExtensions = useMemo(() => {
    const extensions = new Set(files.map(file => getFileExtension(file.name)));
    return Array.from(extensions).sort();
  }, [files]);

  const filteredFiles = useMemo(() => {
    return files
      .filter(file => {
        if (selectedExtension === 'all') return true;
        return getFileExtension(file.name) === selectedExtension;
      })
      .filter(file => {
        if (!searchTerm) return true;
        return file.name.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [files, searchTerm, selectedExtension]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="space-y-1.5">
        <p className="text-muted-foreground">Manage files and storage blocks.</p>
      </div>

      <Card className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Disk Usage</span>
                    <span className="font-medium">{usagePercentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                    <div 
                        className="bg-primary h-2.5 rounded-full transition-all duration-500" 
                        style={{ width: `${usagePercentage}%` }}
                    ></div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground">
                <div>Total: <span className="font-medium text-foreground">{diskSize} blocks</span></div>
                <div>Used: <span className="font-medium text-foreground">{usedBlocks} blocks</span></div>
                <div>Free: <span className="font-medium text-foreground">{freeBlocks} blocks</span></div>
                {largestFile && (
                <div className="col-span-2">Largest: <span className="font-medium text-foreground truncate">{largestFile.name} ({largestFile.size} blocks)</span></div>
                )}
            </div>
        </CardContent>
      </Card>
      
      <Card className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Shuffle />
            Allocation Strategy
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <Select value={allocationStrategy} onValueChange={(value) => setAllocationStrategy(value as AllocationStrategy)}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a strategy" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="contiguous">Contiguous</SelectItem>
                    <SelectItem value="linked">Linked</SelectItem>
                    <SelectItem value="indexed">Indexed</SelectItem>
                </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground pt-2">
                {allocationStrategy === 'contiguous' && 'Allocates files in a single, continuous block of space.'}
                {allocationStrategy === 'linked' && 'Allocates files in separate blocks linked together.'}
                {allocationStrategy === 'indexed' && 'Uses an index block to point to data blocks. Consumes one extra block per file.'}
            </p>
            <div className="flex gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={defragmentDisk} className="w-full">
                    <ServerCog className="mr-2 h-4 w-4" /> Defragment
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)} className="w-full">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                </Button>
            </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Files className="h-5 w-5" />
                Files ({filteredFiles.length})
            </CardTitle>
            <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => setShowActivityLog(!showActivityLog)}>
                <Activity className="h-4 w-4" />
                <span className="sr-only">View Activity Log</span>
            </Button>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-2 items-center gap-2">
                <Button size="sm" onClick={() => setCreateOpen(true)} className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New File
                </Button>
                 <Button size="sm" variant="outline" onClick={() => setResizeOpen(true)} className="w-full">
                    <Edit className="mr-2 h-4 w-4" />
                    Resize
                </Button>
            </div>
            <Button size="sm" variant="outline" onClick={() => setPermissionOpen(true)} className="w-full">
                <Shield className="mr-2 h-4 w-4" />
                Permissions
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search files..."
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={selectedExtension} onValueChange={setSelectedExtension}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by extension" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Files</SelectItem>
                        {availableExtensions.map(ext => (
                            <SelectItem key={ext} value={ext}>{ext}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <div>
              {filteredFiles.length > 0 ? (
                <ul className="space-y-2">
                  {filteredFiles.map((file, index) => (
                    <li 
                        key={file.id} 
                        className="opacity-0 animate-fade-in-up transition-transform duration-200 hover:scale-[1.02]"
                        style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => selectFile(file.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            selectFile(file.id);
                          }
                        }}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-colors flex items-center gap-4 focus:outline-none focus:ring-2 focus:ring-ring",
                          selectedFileId === file.id
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <File className="h-6 w-6 shrink-0" />
                        <div className="flex-1 truncate">
                            <div className="flex items-center gap-2">
                                <div className={cn("h-2.5 w-2.5 rounded-full shrink-0", fileColorClass(file.allocationStrategy))} />
                                <p className="font-medium truncate">{file.name}</p>
                            </div>
                            <p className={cn("text-sm pl-4.5", selectedFileId === file.id ? "text-accent-foreground/80" : "text-muted-foreground")}>
                                {file.size} blocks ({file.allocationStrategy}) {file.indexBlock !== undefined && ' (+1 index)'}
                            </p>
                            <p className={cn("text-xs pl-4.5 font-mono", selectedFileId === file.id ? "text-accent-foreground/70" : "text-muted-foreground/80")}>
                                <ShieldCheck className="h-3 w-3 inline-block mr-1.5" />
                                {file.permissions} ({octalToRwx(file.permissions)})
                            </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className={cn("h-8 w-8 shrink-0", selectedFileId === file.id && "hover:bg-accent hover:text-accent-foreground")} onClick={e => e.stopPropagation()}>
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">File options</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={(e) => { e.stopPropagation(); deleteFile(file.id); }}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg flex flex-col items-center justify-center min-h-[200px]">
                    <FolderSearch className="w-16 h-16 mb-4 text-primary/20" />
                    <p className="text-lg font-medium">No files found.</p>
                    {(searchTerm || selectedExtension !== 'all') && <p className="text-sm mt-1">Try a different search or filter.</p>}
                    {!searchTerm && selectedExtension === 'all' && <p className="text-sm mt-1">Click "New File" to get started!</p>}
                </div>
              )}
            </div>
        </CardContent>
      </Card>
      
      <CreateFileDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
      <ActivityLog open={showActivityLog} onOpenChange={setShowActivityLog} logs={logs} />
      <SettingsDialog open={isSettingsOpen} onOpenChange={setSettingsOpen} />
      <ResizeFileDialog open={isResizeOpen} onOpenChange={setResizeOpen} />
      <ChangePermissionDialog open={isPermissionOpen} onOpenChange={setPermissionOpen} />
    </div>
  );
}
