import { Trash2 } from "lucide-react";
import type React from "react";

import { cn } from "@/lib/utils";
import { GridCell } from "./grid-cell";
import { type ChartDataField, type ChartDataRow } from "./schemas";

interface GridRowProps {
  row: ChartDataRow;
  fields: ChartDataField[];
  rowIndex: number;
  focusedCol: number | null;
  canDelete: boolean;
  onUpdateCell: (field: string, value: string) => void;
  onRemoveRow: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, col: number) => void;
  onFocus: (col: number) => void;
  registerCell: (col: number, el: HTMLInputElement | null) => void;
}

export function GridRow({
  row,
  fields,
  rowIndex,
  focusedCol,
  canDelete,
  onUpdateCell,
  onRemoveRow,
  onKeyDown,
  onFocus,
  registerCell,
}: GridRowProps) {
  return (
    <tr
      className={cn(
        "border-b border-border transition-colors",
        focusedCol !== null && "bg-primary/5",
        rowIndex % 2 === 1 && focusedCol === null && "bg-muted/30",
      )}
    >
      <td className="h-8 w-10 border-r border-border bg-muted/40 text-center font-mono text-xs text-muted-foreground select-none">
        {rowIndex + 1}
      </td>

      {fields.map((field, colIndex) => (
        <td
          key={field.key}
          className="border-r border-border p-0 last:border-r-0"
        >
          <GridCell
            value={row[field.key] ?? (field.type === "number" ? 0 : "")}
            type={field.type}
            rowIndex={rowIndex}
            colIndex={colIndex}
            placeholder={
              field.placeholder ?? (field.type === "number" ? "0" : field.label)
            }
            onUpdate={(val) => onUpdateCell(field.key, val)}
            onKeyDown={(e) => onKeyDown(e, colIndex)}
            onFocus={() => onFocus(colIndex)}
            registerRef={(el) => registerCell(colIndex, el)}
            isFocused={focusedCol === colIndex}
          />
        </td>
      ))}

      <td className="h-8 w-10 border-l border-border bg-muted/20 text-center">
        <button
          onClick={onRemoveRow}
          disabled={!canDelete}
          className={cn(
            "mx-auto flex h-6 w-6 items-center justify-center rounded",
            "text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
            !canDelete && "cursor-not-allowed opacity-30",
          )}
          type="button"
        >
          <Trash2 className="size-3.5" />
          <span className="sr-only">Remove row</span>
        </button>
      </td>
    </tr>
  );
}
