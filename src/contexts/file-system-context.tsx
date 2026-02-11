
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useReducer, useEffect, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { FileSystemFile, Block, LogEntry, AllocationStrategy } from '@/lib/types';
import { INITIAL_DISK_SIZE } from '@/lib/types';

interface FileSystemState {
  diskSize: number;
  files: FileSystemFile[];
  blocks: Block[];
  selectedFileId: string | null;
  animatingBlocks: {
    allocated: number[];
    freed: number[];
  };
  logs: LogEntry[];
  allocationStrategy: AllocationStrategy;
}

interface FragmentationData {
    totalFreeBlocks: number;
    largestFreeSegment: number;
    externalFragmentation: number;
}

type Action =
  | { type: 'CREATE_FILE'; payload: { file: FileSystemFile, blocksToAllocate: number[] } }
  | { type: 'DELETE_FILE'; payload: { fileId: string } }
  | { type: 'RENAME_FILE'; payload: { fileId: string; newName: string; oldName: string } }
  | { type: 'RESIZE_FILE'; payload: { file: FileSystemFile, originalFileId: string; blockChanges: { allocated: number[], freed: number[] } } }
  | { type: 'SELECT_FILE'; payload: { fileId: string | null } }
  | { type: 'DEFRAGMENT_DISK'; payload: { files: FileSystemFile[], blocks: Block[] } }
  | { type: 'UPDATE_DISK_SIZE'; payload: { newSize: number } }
  | { type: 'CLEAR_ANIMATIONS' }
  | { type: 'SET_ALLOCATION_STRATEGY'; payload: AllocationStrategy }
  | { type: 'CHANGE_PERMISSION'; payload: { fileId: string; permissions: string } };
  
const createInitialState = (diskSize: number): FileSystemState => ({
  diskSize,
  files: [],
  blocks: Array.from({ length: diskSize }, (_, i) => ({ id: i, fileId: null })),
  selectedFileId: null,
  animatingBlocks: { allocated: [], freed: [] },
  logs: [{ timestamp: new Date(), message: `File system initialized with ${diskSize} blocks. Allocation: contiguous.` }],
  allocationStrategy: 'contiguous',
});

