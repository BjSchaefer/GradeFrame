import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import type { CommentStamp } from "@/lib/types";

interface NewCommentModalProps {
  sign: "positive" | "negative";
  onAdd: (stamp: CommentStamp) => void;
  onClose: () => void;
}

export function NewCommentModal({ sign, onAdd, onClose }: NewCommentModalProps) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("1");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit() {
    if (!label.trim()) return;
    const p = points === "" ? 1 : parseFloat(points);
    const finalPoints = isNaN(p)
      ? sign === "negative"
        ? -1
        : 1
      : sign === "negative"
        ? -Math.abs(p || 1)
        : Math.abs(p || 1);

    onAdd({
      id: `cs${Date.now()}`,
      label: label.trim(),
      description: description.trim(),
      points: finalPoints,
      sign,
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") onClose();
  }

  const isNeg = sign === "negative";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-96 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`px-5 py-3 flex items-center justify-between ${
            isNeg
              ? "bg-red-50 border-b border-red-100"
              : "bg-emerald-50 border-b border-emerald-100"
          }`}
        >
          <h3
            className={`text-sm font-bold ${
              isNeg ? "text-red-700" : "text-emerald-700"
            }`}
          >
            New {isNeg ? "Negative" : "Positive"} Comment
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4 text-stone-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">
              Title *
            </label>
            <input
              ref={inputRef}
              type="text"
              placeholder="e.g. Correct, Missing semicolon…"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-stone-50
                focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">
              Description{" "}
              <span className="text-stone-300">(optional)</span>
            </label>
            <textarea
              placeholder="Detailed feedback…"
              value={description}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-stone-50
                focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">
              Points{" "}
              <span className="text-stone-300">
                (default: {isNeg ? "−1" : "+1"})
              </span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              placeholder="1"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-200 bg-stone-50 font-mono
                focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
            />
            <p className="text-xs text-stone-400 mt-1">
              Sign is automatic:{" "}
              {isNeg ? (
                <span className="text-red-500 font-semibold">− negative</span>
              ) : (
                <span className="text-emerald-500 font-semibold">
                  + positive
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-100 flex gap-2 justify-end bg-stone-50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!label.trim()}
            className={`px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer
              disabled:opacity-40 disabled:cursor-not-allowed
              ${
                isNeg
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-emerald-500 hover:bg-emerald-600"
              }`}
          >
            Create Stamp
          </button>
        </div>
      </div>
    </div>
  );
}
