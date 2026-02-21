import { useState } from "react";
import { Plus, Hash, Pencil } from "lucide-react";
import type { CommentStamp, ActiveStamp, CorrectionMode } from "@/lib/types";
import { CommentStampButton } from "./CommentStampButton";
import { NewCommentModal } from "./NewCommentModal";

interface StampPaletteProps {
  stamps: CommentStamp[];
  activeStamp: ActiveStamp | null;
  activeMode: CorrectionMode;
  activeTaskLabel: string;
  onSelectStamp: (stamp: ActiveStamp | null) => void;
  onCreateStamp: (stamp: CommentStamp) => void;
}

const FIXED_POINTS = [-2, -1, -0.5, 0.5, 1, 2];

export function StampPalette({
  stamps,
  activeStamp,
  activeMode,
  activeTaskLabel,
  onSelectStamp,
  onCreateStamp,
}: StampPaletteProps) {
  const [customPointInput, setCustomPointInput] = useState("");
  const [showNewCommentModal, setShowNewCommentModal] = useState<
    "positive" | "negative" | null
  >(null);

  const positiveComments = stamps.filter((s) => s.sign === "positive");
  const negativeComments = stamps.filter((s) => s.sign === "negative");

  function selectStamp(stamp: ActiveStamp) {
    if (activeMode === "manual") return;
    onSelectStamp(activeStamp?.id === stamp.id ? null : stamp);
  }

  function handleCustomPoint() {
    const val = parseFloat(customPointInput);
    if (isNaN(val) || val === 0) return;
    onSelectStamp({ id: `cp${Date.now()}`, points: val });
    setCustomPointInput("");
  }

  function handleCreateComment(data: CommentStamp) {
    onCreateStamp(data);
    setShowNewCommentModal(null);
    // Auto-select
    onSelectStamp({
      id: data.id,
      points: data.points,
      label: data.label,
      description: data.description,
    });
  }

  if (activeMode === "manual") {
    return (
      <aside className="w-60 bg-white border-r border-stone-200 flex flex-col shrink-0 shadow-sm">
        <div className="flex-1 overflow-y-auto p-3">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mt-1">
            <div className="flex items-center gap-2 mb-1.5">
              <Pencil className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-semibold text-amber-700">
                Manual Mode
              </span>
            </div>
            <p className="text-xs text-amber-600 leading-relaxed">
              Enter points for <strong>{activeTaskLabel}</strong> directly in the
              task panel on the right.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-60 bg-white border-r border-stone-200 flex flex-col shrink-0 shadow-sm">
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Point Stamps */}
        <div>
          <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 block">
            Points
          </label>
          <div className="flex flex-wrap gap-1.5">
            {FIXED_POINTS.map((pts) => {
              const id = `fp_${pts}`;
              const active = activeStamp?.id === id;
              const pos = pts >= 0;
              return (
                <button
                  key={id}
                  onClick={() => selectStamp({ id, points: pts })}
                  className={`px-2 py-1.5 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer
                    ${
                      active
                        ? pos
                          ? "bg-emerald-500 text-white ring-2 ring-emerald-300 shadow-md"
                          : "bg-red-500 text-white ring-2 ring-red-300 shadow-md"
                        : pos
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "bg-red-50 text-red-700 hover:bg-red-100"
                    }`}
                >
                  {pts > 0 ? "+" : ""}
                  {pts}
                </button>
              );
            })}
          </div>
          <div className="flex gap-1.5 mt-2">
            <div className="relative flex-1">
              <Hash className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-stone-300" />
              <input
                type="number"
                step="0.5"
                placeholder="Custom"
                value={customPointInput}
                onChange={(e) => setCustomPointInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCustomPoint()}
                className="w-full pl-7 pr-2 py-1.5 text-xs font-mono rounded-lg border border-stone-200 bg-stone-50
                  focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleCustomPoint}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-teal-500 text-white hover:bg-teal-600 transition-colors cursor-pointer"
            >
              Apply
            </button>
          </div>
        </div>

        {/* New Comment Buttons */}
        <div>
          <label className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2 block">
            New Comment
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNewCommentModal("negative")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold
                bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Negative
            </button>
            <button
              onClick={() => setShowNewCommentModal("positive")}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold
                bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Positive
            </button>
          </div>
        </div>

        {/* Positive Comments */}
        {positiveComments.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-2 block">
              Positive Comments
            </label>
            <div className="space-y-1.5">
              {positiveComments.map((stamp) => (
                <CommentStampButton
                  key={stamp.id}
                  stamp={stamp}
                  active={activeStamp?.id === stamp.id}
                  onSelect={() =>
                    selectStamp({
                      id: stamp.id,
                      points: stamp.points,
                      label: stamp.label,
                      description: stamp.description,
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Negative Comments */}
        {negativeComments.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2 block">
              Negative Comments
            </label>
            <div className="space-y-1.5">
              {negativeComments.map((stamp) => (
                <CommentStampButton
                  key={stamp.id}
                  stamp={stamp}
                  active={activeStamp?.id === stamp.id}
                  onSelect={() =>
                    selectStamp({
                      id: stamp.id,
                      points: stamp.points,
                      label: stamp.label,
                      description: stamp.description,
                    })
                  }
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showNewCommentModal && (
        <NewCommentModal
          sign={showNewCommentModal}
          onAdd={handleCreateComment}
          onClose={() => setShowNewCommentModal(null)}
        />
      )}
    </aside>
  );
}
