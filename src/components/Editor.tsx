import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Folder } from "lucide-react";
import { loadConfig, saveConfig, listPdfFiles } from "@/lib/config";
import { createAnnotatedPdf, downloadBlob } from "@/lib/pdfExport";
import { GradeFrameLogo } from "./GradeFrameLogo";
import { PdfTabBar } from "./PdfTabBar";
import { PdfViewer } from "./PdfViewer";
import { StampPalette } from "./StampPalette";
import { TaskPanel } from "./TaskPanel";
import { ExportMenu } from "./ExportMenu";
import type {
  ProjectConfig,
  Task,
  Annotation,
  CommentStamp,
  ActiveStamp,
  CorrectionMode,
  PdfFile,
} from "@/lib/types";

interface EditorProps {
  folderPath: string;
  onBack: () => void;
}

export function Editor({ folderPath, onBack }: EditorProps) {
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [activeFilename, setActiveFilename] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeStamp, setActiveStamp] = useState<ActiveStamp | null>(null);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [manualPoints, setManualPoints] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  // Load config and PDF list on mount
  useEffect(() => {
    async function init() {
      try {
        const [cfg, pdfNames] = await Promise.all([
          loadConfig(folderPath),
          listPdfFiles(folderPath),
        ]);

        setConfig(cfg);
        const pdfFiles = pdfNames.map((name) => ({
          filename: name,
          path: `${folderPath}/${name}`,
        }));
        setPdfs(pdfFiles);

        if (pdfFiles.length > 0) setActiveFilename(pdfFiles[0].filename);
        if (cfg.tasks.length > 0) setActiveTaskId(cfg.tasks[0].id);

        // Restore manual points from config
        const mp: Record<string, number> = {};
        for (const [filename, grading] of Object.entries(cfg.grading)) {
          for (const [taskId, points] of Object.entries(
            grading.manualPoints || {}
          )) {
            mp[`${filename}_${taskId}`] = points;
          }
        }
        setManualPoints(mp);
      } catch (err) {
        console.error("Failed to initialize editor:", err);
        setError(
          err instanceof Error ? err.message : "Failed to open folder."
        );
      }
    }

    init();
  }, [folderPath]);

  // Auto-save config on changes
  const persistConfig = useCallback(
    async (newConfig: ProjectConfig) => {
      setConfig(newConfig);
      try {
        await saveConfig(folderPath, newConfig);
      } catch (err) {
        console.error("Failed to save config:", err);
      }
    },
    [folderPath]
  );

  if (error) {
    return (
      <div className="h-screen bg-stone-100 flex flex-col">
        <header className="bg-white border-b border-stone-200 shrink-0 shadow-sm">
          <div className="flex items-center h-12 px-4">
            <GradeFrameLogo />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-red-600 text-sm font-medium mb-4">
              Could not open this folder. Please check that it exists and try
              again.
            </p>
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                bg-stone-200 text-stone-700 hover:bg-stone-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="h-screen bg-stone-100 flex flex-col">
        <header className="bg-white border-b border-stone-200 shrink-0 shadow-sm">
          <div className="flex items-center h-12 px-4">
            <GradeFrameLogo />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-stone-400 text-sm">Loading project…</p>
        </div>
      </div>
    );
  }

  const tasks = config.tasks;
  const stamps = config.stamps;
  const activeTask = tasks.find((t) => t.id === activeTaskId);
  const activeMode: CorrectionMode = activeTask?.mode || "additive";

  // Get annotations for active PDF
  const currentGrading = activeFilename
    ? config.grading[activeFilename]
    : null;
  const currentAnnotations = currentGrading?.annotations || [];

  // ─── Task operations ───────────────────────────────────────
  function addTask(label: string, maxPoints: number) {
    const id = `t${Date.now()}`;
    const newTask: Task = { id, label, maxPoints, mode: "additive" };
    persistConfig({ ...config!, tasks: [...config!.tasks, newTask] });
  }

  function deleteTask(taskId: string) {
    persistConfig({
      ...config!,
      tasks: config!.tasks.filter((t) => t.id !== taskId),
    });
    if (activeTaskId === taskId) {
      const remaining = config!.tasks.filter((t) => t.id !== taskId);
      setActiveTaskId(remaining.length > 0 ? remaining[0].id : null);
    }
  }

  function setTaskMode(taskId: string, mode: CorrectionMode) {
    persistConfig({
      ...config!,
      tasks: config!.tasks.map((t) =>
        t.id === taskId ? { ...t, mode } : t
      ),
    });
    if (mode === "manual") setActiveStamp(null);
  }

  // ─── Annotation operations ─────────────────────────────────
  function addAnnotation(page: number, x: number, y: number) {
    if (!activeStamp || !activeTaskId || !activeFilename) return;

    const ann: Annotation = {
      id: `a${Date.now()}`,
      taskId: activeTaskId,
      stampId: activeStamp.id,
      page,
      x,
      y,
      points: activeStamp.points,
      label:
        activeStamp.label ||
        `${activeStamp.points > 0 ? "+" : ""}${activeStamp.points}`,
      description: activeStamp.description || "",
      isPointStamp: !activeStamp.label,
    };

    const grading = { ...config!.grading };
    const existing = grading[activeFilename] || {
      annotations: [],
      manualPoints: {},
    };
    grading[activeFilename] = {
      ...existing,
      annotations: [...existing.annotations, ann],
    };

    persistConfig({ ...config!, grading });
  }

  function deleteAnnotation(id: string) {
    if (!activeFilename) return;
    const grading = { ...config!.grading };
    const existing = grading[activeFilename];
    if (!existing) return;
    grading[activeFilename] = {
      ...existing,
      annotations: existing.annotations.filter((a) => a.id !== id),
    };
    persistConfig({ ...config!, grading });
  }

  // ─── Stamp operations ──────────────────────────────────────
  function createStamp(stamp: CommentStamp) {
    persistConfig({ ...config!, stamps: [...config!.stamps, stamp] });
    setActiveStamp({
      id: stamp.id,
      points: stamp.points,
      label: stamp.label,
      description: stamp.description,
    });
  }

  // ─── Manual points ────────────────────────────────────────
  function handleSetManualPoints(taskId: string, points: number) {
    if (!activeFilename) return;
    const key = `${activeFilename}_${taskId}`;
    setManualPoints((prev) => ({ ...prev, [key]: points }));

    const grading = { ...config!.grading };
    const existing = grading[activeFilename] || {
      annotations: [],
      manualPoints: {},
    };
    grading[activeFilename] = {
      ...existing,
      manualPoints: { ...existing.manualPoints, [taskId]: points },
    };
    persistConfig({ ...config!, grading });
  }

  // ─── Points calculations ──────────────────────────────────
  function getDisplayPointsForTask(filename: string, task: Task): number {
    if (task.mode === "manual") {
      return manualPoints[`${filename}_${task.id}`] ?? 0;
    }
    const grading = config!.grading[filename];
    const earned = (grading?.annotations || [])
      .filter((a) => a.taskId === task.id)
      .reduce((s, a) => s + a.points, 0);
    if (task.mode === "subtractive")
      return Math.max(0, task.maxPoints + earned);
    return earned;
  }

  function getTotalDisplay(filename: string): number {
    return tasks.reduce(
      (s, t) => s + getDisplayPointsForTask(filename, t),
      0
    );
  }

  const maxTotal = tasks.reduce((s, t) => s + t.maxPoints, 0);

  // Points per task for current PDF
  const displayPoints: Record<string, number> = {};
  if (activeFilename) {
    tasks.forEach((t) => {
      displayPoints[t.id] = getDisplayPointsForTask(activeFilename, t);
    });
  }

  // Total per PDF for tab bar
  const totalPoints: Record<string, number> = {};
  pdfs.forEach((pdf) => {
    totalPoints[pdf.filename] = getTotalDisplay(pdf.filename);
  });

  // ─── Export ────────────────────────────────────────────────
  async function handleExportCurrent() {
    if (!activeFilename) return;
    const { readFile } = await import("@tauri-apps/plugin-fs");
    const { join } = await import("@tauri-apps/api/path");
    const fullPath = await join(folderPath, activeFilename);
    const pdfBytes = await readFile(fullPath);
    const grading = config!.grading[activeFilename];
    const result = await createAnnotatedPdf({
      pdfBytes,
      annotations: grading?.annotations || [],
      filename: activeFilename,
    });
    downloadBlob(result, activeFilename);
  }

  async function handleExportAll() {
    const { readFile } = await import("@tauri-apps/plugin-fs");
    const { join } = await import("@tauri-apps/api/path");
    for (const pdf of pdfs) {
      const fullPath = await join(folderPath, pdf.filename);
      const pdfBytes = await readFile(fullPath);
      const grading = config!.grading[pdf.filename];
      const result = await createAnnotatedPdf({
        pdfBytes,
        annotations: grading?.annotations || [],
        filename: pdf.filename,
      });
      downloadBlob(result, pdf.filename);
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  const activePdfPath = activeFilename
    ? `${folderPath}/${activeFilename}`
    : null;
  const folderName = folderPath.replace(/\\/g, "/").split("/").pop() || "";

  return (
    <div className="flex flex-col h-screen bg-stone-100">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 shrink-0 shadow-sm">
        <div className="flex items-center justify-between h-12 px-4">
          <div className="flex items-center gap-3">
            <GradeFrameLogo />
            <div className="w-px h-5 bg-stone-200" />
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <div className="w-px h-5 bg-stone-200" />
            <div className="flex items-center gap-1.5 text-xs text-stone-500">
              <Folder className="h-3.5 w-3.5 text-stone-400" />
              <span className="font-medium">{folderName}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {activeStamp && (
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  activeStamp.points >= 0
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-red-50 text-red-700 ring-1 ring-red-200"
                }`}
              >
                Stamp:{" "}
                {activeStamp.label ||
                  `${activeStamp.points > 0 ? "+" : ""}${activeStamp.points}`}
              </span>
            )}
            <ExportMenu
              onExportCurrent={handleExportCurrent}
              onExportAll={handleExportAll}
              hasActivePdf={!!activeFilename}
              hasPdfs={pdfs.length > 0}
            />
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <StampPalette
          stamps={stamps}
          activeStamp={activeStamp}
          activeMode={activeMode}
          activeTaskLabel={activeTask?.label || ""}
          onSelectStamp={setActiveStamp}
          onCreateStamp={createStamp}
        />

        {/* Center */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <PdfTabBar
            pdfs={pdfs}
            activeFilename={activeFilename}
            totalPoints={totalPoints}
            onSelect={setActiveFilename}
            onClose={(filename) => {
              setPdfs((prev) => prev.filter((p) => p.filename !== filename));
              if (activeFilename === filename) {
                const remaining = pdfs.filter(
                  (p) => p.filename !== filename
                );
                setActiveFilename(
                  remaining.length > 0 ? remaining[0].filename : null
                );
              }
            }}
          />

          {activePdfPath ? (
            <PdfViewer
              pdfPath={activePdfPath}
              annotations={currentAnnotations}
              showAnnotations={showAnnotations}
              activeStamp={activeStamp}
              activeTaskId={activeTaskId}
              isManualMode={activeMode === "manual"}
              onToggleAnnotations={() => setShowAnnotations(!showAnnotations)}
              onPageClick={addAnnotation}
              onDeleteAnnotation={deleteAnnotation}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-stone-200">
              <p className="text-stone-400 text-sm">No PDFs in this folder.</p>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <TaskPanel
          tasks={tasks}
          activeTaskId={activeTaskId}
          activeFilename={activeFilename || ""}
          displayPoints={displayPoints}
          manualPoints={manualPoints}
          totalDisplay={activeFilename ? getTotalDisplay(activeFilename) : 0}
          maxTotal={maxTotal}
          onSelectTask={setActiveTaskId}
          onSetMode={setTaskMode}
          onSetManualPoints={handleSetManualPoints}
          onAddTask={addTask}
          onDeleteTask={deleteTask}
        />
      </div>
    </div>
  );
}
