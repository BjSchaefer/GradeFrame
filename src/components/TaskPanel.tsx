import { useState, useRef, useEffect } from "react";
import { Settings, X, Plus } from "lucide-react";
import type { Task, CorrectionMode } from "@/lib/types";

interface TaskPanelProps {
  tasks: Task[];
  activeTaskId: string | null;
  activeFilename: string;
  displayPoints: Record<string, number>; // taskId → displayed points
  manualPoints: Record<string, number>; // `${filename}_${taskId}` → points
  totalDisplay: number;
  maxTotal: number;
  onSelectTask: (taskId: string) => void;
  onSetMode: (taskId: string, mode: CorrectionMode) => void;
  onSetManualPoints: (taskId: string, points: number) => void;
  onAddTask: (label: string, maxPoints: number) => void;
  onDeleteTask: (taskId: string) => void;
}

const MODE_LABELS: { key: CorrectionMode; label: string }[] = [
  { key: "additive", label: "Add" },
  { key: "subtractive", label: "Sub" },
  { key: "manual", label: "Manual" },
];

export function TaskPanel({
  tasks,
  activeTaskId,
  activeFilename,
  displayPoints,
  manualPoints,
  totalDisplay,
  maxTotal,
  onSelectTask,
  onSetMode,
  onSetManualPoints,
  onAddTask,
  onDeleteTask,
}: TaskPanelProps) {
  const [editing, setEditing] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const totalPct = maxTotal > 0 ? Math.max(0, Math.min(100, (totalDisplay / maxTotal) * 100)) : 0;

  return (
    <aside className="w-64 bg-white border-l border-stone-200 flex flex-col shrink-0 shadow-sm">
      {/* Header */}
      <div className="p-3 border-b border-stone-100 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
            Tasks
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">{activeFilename}</p>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            editing
              ? "bg-teal-100 text-teal-700"
              : "text-stone-400 hover:bg-stone-100"
          }`}
          title="Edit tasks"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1.5">
          {tasks.map((task) => {
            const isActive = task.id === activeTaskId;
            const display = displayPoints[task.id] ?? 0;
            const pct =
              task.maxPoints > 0
                ? Math.max(0, Math.min(100, (display / task.maxPoints) * 100))
                : 0;

            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                className={`p-2.5 rounded-lg cursor-pointer transition-all
                  ${
                    isActive
                      ? "bg-teal-50 ring-1 ring-teal-200"
                      : "hover:bg-stone-50"
                  }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1.5">
                    {editing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTask(task.id);
                        }}
                        className="p-0.5 rounded hover:bg-red-100 text-stone-300 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    <span
                      className={`text-xs font-medium ${
                        isActive ? "text-teal-800" : "text-stone-600"
                      }`}
                    >
                      {task.label}
                    </span>
                  </div>

                  {task.mode === "manual" ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="0"
                        max={task.maxPoints}
                        step="0.5"
                        value={
                          manualPoints[`${activeFilename}_${task.id}`] ?? ""
                        }
                        placeholder="0"
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          const v =
                            e.target.value === ""
                              ? 0
                              : Math.min(
                                  task.maxPoints,
                                  Math.max(
                                    0,
                                    parseFloat(e.target.value) || 0
                                  )
                                );
                          onSetManualPoints(task.id, v);
                        }}
                        className="w-12 text-right text-xs font-bold font-mono px-1.5 py-0.5 rounded border border-stone-200
                          focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent bg-white"
                      />
                      <span className="text-xs text-stone-400 font-mono">
                        / {task.maxPoints}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs font-bold font-mono text-stone-700">
                      {display} / {task.maxPoints}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300
                      ${
                        pct >= 80
                          ? "bg-emerald-400"
                          : pct >= 40
                            ? "bg-amber-400"
                            : pct > 0
                              ? "bg-red-400"
                              : "bg-stone-200"
                      }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Per-task mode selector */}
                {isActive && (
                  <div className="flex gap-0.5 bg-stone-100 rounded-md p-0.5 mt-1">
                    {MODE_LABELS.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetMode(task.id, key);
                        }}
                        className={`flex-1 text-xs py-1 rounded font-medium transition-all cursor-pointer
                          ${
                            task.mode === key
                              ? "bg-white text-stone-800 shadow-sm"
                              : "text-stone-400 hover:text-stone-600"
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Task / Create task (always visible when no tasks exist) */}
        {(editing || tasks.length === 0) && !showAddTask && (
          <button
            onClick={() => setShowAddTask(true)}
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium
              text-teal-600 hover:bg-teal-50 border border-dashed border-teal-300 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            {tasks.length === 0 ? "Create Task" : "Add Task"}
          </button>
        )}
        {showAddTask && (
          <AddTaskForm
            onAdd={(label, maxPoints) => {
              onAddTask(label, maxPoints);
              setShowAddTask(false);
            }}
            onCancel={() => setShowAddTask(false)}
          />
        )}
      </div>

      {/* Total */}
      <div className="p-3 border-t border-stone-200 bg-stone-50">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-stone-700">Total</span>
          <span className="text-lg font-bold font-mono text-stone-800">
            {totalDisplay}
            <span className="text-xs text-stone-400 font-normal">
              {" "}
              / {maxTotal}
            </span>
          </span>
        </div>
        <div className="h-2 bg-stone-200 rounded-full overflow-hidden mt-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 transition-all duration-300"
            style={{ width: `${totalPct}%` }}
          />
        </div>
      </div>
    </aside>
  );
}

// ─── Add Task Form ───────────────────────────────────────────
function AddTaskForm({
  onAdd,
  onCancel,
}: {
  onAdd: (label: string, maxPoints: number) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const [maxPoints, setMaxPoints] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  function handleSubmit() {
    if (!label.trim() || !maxPoints) return;
    onAdd(label.trim(), parseFloat(maxPoints));
  }

  return (
    <div className="mt-2 p-3 bg-stone-50 rounded-lg border border-stone-200">
      <div className="space-y-2">
        <input
          ref={ref}
          type="text"
          placeholder="Task name"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-stone-200 bg-white
            focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
        />
        <input
          type="number"
          placeholder="Max points"
          value={maxPoints}
          onChange={(e) => setMaxPoints(e.target.value)}
          step="0.5"
          min="0"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full px-2.5 py-1.5 text-xs rounded-md border border-stone-200 bg-white font-mono
            focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!label.trim() || !maxPoints}
            className="flex-1 text-xs py-1.5 rounded-md bg-teal-500 text-white font-medium
              hover:bg-teal-600 transition-colors cursor-pointer disabled:opacity-40"
          >
            Add
          </button>
          <button
            onClick={onCancel}
            className="flex-1 text-xs py-1.5 rounded-md bg-stone-200 text-stone-600 font-medium
              hover:bg-stone-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
