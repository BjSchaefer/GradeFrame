import { LayoutGrid } from "lucide-react";

interface GradeFrameLogoProps {
  iconOnly?: boolean;
  size?: "sm" | "lg";
}

export function GradeFrameLogo({
  iconOnly = false,
  size = "sm",
}: GradeFrameLogoProps) {
  if (iconOnly) {
    const cls = size === "lg" ? "h-8 w-8 text-white" : "h-4 w-4 text-white";
    return <LayoutGrid className={cls} />;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
        <LayoutGrid className="h-4 w-4 text-white" />
      </div>
      <span className="text-sm font-bold tracking-tight text-stone-800">
        GradeFrame
      </span>
    </div>
  );
}
