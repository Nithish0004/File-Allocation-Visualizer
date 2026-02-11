import { FileManager } from "./file-manager";
import { InfoPanel } from "./info-panel";
import { StorageGrid } from "./storage-grid";

export function GridFsVisualizer() {
  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-[450px_1fr] h-full overflow-hidden">
      <aside className="border-r bg-card overflow-y-auto">
        <FileManager />
      </aside>
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background overflow-y-auto bg-grid-pattern">
        <div className="max-w-3xl mx-auto">
          <StorageGrid />
          <InfoPanel />
        </div>
      </main>
    </div>
  );
}
