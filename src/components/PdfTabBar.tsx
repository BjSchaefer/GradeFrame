import { FileText, X } from "lucide-react";
import type { PdfFile } from "@/lib/types";

interface PdfTabBarProps {
  pdfs: PdfFile[];
  activeFilename: string | null;
  totalPoints: Record<string, number>; // filename → displayed total
  onSelect: (filename: string) => void;
  onClose: (filename: string) => void;
}

export function PdfTabBar({
  pdfs,
  activeFilename,
  totalPoints,
  onSelect,
  onClose,
}: PdfTabBarProps) {
  return (
    <div className="bg-white border-b border-stone-200 flex items-center shrink-0 overflow-x-auto">
      <div className="flex">
        {pdfs.map((pdf) => {
          const isActive = pdf.filename === activeFilename;
          const pts = totalPoints[pdf.filename] ?? 0;
          const hasPoints = pts !== 0;

          return (
            <button
              key={pdf.filename}
              onClick={() => onSelect(pdf.filename)}
              className={`group flex items-center gap-2 px-4 py-2.5 text-xs border-r border-stone-100
                transition-all cursor-pointer whitespace-nowrap relative
                ${
                  isActive
                    ? "bg-stone-50 text-stone-800 font-semibold"
                    : "text-stone-400 hover:bg-stone-50 hover:text-stone-600"
                }`}
            >
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500" />
              )}
              <FileText
                className={`h-3.5 w-3.5 ${isActive ? "text-teal-500" : "text-stone-300"}`}
              />
              <span>{pdf.filename.replace(".pdf", "")}</span>
              {hasPoints && (
                <span
                  className={`text-xs font-mono px-1 py-0.5 rounded ${
                    pts >= 0
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {pts}
                </span>
              )}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(pdf.filename);
                }}
                className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 rounded hover:bg-stone-200 transition-all"
              >
                <X className="h-3 w-3 text-stone-400" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
