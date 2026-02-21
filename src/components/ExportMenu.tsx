import { useState, useRef, useEffect } from "react";
import { Upload, FileText } from "lucide-react";

interface ExportMenuProps {
  onExportCurrent: () => Promise<void>;
  onExportAll: () => Promise<void>;
  hasActivePdf: boolean;
  hasPdfs: boolean;
}

export function ExportMenu({
  onExportCurrent,
  onExportAll,
  hasActivePdf,
  hasPdfs,
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  async function handleExport(fn: () => Promise<void>) {
    setIsExporting(true);
    try {
      await fn();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={!hasPdfs || isExporting}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium
          bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Upload className="h-3.5 w-3.5" />
        Export
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-stone-200 py-1 z-50">
          <button
            onClick={() => handleExport(onExportCurrent)}
            disabled={!hasActivePdf}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-stone-700 hover:bg-stone-50
              cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileText className="h-4 w-4 text-stone-400" />
            <div className="text-left">
              <div className="font-medium text-xs">Current PDF</div>
              <div className="text-xs text-stone-400">
                Export with annotations
              </div>
            </div>
          </button>
          <button
            onClick={() => handleExport(onExportAll)}
            disabled={!hasPdfs}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-stone-700 hover:bg-stone-50
              cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Upload className="h-4 w-4 text-stone-400" />
            <div className="text-left">
              <div className="font-medium text-xs">All PDFs</div>
              <div className="text-xs text-stone-400">
                Export all sequentially
              </div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
