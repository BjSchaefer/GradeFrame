import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Folder } from "lucide-react";
import { loadConfig, saveConfig, listPdfFiles } from "@/lib/config";
import {
  createAnnotatedPdf,
  savePdfToFolder,
  generateMarkdownReport,
  saveMarkdownReport,
  type ReportEntry,
} from "@/lib/pdfExport";
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
  PointsTableConfig,
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

  // Sidebar resize state
  const LEFT_MIN = 180;
  const LEFT_DEFAULT = 240;
  const RIGHT_MIN = 200;
  const RIGHT_DEFAULT = 256;
  const [leftWidth, setLeftWidth] = useState(LEFT_DEFAULT);
  const [rightWidth, setRightWidth] = useState(RIGHT_DEFAULT);
  const dragRef = useRef<{
    side: "left" | "right";
    startX: number;
    startW: number;
  } | null>(null);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current) return;
      const { side, startX, startW } = dragRef.current;
      const dx = e.clientX - startX;
      if (side === "left") {
        setLeftWidth(Math.max(LEFT_MIN, startW + dx));
      } else {
        setRightWidth(Math.max(RIGHT_MIN, startW - dx));
      }
    }
    function onMouseUp() {
      dragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "auto";
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  function startDrag(side: "left" | "right", e: React.MouseEvent) {
    e.preventDefault();
    dragRef.current = {
      side,
      startX: e.clientX,
      startW: side === "left" ? leftWidth : rightWidth,
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

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
  }

  // ─── Annotation operations ─────────────────────────────────
  function addAnnotation(page: number, x: number, y: number) {
    if (!activeStamp || !activeFilename) return;

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

    const deletedAnn = existing.annotations.find((a) => a.id === id);
    grading[activeFilename] = {
      ...existing,
      annotations: existing.annotations.filter((a) => a.id !== id),
    };

    // Remove comment stamp from sidebar if no annotations reference it anymore
    let updatedStamps = config!.stamps;
    if (deletedAnn && !deletedAnn.isPointStamp) {
      const stampId = deletedAnn.stampId;
      const stillUsed = Object.values(grading).some((g) =>
        g.annotations.some((a) => a.stampId === stampId)
      );
      if (!stillUsed) {
        updatedStamps = updatedStamps.filter((s) => s.id !== stampId);
      }
    }

    persistConfig({ ...config!, grading, stamps: updatedStamps });
  }

  function moveAnnotation(id: string, x: number, y: number) {
    if (!activeFilename) return;
    const grading = { ...config!.grading };
    const existing = grading[activeFilename];
    if (!existing) return;
    grading[activeFilename] = {
      ...existing,
      annotations: existing.annotations.map((a) =>
        a.id === id ? { ...a, x, y } : a
      ),
    };
    persistConfig({ ...config!, grading });
  }

  function updateAnnotation(id: string, updates: { label: string; description: string; points: number }) {
    if (!activeFilename) return;
    const grading = { ...config!.grading };
    const existing = grading[activeFilename];
    if (!existing) return;
    grading[activeFilename] = {
      ...existing,
      annotations: existing.annotations.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    };
    persistConfig({ ...config!, grading });
  }

  // ─── Stamp operations ──────────────────────────────────────
  function createStamp(stamp: CommentStamp) {
    const stampWithTask: CommentStamp = activeTaskId
      ? { ...stamp, taskId: activeTaskId }
      : stamp;
    persistConfig({ ...config!, stamps: [...config!.stamps, stampWithTask] });
    setActiveStamp({
      id: stampWithTask.id,
      points: stampWithTask.points,
      label: stampWithTask.label,
      description: stampWithTask.description,
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
    const annotations = (grading?.annotations || []).filter(
      (a) => a.taskId === task.id
    );
    if (task.mode === "subtractive") {
      const earned = annotations
        .filter((a) => a.points < 0)
        .reduce((s, a) => s + a.points, 0);
      return Math.max(0, task.maxPoints + earned);
    }
    const earned = annotations
      .filter((a) => a.points > 0)
      .reduce((s, a) => s + a.points, 0);
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

  // ─── Points table ─────────────────────────────────────────
  const taskPointsForTable = tasks.map((t) => ({
    label: t.label,
    points: displayPoints[t.id] ?? 0,
    maxPoints: t.maxPoints,
  }));

  const pointsTableConfig: PointsTableConfig = config.pointsTable ?? {
    x: 2,
    y: 2,
    scale: 1,
  };

  function handleUpdatePointsTable(tableConfig: PointsTableConfig) {
    persistConfig({ ...config!, pointsTable: tableConfig });
  }

  // ─── Export ────────────────────────────────────────────────
  async function handleExportCurrent() {
    if (!activeFilename) return;
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selectedDir = await open({
      directory: true,
      recursive: true,
      defaultPath: folderPath,
      title: "Select export folder",
    });
    if (!selectedDir) return;

    const { readFile } = await import("@tauri-apps/plugin-fs");
    const { join } = await import("@tauri-apps/api/path");
    const fullPath = await join(folderPath, activeFilename);
    const pdfBytes = await readFile(fullPath);
    const grading = config!.grading[activeFilename];
    const annotations = grading?.annotations || [];
    const result = await createAnnotatedPdf({
      pdfBytes,
      annotations,
      filename: activeFilename,
      pointsTable: tasks.length > 0 ? {
        tasks: tasks.map((t) => ({
          label: t.label,
          points: getDisplayPointsForTask(activeFilename, t),
          maxPoints: t.maxPoints,
        })),
        config: pointsTableConfig,
      } : undefined,
    });
    await savePdfToFolder(result, selectedDir, activeFilename);

    const report = generateMarkdownReport(
      [{ filename: activeFilename, annotations }],
      config!.tasks
    );
    await saveMarkdownReport(selectedDir, report);
  }

  async function handleExportAll() {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selectedDir = await open({
      directory: true,
      recursive: true,
      defaultPath: folderPath,
      title: "Select export folder",
    });
    if (!selectedDir) return;

    const { readFile } = await import("@tauri-apps/plugin-fs");
    const { join } = await import("@tauri-apps/api/path");

    const reportEntries: ReportEntry[] = [];
    for (const pdf of pdfs) {
      const fullPath = await join(folderPath, pdf.filename);
      const pdfBytes = await readFile(fullPath);
      const grading = config!.grading[pdf.filename];
      const annotations = grading?.annotations || [];
      const result = await createAnnotatedPdf({
        pdfBytes,
        annotations,
        filename: pdf.filename,
        pointsTable: tasks.length > 0 ? {
          tasks: tasks.map((t) => ({
            label: t.label,
            points: getDisplayPointsForTask(pdf.filename, t),
            maxPoints: t.maxPoints,
          })),
          config: pointsTableConfig,
        } : undefined,
      });
      await savePdfToFolder(result, selectedDir, pdf.filename);
      reportEntries.push({ filename: pdf.filename, annotations });
    }

    const report = generateMarkdownReport(reportEntries, config!.tasks);
    await saveMarkdownReport(selectedDir, report);
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
          activeTaskId={activeTaskId}
          activeTaskLabel={activeTask?.label ?? null}
          width={leftWidth}
          onSelectStamp={setActiveStamp}
          onCreateStamp={createStamp}
        />

        {/* Left resize handle */}
        <div
          className="w-1 cursor-col-resize bg-transparent hover:bg-teal-300 active:bg-teal-400 transition-colors shrink-0"
          onMouseDown={(e) => startDrag("left", e)}
        />

        {/* Center */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
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
              isManualMode={activeMode === "manual"}
              taskPoints={taskPointsForTable}
              pointsTableConfig={pointsTableConfig}
              onToggleAnnotations={() => setShowAnnotations(!showAnnotations)}
              onPageClick={addAnnotation}
              onDeleteAnnotation={deleteAnnotation}
              onMoveAnnotation={moveAnnotation}
              onUpdateAnnotation={updateAnnotation}
              onUpdatePointsTable={handleUpdatePointsTable}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-stone-200">
              <p className="text-stone-400 text-sm">No PDFs in this folder.</p>
            </div>
          )}
        </div>

        {/* Right resize handle */}
        <div
          className="w-1 cursor-col-resize bg-transparent hover:bg-teal-300 active:bg-teal-400 transition-colors shrink-0"
          onMouseDown={(e) => startDrag("right", e)}
        />

        {/* Right Sidebar */}
        <TaskPanel
          tasks={tasks}
          activeTaskId={activeTaskId}
          activeFilename={activeFilename || ""}
          displayPoints={displayPoints}
          manualPoints={manualPoints}
          totalDisplay={activeFilename ? getTotalDisplay(activeFilename) : 0}
          maxTotal={maxTotal}
          width={rightWidth}
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
