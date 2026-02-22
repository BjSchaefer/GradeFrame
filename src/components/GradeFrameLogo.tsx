import tauriIcon from "../../src-tauri/icons/128x128.png";

interface GradeFrameLogoProps {
  iconOnly?: boolean;
  size?: "sm" | "lg";
}

export function GradeFrameLogo({
  iconOnly = false,
  size = "sm",
}: GradeFrameLogoProps) {
  if (iconOnly) {
    const cls = size === "lg" ? "h-8 w-8" : "h-4 w-4";
    return <img src={tauriIcon} alt="GradeFrame" className={cls} />;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center">
        <img src={tauriIcon} alt="GradeFrame" className="h-7 w-7 rounded-lg" />
      </div>
      <span className="text-sm font-bold tracking-tight text-stone-800">
        GradeFrame
      </span>
    </div>
  );
}
