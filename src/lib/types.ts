
export type AllocationStrategy = "contiguous" | "linked" | "indexed";

export interface FileSystemFile {
  id: string;
  name: string;
  size: number; // in blocks
  blockIndices: number[];
  createdAt: Date;
  indexBlock?: number;
  allocationStrategy: AllocationStrategy;
  permissions: string;
}

export interface Block {
  id: number;
  fileId: string | null;
}

export interface LogEntry {
  timestamp: Date;
  message: string;
}

export const INITIAL_DISK_SIZE = 250;