const fileSystemReducer = (state: FileSystemState, action: Action): FileSystemState => {
  switch (action.type) {
    case 'CREATE_FILE': {
      const { file, blocksToAllocate } = action.payload;
      
      const updatedBlocks = state.blocks.map(b =>
        blocksToAllocate.includes(b.id) ? { ...b, fileId: file.id } : b
      );
      return {
        ...state,
        files: [...state.files, file],
        blocks: updatedBlocks,
        selectedFileId: file.id,
        animatingBlocks: { allocated: blocksToAllocate, freed: [] },
        logs: [{ timestamp: new Date(), message: `Created "${file.name}" (${file.size} blocks, ${file.permissions}) with ${file.allocationStrategy}` }, ...state.logs],
      };
    }
    case 'DELETE_FILE': {
      const { fileId } = action.payload;
      const fileToDelete = state.files.find(f => f.id === fileId);
      if (!fileToDelete) return state;

      const blocksToFree = [...fileToDelete.blockIndices];
      if (fileToDelete.indexBlock !== undefined) {
        blocksToFree.push(fileToDelete.indexBlock);
      }

      const updatedBlocks = state.blocks.map(b =>
        blocksToFree.includes(b.id) ? { ...b, fileId: null } : b
      );
      return {
        ...state,
        files: state.files.filter(f => f.id !== fileId),
        blocks: updatedBlocks,
        selectedFileId: state.selectedFileId === fileId ? null : state.selectedFileId,
        animatingBlocks: { allocated: [], freed: blocksToFree },
        logs: [{ timestamp: new Date(), message: `Deleted file "${fileToDelete.name}"` }, ...state.logs],
      };
    }
    case 'RENAME_FILE': {
        const { fileId, newName, oldName } = action.payload;
        if (state.files.some(f => f.name === newName && f.id !== fileId)) {
            return state;
        }
        return {
            ...state,
            files: state.files.map(f => f.id === fileId ? {...f, name: newName} : f),
            logs: [{ timestamp: new Date(), message: `Renamed "${oldName}" to "${newName}"` }, ...state.logs],
        };
    }
    case 'RESIZE_FILE': {
      const { file, originalFileId, blockChanges } = action.payload;
      const fileToUpdate = state.files.find(f => f.id === originalFileId);
      if (!fileToUpdate) return state;
  
      const updatedFiles = state.files.map(f => f.id === originalFileId ? file : f);
      
      // The `file` payload contains the complete new allocation
      const allNewBlocksForFile = new Set(file.blockIndices);
      if (file.indexBlock !== undefined) {
        allNewBlocksForFile.add(file.indexBlock);
      }

      const updatedBlocks = state.blocks.map(b => {
        // If this block is part of the new allocation, assign it to the file
        if (allNewBlocksForFile.has(b.id)) {
          return { ...b, fileId: originalFileId };
        }
        // If this block was part of the old allocation but not the new, free it
        if (b.fileId === originalFileId && !allNewBlocksForFile.has(b.id)) {
          return { ...b, fileId: null };
        }
        // Otherwise, the block is unaffected
        return b;
      });
  
      return {
        ...state,
        files: updatedFiles,
        blocks: updatedBlocks,
        animatingBlocks: blockChanges,
        selectedFileId: originalFileId,
        logs: [{ timestamp: new Date(), message: `Resized/re-allocated "${fileToUpdate.name}" to ${file.size} blocks using ${file.allocationStrategy}` }, ...state.logs],
      };
    }
    case 'DEFRAGMENT_DISK': {
      return {
        ...state,
        files: action.payload.files,
        blocks: action.payload.blocks,
        animatingBlocks: { allocated: [], freed: [] },
        logs: [{ timestamp: new Date(), message: "Disk defragmentation complete." }, ...state.logs],
      };
    }
    case 'UPDATE_DISK_SIZE': {
        const { newSize } = action.payload;
        const blocksToRemove = newSize < state.diskSize ? state.blocks.slice(newSize) : [];
        if (blocksToRemove.some(b => b.fileId !== null)) {
            return state; // Abort
        }
        
        let newBlocks = [...state.blocks];
        if (newSize > state.diskSize) {
          const additionalBlocks = Array.from({ length: newSize - state.diskSize }, (_, i) => ({ id: state.diskSize + i, fileId: null }));
          newBlocks = [...state.blocks, ...additionalBlocks];
        } else if (newSize < state.diskSize) {
          newBlocks = state.blocks.slice(0, newSize);
        }

        return {
          ...state,
          diskSize: newSize,
          blocks: newBlocks,
          logs: [{ timestamp: new Date(), message: `Disk size changed to ${newSize} blocks.` }, ...state.logs]
        };
    }
    case 'CHANGE_PERMISSION': {
        const { fileId, permissions } = action.payload;
        const fileToUpdate = state.files.find(f => f.id === fileId);
        if (!fileToUpdate) return state;
  
        return {
          ...state,
          files: state.files.map(f => f.id === fileId ? { ...f, permissions } : f),
          logs: [{ timestamp: new Date(), message: `Changed permissions for "${fileToUpdate.name}" to ${permissions}` }, ...state.logs],
        };
    }
    case 'SELECT_FILE':
      return { ...state, selectedFileId: action.payload.fileId };
    case 'CLEAR_ANIMATIONS':
      return { ...state, animatingBlocks: { allocated: [], freed: [] } };
    case 'SET_ALLOCATION_STRATEGY':
      if (state.allocationStrategy === action.payload) {
        return state;
      }
      return {
          ...state,
          allocationStrategy: action.payload,
          logs: [{ timestamp: new Date(), message: `Allocation strategy set to ${action.payload}.` }, ...state.logs],
      };
    default:
      return state;
  }
};

