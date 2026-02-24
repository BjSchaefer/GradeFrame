import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Annotation } from "@/lib/types";

interface EditAnnotationModalProps {
  annotation: Annotation;
  onSave: (id: string, updates: { label: string; description: string; points: number }) => void;
  onClose: () => void;
}

export function EditAnnotationModal({
  annotation,
  onSave,
  onClose,
}: EditAnnotationModalProps) {
  const [label, setLabel] = useState(annotation.label);
  const [description, setDescription] = useState(annotation.description);
  const [points, setPoints] = useState(String(annotation.points));
  const labelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    labelRef.current?.focus();
  }, []);

  function handleSubmit() {
    const p = parseFloat(points);
    if (isNaN(p)) return;
    onSave(annotation.id, { label: label.trim() || annotation.label, description: description.trim(), points: p });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-80 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-stone-700">
            Edit Annotation
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">
              Label
            </label>
            <input
              ref={labelRef}
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-stone-200 bg-white
                focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">
              Points
            </label>
            <input
              type="number"
              step="0.5"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-2.5 py-1.5 text-xs font-mono rounded-md border border-stone-200 bg-white
                focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-stone-500 mb-1 block">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-2.5 py-1.5 text-xs rounded-md border border-stone-200 bg-white resize-none
                focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSubmit}
              className="flex-1 text-xs py-1.5 rounded-md bg-teal-500 text-white font-medium
                hover:bg-teal-600 transition-colors cursor-pointer"
            >
              Save
            </button>
            <button
              onClick={onClose}
              className="flex-1 text-xs py-1.5 rounded-md bg-stone-200 text-stone-600 font-medium
                hover:bg-stone-300 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
