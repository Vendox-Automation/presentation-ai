import { Plus, X } from "lucide-react";

import { type ChartEditorSchema } from "./schemas";

interface ToolbarProps {
  schema: ChartEditorSchema;
  rowCount: number;
  seriesCount: number;
  hasZColumn: boolean;
  onAddRow: () => void;
  onAddSeries: () => void;
  onAddZColumn: () => void;
  onRemoveZColumn: () => void;
}

export function Toolbar({
  schema,
  rowCount,
  seriesCount,
  hasZColumn,
  onAddRow,
  onAddSeries,
  onAddZColumn,
  onRemoveZColumn,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-3 py-2">
      <div className="flex min-w-0 items-center gap-3 text-xs text-muted-foreground">
        <span className="shrink-0 tabular-nums">{rowCount} rows</span>
        {schema.supportsSeries && (
          <>
            <span className="shrink-0 text-border">/</span>
            <span className="shrink-0 tabular-nums">{seriesCount} series</span>
          </>
        )}
        <span className="hidden min-w-0 truncate text-muted-foreground/80 md:inline">
          {schema.description}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {schema.mode === "xy" && (
          <button
            onClick={hasZColumn ? onRemoveZColumn : onAddZColumn}
            className="flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors hover:bg-accent"
            type="button"
          >
            {hasZColumn ? (
              <>
                <X className="size-3.5" />
                <span>Remove Z</span>
              </>
            ) : (
              <>
                <Plus className="size-3.5" />
                <span>Add Z</span>
              </>
            )}
          </button>
        )}

        {schema.supportsSeries && (
          <button
            onClick={onAddSeries}
            className="flex h-7 items-center gap-1.5 rounded px-2.5 text-xs font-medium transition-colors hover:bg-accent"
            type="button"
          >
            <Plus className="size-3.5" />
            <span>Add Series</span>
          </button>
        )}

        <div className="mx-1 h-4 w-px bg-border" />

        <button
          onClick={onAddRow}
          className="flex h-7 items-center gap-1.5 rounded bg-primary/10 px-2.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          type="button"
        >
          <Plus className="size-3.5" />
          <span>Add Row</span>
        </button>
      </div>
    </div>
  );
}
