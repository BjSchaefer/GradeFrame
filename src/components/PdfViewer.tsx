import { useRef, useEffect, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import { Eye, EyeOff, MessageCircle, Trash2 } from "lucide-react";
import type { Annotation, ActiveStamp } from "@/lib/types";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

interface PdfViewerProps {
  pdfPath: string;
  annotations: Annotation[];
  showAnnotations: boolean;
  activeStamp: ActiveStamp | null;
  activeTaskId: string | null;
  isManualMode: boolean;
  onToggleAnnotations: () => void;
  onPageClick: (page: number, x: number, y: number) => void;
  onDeleteAnnotation: (id: string) => void;
}

export function PdfViewer({
  pdfPath,
  annotations,
  showAnnotations,
  activeStamp,
  activeTaskId,
  isManualMode,
  onToggleAnnotations,
  onPageClick,
  onDeleteAnnotation,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hoveredAnnotation, setHoveredAnnotation] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load PDF
  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        // In Tauri, we read the file and convert to data URL
        const { readFile } = await import("@tauri-apps/plugin-fs");
        const bytes = await readFile(pdfPath);
        const doc = await pdfjsLib.getDocument({ data: bytes }).promise;
        if (!cancelled) {
          setPdfDoc(doc);
          setTotalPages(doc.numPages);
          setCurrentPage(1);
        }
      } catch (err) {
        console.error("Failed to load PDF:", err);
      }
    }

    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [pdfPath]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let cancelled = false;

    async function renderPage() {
      const page = await pdfDoc!.getPage(currentPage);
      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      const canvas = canvasRef.current!;
      const context = canvas.getContext("2d")!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport,
      };

      if (!cancelled) {
        await page.render(renderContext).promise;
      }
    }

    renderPage();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, currentPage]);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!activeStamp || !activeTaskId || isManualMode) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      onPageClick(currentPage, x, y);
    },
    [activeStamp, activeTaskId, isManualMode, currentPage, onPageClick]
  );

  const filename = pdfPath.split("/").pop() || pdfPath;
  const pageAnnotations = annotations.filter((a) => a.page === currentPage);
  const canPlace = activeStamp && !isManualMode;

  return (
    <div className="flex-1 overflow-auto bg-stone-200 relative">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-stone-200/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-stone-500">{filename}</span>
          <span className="text-xs text-stone-400">
            — Page {currentPage} / {totalPages}
          </span>
          {totalPages > 1 && (
            <div className="flex gap-1 ml-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-2 py-0.5 text-xs bg-white/70 rounded disabled:opacity-30 cursor-pointer"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-2 py-0.5 text-xs bg-white/70 rounded disabled:opacity-30 cursor-pointer"
              >
                →
              </button>
            </div>
          )}
        </div>
        <button
          onClick={onToggleAnnotations}
          className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-700
            transition-colors cursor-pointer bg-white/70 px-2.5 py-1 rounded-md"
        >
          {showAnnotations ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
          {showAnnotations ? "Hide annotations" : "Show annotations"}
        </button>
      </div>

      {/* PDF Canvas */}
      <div className="flex justify-center py-4 px-4">
        <div className="relative pdf-page-shadow">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className={`bg-white rounded-sm ${canPlace ? "cursor-crosshair" : "cursor-default"}`}
          />

          {/* Annotation overlays */}
          {showAnnotations &&
            pageAnnotations.map((ann) => (
              <div
                key={ann.id}
                className="absolute group"
                style={{
                  left: `${ann.x}%`,
                  top: `${ann.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg shadow-lg text-xs font-bold whitespace-nowrap
                    ${ann.points >= 0 ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}
                  onMouseEnter={() => setHoveredAnnotation(ann.id)}
                  onMouseLeave={() => setHoveredAnnotation(null)}
                >
                  {ann.isPointStamp ? (
                    <span className="font-mono">
                      {ann.points > 0 ? "+" : ""}
                      {ann.points}
                    </span>
                  ) : (
                    <>
                      <span>{ann.label}</span>
                      {ann.points !== 0 && (
                        <span className="opacity-70 font-mono ml-0.5">
                          {ann.points > 0 ? "+" : ""}
                          {ann.points}
                        </span>
                      )}
                    </>
                  )}
                  {ann.description && (
                    <MessageCircle className="h-3 w-3 ml-0.5 opacity-70" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAnnotation(ann.id);
                    }}
                    className="ml-1 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/20
                      transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                {/* Tooltip */}
                {hoveredAnnotation === ann.id && ann.description && (
                  <div
                    className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-20
                      bg-stone-800 text-white text-xs px-3 py-2 rounded-lg shadow-xl max-w-xs"
                    style={{ whiteSpace: "normal" }}
                  >
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-stone-800" />
                    <div className="font-semibold mb-0.5">{ann.label}</div>
                    <div className="text-stone-300">{ann.description}</div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
