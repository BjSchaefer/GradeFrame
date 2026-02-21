import type { CommentStamp } from "@/lib/types";

interface CommentStampButtonProps {
  stamp: CommentStamp;
  active: boolean;
  onSelect: () => void;
}

export function CommentStampButton({
  stamp,
  active,
  onSelect,
}: CommentStampButtonProps) {
  const pos = stamp.points >= 0;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all cursor-pointer
        ${
          active
            ? pos
              ? "bg-emerald-50 ring-2 ring-emerald-300"
              : "bg-red-50 ring-2 ring-red-300"
            : "bg-stone-50 hover:bg-stone-100"
        }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div
            className={`font-semibold text-sm leading-tight ${
              active
                ? pos
                  ? "text-emerald-800"
                  : "text-red-800"
                : "text-stone-700"
            }`}
          >
            {stamp.label}
          </div>
          {stamp.description && (
            <div
              className="text-stone-400 mt-0.5 leading-snug"
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {stamp.description}
            </div>
          )}
        </div>
        {stamp.points !== 0 && (
          <span
            className={`shrink-0 text-xs font-bold font-mono px-1.5 py-0.5 rounded mt-0.5
              ${
                pos
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
          >
            {stamp.points > 0 ? "+" : ""}
            {stamp.points}
          </span>
        )}
      </div>
    </button>
  );
}
