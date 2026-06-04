// font-step/components/CurrentFontDisplay.tsx
import { Plus } from "lucide-react";

interface CurrentFontDisplayProps {
  headingFont: string;
  bodyFont: string;
  showCustom: boolean;
  onToggleCustom: () => void;
}

export function CurrentFontDisplay({
  headingFont,
  bodyFont,
  onToggleCustom,
}: CurrentFontDisplayProps) {
  return (
    <div className="space-y-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase">
        Current Font
      </span>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="space-y-1">
          <div className="text-sm font-semibold text-foreground">
            {headingFont || "—"}
          </div>
          <div className="text-xs text-muted-foreground">{bodyFont || "—"}</div>
        </div>
        <button
          type="button"
          onClick={onToggleCustom}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-3.5" />
          Create New Pair
        </button>
      </div>
    </div>
  );
}
