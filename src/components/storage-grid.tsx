
"use client";

import { useMemo } from "react";
import { useFileSystem } from "@/contexts/file-system-context";
import { StorageBlock } from "./storage-block";

export function StorageGrid() {
  const { blocks, files, selectedFileId, animatingBlocks, selectFile } = useFileSystem();
  
  const selectedFile = useMemo(() => files.find(f => f.id === selectedFileId), [files, selectedFileId]);

  return (
    <div
      className="grid gap-1.5"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(28px, 1fr))` }}
    >
      {blocks.map(block => {
        const file = block.fileId ? files.find(f => f.id === block.fileId) : undefined;
        const isSelected = !!file && file.id === selectedFileId;
        const isNewlyAllocated = animatingBlocks.allocated.includes(block.id);
        const isNewlyFreed = animatingBlocks.freed.includes(block.id);
        const animationIndex = isNewlyAllocated ? animatingBlocks.allocated.indexOf(block.id) : animatingBlocks.freed.indexOf(block.id);
        const isIndexBlock = !!file && file.indexBlock === block.id;

        let sequenceIndex = -1;
        
        if (isSelected && selectedFile) {
          if (isIndexBlock) {
            sequenceIndex = 0;
          } else {
            const dataIndex = selectedFile.blockIndices.indexOf(block.id);
            if (dataIndex !== -1) {
              sequenceIndex = dataIndex + (selectedFile.indexBlock !== undefined ? 1 : 0);
            }
          }
        }

        const handleClick = () => {
          selectFile(file ? file.id : null);
        };

        return (
          <div key={block.id} onClick={handleClick} className="cursor-pointer">
            <StorageBlock
              block={block}
              file={file}
              isSelected={isSelected}
              isNewlyAllocated={isNewlyAllocated}
              isNewlyFreed={isNewlyFreed}
              animationDelay={animationIndex * 20} // Staggered animation for create/delete
              isIndexBlock={isIndexBlock}
              sequenceIndex={sequenceIndex}
            />
          </div>
        );
      })}
    </div>
  );
}
