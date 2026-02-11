import { Header } from "@/components/header";
import { GridFsVisualizer } from "@/components/grid-fs-visualizer";
import { FileSystemProvider } from "@/contexts/file-system-context";

export default function VisualizerPage() {
  return (
    <FileSystemProvider>
      <div className="flex flex-col h-screen bg-background">
        <Header />
        <GridFsVisualizer />
      </div>
    </FileSystemProvider>
  );
}
