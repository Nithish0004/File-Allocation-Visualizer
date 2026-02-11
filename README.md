# File System Allocation Visualizer

An interactive and educational tool built with Next.js that brings file system allocation strategies to life. See how Contiguous, Linked, and Indexed allocation methods work by creating, deleting, and resizing files on a simulated disk.

![File System Visualizer Screenshot](https://i.imgur.com/kYqA7vj.png)

## ✨ Features

- **Interactive Grid:** A visual representation of disk blocks, showing how files are allocated in real-time.
- **Three Allocation Strategies:** Switch between **Contiguous**, **Linked**, and **Indexed** allocation to see their differences firsthand.
- **File Operations:** Create, delete, and resize files to observe how each strategy handles these operations.
- **Live Fragmentation Analysis:** A dedicated panel that calculates and displays external fragmentation in real-time, showing you the efficiency of the current disk state.
- **Detailed Block Info:** Hover over any block to see detailed information about the file it belongs to, including pointers for linked and indexed allocation.
- **Activity Log:** A running log of all file system operations performed during your session.
- **Permissions Control:** Change file permissions using `chmod`-style octal notation and see them reflected in the UI.
- **Sleek & Modern UI:** Built with ShadCN UI and Tailwind CSS, featuring both light and dark modes.
- **Educational Panels:** In-depth explanations for each allocation strategy and a clear color-coded legend to guide you.

## 🚀 Tech Stack

- **Framework:** Next.js (App Router)
- **UI:** React
- **Styling:** Tailwind CSS
- **Component Library:** ShadCN UI
- **State Management:** React Context API with `useReducer`
- **Icons:** Lucide React

## 🔧 How to Use

This application is designed to be explored. Here’s a suggested workflow:

1.  **Select a Strategy:** Use the "Allocation Strategy" dropdown to pick between Contiguous, Linked, or Indexed.
2.  **Create Files:** Click the "New File" button to add files of different sizes to the disk.
3.  **Observe the Grid:** Watch how the blocks are colored and arranged based on the chosen strategy.
    -   In **Linked** mode, hover over a block to see its pointer to the next block.
    -   In **Indexed** mode, identify the special yellow "index block" for each file.
4.  **Analyze Fragmentation:** Keep an eye on the "Fragmentation Analysis" card, especially after creating and deleting several files using the **Contiguous** strategy.
5.  **Defragment:** Click the "Defragment" button to consolidate the files and see how the free space is reclaimed.
6.  **Resize and Delete:** Use the file manager to resize or delete files and observe how the system re-allocates or frees up blocks.

## 🧠 Core Concepts Explained

### Contiguous Allocation
- **Concept:** Each file occupies a single, continuous set of blocks on the disk.
- **Pros:** Fast sequential access and simple logic.
- **Cons:** Prone to **external fragmentation**, making it difficult to allocate large files over time. File growth is problematic.

### Linked Allocation
- **Concept:** Each file is a linked list of blocks, which can be scattered anywhere on the disk. Each block contains a pointer to the next one.
- **Pros:** Eliminates external fragmentation and allows files to grow easily.
- **Cons:** Slow direct (random) access, as you must traverse the list from the beginning. Pointers consume a small amount of space.

### Indexed Allocation
- **Concept:** A special "index block" is created for each file, which stores an array of pointers to all the data blocks.
- **Pros:** Supports fast direct access and solves the external fragmentation problem.
- **Cons:** Wastes space on the index block (one extra block per file). Very large files might need more complex index schemes.
