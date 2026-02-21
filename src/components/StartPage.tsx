import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, Clock, Folder } from "lucide-react";
import type { RecentFolder } from "@/lib/types";
import { GradeFrameLogo } from "./GradeFrameLogo";

interface StartPageProps {
  recentFolders: RecentFolder[];
  onOpenFolder: (path: string, name: string) => void;
}

export function StartPage({ recentFolders, onOpenFolder }: StartPageProps) {
  async function handleSelectFolder() {
    const selected = await open({ directory: true, multiple: false });
    if (selected && typeof selected === "string") {
      const parts = selected.replace(/\\/g, "/").split("/");
      const name = parts[parts.length - 1] || "Untitled";
      onOpenFolder(selected, name);
    }
  }

  return (
    <div className="h-screen bg-stone-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 shrink-0 shadow-sm">
        <div className="flex items-center h-12 px-4">
          <GradeFrameLogo />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-lg">
              <GradeFrameLogo iconOnly size="lg" />
            </div>
            <h1 className="text-2xl font-bold text-stone-800 mb-2">
              Welcome to GradeFrame
            </h1>
            <p className="text-stone-500 text-sm">
              Select a working directory containing student PDFs to start
              grading.
            </p>
          </div>

          {/* Open Folder Button */}
          <button
            onClick={handleSelectFolder}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-xl
              bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold text-sm
              hover:from-teal-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl cursor-pointer mb-8"
          >
            <FolderOpen className="h-5 w-5" />
            Open Folder…
          </button>

          {/* Recent Folders */}
          {recentFolders.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-3.5 w-3.5 text-stone-400" />
                <h2 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                  Recent Projects
                </h2>
              </div>
              <div className="space-y-2">
                {recentFolders.map((folder) => (
                  <button
                    key={folder.path}
                    onClick={() => onOpenFolder(folder.path, folder.name)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-stone-200
                      hover:border-teal-300 hover:bg-teal-50/30 transition-all cursor-pointer text-left group shadow-sm"
                  >
                    <div className="w-9 h-9 rounded-lg bg-stone-100 group-hover:bg-teal-100 flex items-center justify-center shrink-0 transition-colors">
                      <Folder className="h-4 w-4 text-stone-400 group-hover:text-teal-600 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-stone-700 truncate">
                        {folder.name}
                      </div>
                      <div className="text-xs text-stone-400 truncate font-mono">
                        {folder.path}
                      </div>
                    </div>
                    <span className="text-xs text-stone-300 shrink-0">
                      {folder.date}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
