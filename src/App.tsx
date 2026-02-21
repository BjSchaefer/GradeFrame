import { useState, useCallback } from "react";
import { StartPage } from "@/components/StartPage";
import { Editor } from "@/components/Editor";
import type { RecentFolder } from "@/lib/types";

type Page = "start" | "editor";

export default function App() {
  const [page, setPage] = useState<Page>("start");
  const [folderPath, setFolderPath] = useState<string | null>(null);
  const [recentFolders, setRecentFolders] = useState<RecentFolder[]>([]);

  const handleOpenFolder = useCallback((path: string, name: string) => {
    setFolderPath(path);
    setRecentFolders((prev) => {
      const filtered = prev.filter((f) => f.path !== path);
      return [
        { path, name, date: new Date().toISOString().split("T")[0] },
        ...filtered,
      ].slice(0, 10);
    });
    setPage("editor");
  }, []);

  const handleBack = useCallback(() => {
    setPage("start");
    setFolderPath(null);
  }, []);

  if (page === "editor" && folderPath) {
    return <Editor folderPath={folderPath} onBack={handleBack} />;
  }

  return (
    <StartPage
      recentFolders={recentFolders}
      onOpenFolder={handleOpenFolder}
    />
  );
}
