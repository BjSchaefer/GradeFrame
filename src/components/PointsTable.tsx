import { useState, useRef, useCallback } from "react";
import type { PointsTableConfig } from "@/lib/types";

interface PointsTableProps {
  tasks: { label: string; points: number }[];
  config: PointsTableConfig;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onUpdateConfig: (config: PointsTableConfig) => void;
}

export function PointsTable({
  tasks,
  config,
  containerRef,
  onUpdateConfig,
}: PointsTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [dragConfig, setDragConfig] = useState<PointsTableConfig | null>(null);
  const displayConfig = dragConfig ?? config;

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      const startMouseX = e.clientX;
      const startMouseY = e.clientY;
      const startX = config.x;
      const startY = config.y;
      const currentScale = config.scale;

      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";

      function onMove(ev: MouseEvent) {
        const rect = container!.getBoundingClientRect();
        const dx = ((ev.clientX - startMouseX) / rect.width) * 100;
        const dy = ((ev.clientY - startMouseY) / rect.height) * 100;
        setDragConfig({
          x: Math.max(0, Math.min(90, startX + dx)),
          y: Math.max(0, Math.min(90, startY + dy)),
          scale: currentScale,
        });
      }

      function onUp() {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        setDragConfig((prev) => {
          if (prev) onUpdateConfig(prev);
          return null;
        });
      }

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [containerRef, config, onUpdateConfig]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const tableEl = tableRef.current;
      if (!tableEl) return;

      const tableRect = tableEl.getBoundingClientRect();
      const startDist = Math.hypot(
        e.clientX - tableRect.left,
        e.clientY - tableRect.top
      );
      const startScale = config.scale;
      const currentX = config.x;
      const currentY = config.y;

      if (startDist === 0) return;

      document.body.style.cursor = "nwse-resize";
      document.body.style.userSelect = "none";

      function onMove(ev: MouseEvent) {
        const dist = Math.hypot(
          ev.clientX - tableRect.left,
          ev.clientY - tableRect.top
        );
        const newScale = Math.max(
          0.5,
          Math.min(3, startScale * (dist / startDist))
        );
        setDragConfig({
          x: currentX,
          y: currentY,
          scale: Math.round(newScale * 100) / 100,
        });
      }

      function onUp() {
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        setDragConfig((prev) => {
          if (prev) onUpdateConfig(prev);
          return null;
        });
      }

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [config, onUpdateConfig]
  );

  if (tasks.length === 0) return null;

  return (
    <div
      ref={tableRef}
      className="absolute z-10 group"
      style={{
        left: `${displayConfig.x}%`,
        top: `${displayConfig.y}%`,
        transform: `scale(${displayConfig.scale})`,
        transformOrigin: "top left",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        onMouseDown={handleDragStart}
        className="cursor-grab active:cursor-grabbing"
      >
        <table className="border-collapse border-2 border-red-500 bg-white shadow-lg">
          <thead>
            <tr className="bg-red-500">
              {tasks.map((t, i) => (
                <th
                  key={i}
                  className="px-3 py-1.5 text-xs font-bold text-white border border-red-400 whitespace-nowrap"
                >
                  {t.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {tasks.map((t, i) => (
                <td
                  key={i}
                  className="px-3 py-1.5 text-xs font-bold font-mono text-red-700 border border-red-300 text-center whitespace-nowrap"
                >
                  {t.points}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-red-500 rounded-sm cursor-nwse-resize
          opacity-0 group-hover:opacity-100 transition-opacity"
        title="Drag to resize"
      />
    </div>
  );
}