interface FileSystemContextType extends FileSystemState {
  createFile: (name: string, size: number) => void;
  deleteFile: (fileId: string) => void;
  renameFile: (fileId: string, newName: string) => void;
  resizeFile: (fileId: string, newSize: number) => void;
  selectFile: (fileId: string | null) => void;
  defragmentDisk: () => void;
  updateDiskSize: (diskSize: number) => void;
  setAllocationStrategy: (strategy: AllocationStrategy) => void;
  changePermission: (fileId: string, permissions: string) => void;
  largestFile: FileSystemFile | null;
  fragmentationData: FragmentationData;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

export const FileSystemProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(fileSystemReducer, INITIAL_DISK_SIZE, createInitialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.animatingBlocks.allocated.length > 0 || state.animatingBlocks.freed.length > 0) {
      const timer = setTimeout(() => dispatch({ type: 'CLEAR_ANIMATIONS' }), 1000);
      return () => clearTimeout(timer);
    }
  }, [state.animatingBlocks]);

  const largestFile = useMemo(() => {
    if (state.files.length === 0) return null;
    return state.files.reduce((largest, current) => current.size > largest.size ? current : largest, state.files[0]);
  }, [state.files]);

  const fragmentationData = useMemo(() => {
    const freeBlocksCount = state.blocks.filter(b => b.fileId === null).length;
    if (freeBlocksCount === 0) {
      return { totalFreeBlocks: 0, largestFreeSegment: 0, externalFragmentation: 0 };
    }

    let largestSegment = 0;
    let currentSegment = 0;
    for (const block of state.blocks) {
      if (block.fileId === null) {
        currentSegment++;
      } else {
        largestSegment = Math.max(largestSegment, currentSegment);
        currentSegment = 0;
      }
    }
    largestSegment = Math.max(largestSegment, currentSegment); // Check the last segment

    const fragmentation = freeBlocksCount > 0 ? 1 - (largestSegment / freeBlocksCount) : 0;

    return {
      totalFreeBlocks: freeBlocksCount,
      largestFreeSegment: largestSegment,
      externalFragmentation: fragmentation,
    };
  }, [state.blocks]);

  const setAllocationStrategy = useCallback((strategy: AllocationStrategy) => {
    dispatch({ type: 'SET_ALLOCATION_STRATEGY', payload: strategy });
  }, []);

  const createFile = useCallback((name: string, size: number) => {
    const finalName = name.includes('.') ? name : `${name}.txt`;
    if (state.files.some(f => f.name === finalName)) {
      toast({
          variant: "destructive",
          title: "Error Creating File",
          description: `File name "${finalName}" already exists.`,
      });
      return;
    }

    const newFileId = crypto.randomUUID();
    let blocksToAllocate: number[] = [];
    let fileToCreate: FileSystemFile | null = null;
    const freeBlocks = state.blocks.filter(b => b.fileId === null);

    if (state.allocationStrategy === 'contiguous') {
        let startBlock = -1;
        for (let i = 0; i <= state.blocks.length - size; i++) {
          let found = true;
          for (let j = 0; j < size; j++) {
            if (state.blocks[i+j].fileId !== null) {
              found = false;
              break;
            }
          }
          if (found) {
            startBlock = i;
            break;
          }
        }

        if (startBlock === -1) {
            toast({
                variant: "destructive",
                title: "Allocation Error",
                description: `Contiguous allocation failed. No continuous space for ${size} blocks is available.`,
            });
            return;
        }

        blocksToAllocate = Array.from({ length: size }, (_, i) => startBlock + i);
        fileToCreate = { id: newFileId, name: finalName, size, blockIndices: blocksToAllocate, createdAt: new Date(), allocationStrategy: state.allocationStrategy, permissions: '666' };

    } else if (state.allocationStrategy === 'linked') {
        if (freeBlocks.length < size) {
            toast({ variant: "destructive", title: "Allocation Error", description: `Not enough space. Requested ${size} blocks, have ${freeBlocks.length}.`});
            return;
        }
        blocksToAllocate = freeBlocks.slice(0, size).map(b => b.id);
        fileToCreate = { id: newFileId, name: finalName, size, blockIndices: blocksToAllocate, createdAt: new Date(), allocationStrategy: state.allocationStrategy, permissions: '666' };

    } else if (state.allocationStrategy === 'indexed') {
        const requiredBlocks = size + 1;
        if (freeBlocks.length < requiredBlocks) {
            toast({ variant: "destructive", title: "Allocation Error", description: `Not enough space. Requested ${requiredBlocks} blocks (1 for index), have ${freeBlocks.length}.`});
            return;
        }
        const indexBlock = freeBlocks[0].id;
        const dataBlocks = freeBlocks.slice(1, requiredBlocks).map(b => b.id);
        blocksToAllocate = [indexBlock, ...dataBlocks];
        fileToCreate = { id: newFileId, name: finalName, size, blockIndices: dataBlocks, indexBlock, createdAt: new Date(), allocationStrategy: state.allocationStrategy, permissions: '666' };
    }

    if (fileToCreate) {
        dispatch({ type: 'CREATE_FILE', payload: { file: fileToCreate, blocksToAllocate } });
        toast({
            className: 'bg-success text-success-foreground',
            title: "Success",
            description: `File "${finalName}" created using ${state.allocationStrategy} allocation.`,
        });
    }

  }, [state.blocks, state.files, state.allocationStrategy, toast]);

  const deleteFile = useCallback((fileId: string) => {
    const file = state.files.find(f => f.id === fileId);
    if (!file) return;
    dispatch({ type: 'DELETE_FILE', payload: { fileId } });
    toast({
        title: "File Deleted",
        description: `File "${file.name}" has been deleted.`,
    });
  }, [state.files, toast]);

  const renameFile = useCallback((fileId: string, newName: string) => {
    const file = state.files.find(f => f.id === fileId);
    if (!file) return;
    
    const finalNewName = newName.includes('.') ? newName : `${newName}.txt`;

    if (state.files.some(f => f.name === finalNewName && f.id !== fileId)) {
      toast({
          variant: "destructive",
          title: "Error Renaming File",
          description: `File name "${finalNewName}" already exists.`,
      });
      return;
    }
    dispatch({ type: 'RENAME_FILE', payload: { fileId, newName: finalNewName, oldName: file.name } });
    toast({
        className: 'bg-success text-success-foreground',
        title: "File Renamed",
        description: `File renamed to "${finalNewName}".`,
    });
  }, [state.files, toast]);

  const resizeFile = useCallback((fileId: string, newSize: number) => {
    const file = state.files.find(f => f.id === fileId);
    if (!file) return;

    const strategy = state.allocationStrategy;
    
    const oldBlocksSet = new Set(file.blockIndices);
    if (file.indexBlock !== undefined) {
        oldBlocksSet.add(file.indexBlock);
    }
    
    const tempAvailableBlocks = state.blocks.filter(b => b.fileId === null || b.fileId === fileId);

    let newlyAllocatedBlocks: number[] = [];
    let newIndexBlock: number | undefined = undefined;
    let newDataBlocks: number[] = [];
    
    if (strategy === 'contiguous') {
        const requiredBlocks = newSize;
        let startBlock = -1;
        
        const blockAvailability = state.blocks.map(b => b.fileId === null || b.fileId === fileId);
        
        for (let i = 0; i <= blockAvailability.length - requiredBlocks; i++) {
            let found = true;
            for (let j = 0; j < requiredBlocks; j++) {
                if (!blockAvailability[i+j]) {
                    found = false;
                    i = i + j; // Optimization
                    break;
                }
            }
            if (found) {
                startBlock = i;
                break;
            }
        }
        
        if (startBlock === -1) {
            toast({
                variant: "destructive",
                title: "Re-allocation Failed",
                description: `Contiguous allocation failed. No continuous space for ${requiredBlocks} blocks is available.`,
                duration: 5000,
            });
            return;
        }

        newDataBlocks = Array.from({ length: requiredBlocks }, (_, i) => startBlock + i);
        newlyAllocatedBlocks = [...newDataBlocks];
        newIndexBlock = undefined;

    } else if (strategy === 'linked') {
        if (tempAvailableBlocks.length < newSize) {
            toast({ variant: "destructive", title: "Re-allocation Error", description: `Not enough space. Requested ${newSize} blocks, have ${tempAvailableBlocks.length}.`});
            return;
        }
        newDataBlocks = tempAvailableBlocks.slice(0, newSize).map(b => b.id);
        newlyAllocatedBlocks = [...newDataBlocks];
        newIndexBlock = undefined;

    } else if (strategy === 'indexed') {
        const requiredBlocks = newSize + 1;
        if (tempAvailableBlocks.length < requiredBlocks) {
            toast({ variant: "destructive", title: "Re-allocation Error", description: `Not enough space. Requested ${requiredBlocks} blocks (1 for index), have ${tempAvailableBlocks.length}.`});
            return;
        }
        newIndexBlock = tempAvailableBlocks[0].id;
        newDataBlocks = tempAvailableBlocks.slice(1, requiredBlocks).map(b => b.id);
        newlyAllocatedBlocks = [newIndexBlock, ...newDataBlocks];
    }
    
    const updatedFilePayload: FileSystemFile = {
        ...file,
        size: newSize,
        blockIndices: newDataBlocks,
        indexBlock: newIndexBlock,
        allocationStrategy: strategy,
    };

    const newBlocksSet = new Set(newlyAllocatedBlocks);
    const blocksToFree = Array.from(oldBlocksSet).filter(b => !newBlocksSet.has(b));
    const blocksToAllocate = newlyAllocatedBlocks.filter(b => !oldBlocksSet.has(b));

    dispatch({ 
        type: 'RESIZE_FILE', 
        payload: { 
            file: updatedFilePayload, 
            originalFileId: fileId, 
            blockChanges: { 
                allocated: blocksToAllocate, 
                freed: blocksToFree 
            } 
        } 
    });
    toast({ className: 'bg-success text-success-foreground', title: "Success", description: `File "${file.name}" re-allocated to ${newSize} blocks using ${strategy}.` });

  }, [state.files, state.blocks, state.allocationStrategy, toast]);

  const defragmentDisk = useCallback(() => {
    const newBlocks: Block[] = Array.from({ length: state.diskSize }, (_, i) => ({ id: i, fileId: null }));
    const updatedFiles: FileSystemFile[] = [];
    let currentBlockIndex = 0;

    const sortedFiles = [...state.files].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    for (const file of sortedFiles) {
      const isIndexed = file.allocationStrategy === 'indexed';
      const blocksNeeded = file.size + (isIndexed ? 1 : 0);

      if (currentBlockIndex + blocksNeeded > state.diskSize) {
        // Not enough space to defragment this file, so we can't continue
        // In a real scenario, you might want to copy non-movable files too
        // For this simulation, we'll just stop
        break;
      }

      const newFile: FileSystemFile = { ...file, blockIndices: [] };
      
      let newIndexBlock: number | undefined;
      if (isIndexed) {
          newIndexBlock = currentBlockIndex;
          newBlocks[currentBlockIndex].fileId = file.id;
          currentBlockIndex++;
      }

      const newBlockIndices: number[] = [];
      for (let i = 0; i < file.size; i++) {
          newBlocks[currentBlockIndex].fileId = file.id;
          newBlockIndices.push(currentBlockIndex);
          currentBlockIndex++;
      }
      newFile.blockIndices = newBlockIndices;
      newFile.indexBlock = newIndexBlock;
      updatedFiles.push(newFile);
    };

    const remainingFiles = state.files.filter(f => !updatedFiles.some(uf => uf.id === f.id));
    for (const file of remainingFiles) {
      file.blockIndices.forEach(idx => newBlocks[idx].fileId = file.id);
      if (file.indexBlock !== undefined) {
        newBlocks[file.indexBlock].fileId = file.id;
      }
    }


    dispatch({ type: 'DEFRAGMENT_DISK', payload: { files: [...updatedFiles, ...remainingFiles], blocks: newBlocks } });
    toast({
        className: 'bg-success text-success-foreground',
        title: "Defragmentation Complete",
        description: "All possible files have been consolidated.",
    });
  }, [state.files, state.diskSize, toast]);

  const updateDiskSize = useCallback((newSize: number) => {
    if (newSize < state.diskSize) {
        const blocksToRemove = state.blocks.slice(newSize);
        if (blocksToRemove.some(b => b.fileId !== null)) {
            toast({
                variant: "destructive",
                title: "Error Reducing Disk Size",
                description: "Cannot decrease disk size because files are stored in the space that would be removed.",
                duration: 5000,
            });
            return;
        }
    }
    dispatch({ type: 'UPDATE_DISK_SIZE', payload: { newSize } });
    toast({
      title: "Disk Size Updated",
      description: `Disk size is now ${newSize} blocks.`,
    });
  }, [state.diskSize, state.blocks, toast]);
  
  const selectFile = useCallback((fileId: string | null) => {
    dispatch({ type: 'SELECT_FILE', payload: { fileId } });
  }, []);

  const changePermission = useCallback((fileId: string, permissions: string) => {
    const file = state.files.find(f => f.id === fileId);
    if (!file) {
        toast({ variant: 'destructive', title: 'Error', description: 'File not found.' });
        return;
    }
    if (!/^[0-7]{3}$/.test(permissions)) {
        toast({ variant: 'destructive', title: 'Invalid Permissions', description: 'Permissions must be a 3-digit octal number (e.g., 755).' });
        return;
    }
    dispatch({ type: 'CHANGE_PERMISSION', payload: { fileId, permissions } });
    toast({ className: 'bg-success text-success-foreground', title: "Permissions Updated", description: `Permissions for "${file.name}" set to ${permissions}.` });
}, [state.files, toast]);

  const value = useMemo(() => ({
    ...state,
    createFile,
    deleteFile,
    renameFile,
    resizeFile,
    selectFile,
    defragmentDisk,
    updateDiskSize,
    setAllocationStrategy,
    changePermission,
    largestFile,
    fragmentationData,
  }), [state, createFile, deleteFile, renameFile, resizeFile, selectFile, defragmentDisk, updateDiskSize, setAllocationStrategy, changePermission, largestFile, fragmentationData]);


  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (context === undefined) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
};
