# **App Name**: GridFS Visualizer

## Core Features:

- Grid Display: Display a grid representing storage blocks, with different colors for free, used, and selected blocks.
- File Creation: Allocate and visualize storage blocks upon file creation.
- File Deletion: Free storage blocks and update the grid upon file deletion.
- File Movement: Update block allocation in the grid when moving files.
- File Resizing: Adjust block allocation based on file size changes.
- File Selection: Highlight blocks belonging to the selected file in the grid.
- File Details: Display file details (name, size, blocks) in a small popup on click.

## Style Guidelines:

- Background: Light gray (#F8FAFC) to provide a clean backdrop.
- Free block: Light grey (#E5E7EB) to represent available storage.
- Used block: Blue (#3B82F6) to indicate allocated storage.
- Selected file blocks: Darker blue (#2563EB) to highlight the blocks of the selected file.
- Error: Red (#EF4444) to indicate issues or errors.
- Success: Green (#10B981) to confirm successful operations.
- Body and headline font: 'Inter' sans-serif for a modern, machined feel.
- Fade-in animation for newly allocated blocks.
- Fade-out animation for freed blocks.
- Smooth transition for highlighting selected file blocks.