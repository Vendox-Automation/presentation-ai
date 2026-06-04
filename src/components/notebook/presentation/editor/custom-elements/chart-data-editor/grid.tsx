import type React from "react";
import { useCallback, useEffect, useRef } from "react";

import { GridHeader } from "./grid-header";
import { GridRow } from "./grid-row";
import {
  type ChartDataField,
  type ChartDataRow,
  type ChartEditorSchema,
} from "./schemas";
import { type ChartDataType, type SeriesChartType } from "./types";

const EMPTY_SERIES_CHART_TYPES: Record<string, SeriesChartType> = {};

interface GridProps {
  data: ChartDataType;
  fields: ChartDataField[];
  schema: ChartEditorSchema;
  seriesNames: string[];
  focusedCell: { row: number; col: number } | null;
  onUpdateCell: (rowIndex: number, field: string, value: string) => void;
  onRemoveRow: (rowIndex: number) => void;
  onRenameSeries: (oldName: string, newName: string) => void;
  onRemoveSeries: (name: string) => void;
  onAddRow: () => void;
  onFocusCell: (row: number, col: number) => void;
  setFocusedCell: (cell: { row: number; col: number } | null) => void;
  seriesChartTypes?: Record<string, SeriesChartType>;
  onSeriesChartTypeChange?: (
    seriesName: string,
    chartType: SeriesChartType,
  ) => void;
  isComposedChart?: boolean;
  labelKey?: string;
}

function toRows(data: ChartDataType): ChartDataRow[] {
  return Array.isArray(data) ? (data as ChartDataRow[]) : [];
}

export function Grid({
  data,
  fields,
  schema,
  seriesNames,
  focusedCell,
  onUpdateCell,
  onRemoveRow,
  onRenameSeries,
  onRemoveSeries,
  onAddRow,
  onFocusCell,
  setFocusedCell,
  seriesChartTypes = EMPTY_SERIES_CHART_TYPES,
  onSeriesChartTypeChange,
  isComposedChart = false,
}: GridProps) {
  const cellRefs = useRef<Map<string, HTMLInputElement> | null>(null);
  if (!cellRefs.current) {
    cellRefs.current = new Map();
  }
  const cellRefsCurrent = cellRefs.current;
  const rows = toRows(data);

  const registerCell = useCallback(
    (row: number, col: number, el: HTMLInputElement | null) => {
      const key = `${row}-${col}`;
      if (el) {
        cellRefsCurrent.set(key, el);
      } else {
        cellRefsCurrent.delete(key);
      }
    },
    [],
  );

  const focusCellElement = useCallback((row: number, col: number) => {
    const key = `${row}-${col}`;
    const cell = cellRefsCurrent.get(key);
    if (cell) {
      cell.focus();
      cell.select();
    }
  }, []);

  useEffect(() => {
    if (focusedCell) {
      focusCellElement(focusedCell.row, focusedCell.col);
    }
  }, [focusedCell, focusCellElement]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
      const totalCols = fields.length;
      const totalRows = rows.length;

      switch (e.key) {
        case "Tab":
          e.preventDefault();
          if (e.shiftKey) {
            if (col > 0) {
              onFocusCell(row, col - 1);
            } else if (row > 0) {
              onFocusCell(row - 1, totalCols - 1);
            }
          } else if (col < totalCols - 1) {
            onFocusCell(row, col + 1);
          } else if (row < totalRows - 1) {
            onFocusCell(row + 1, 0);
          } else {
            onAddRow();
            setTimeout(() => onFocusCell(totalRows, 0), 50);
          }
          break;

        case "Enter":
          e.preventDefault();
          if (row < totalRows - 1) {
            onFocusCell(row + 1, col);
          } else {
            onAddRow();
            setTimeout(() => onFocusCell(totalRows, col), 50);
          }
          break;

        case "ArrowUp":
          e.preventDefault();
          if (row > 0) onFocusCell(row - 1, col);
          break;

        case "ArrowDown":
          e.preventDefault();
          if (row < totalRows - 1) onFocusCell(row + 1, col);
          break;

        case "ArrowLeft":
          if (e.currentTarget.selectionStart === 0) {
            e.preventDefault();
            if (col > 0) onFocusCell(row, col - 1);
          }
          break;

        case "ArrowRight":
          if (e.currentTarget.selectionStart === e.currentTarget.value.length) {
            e.preventDefault();
            if (col < totalCols - 1) onFocusCell(row, col + 1);
          }
          break;
      }
    },
    [fields.length, rows.length, onFocusCell, onAddRow],
  );

  return (
    <div className="overflow-hidden rounded-md border border-border bg-background">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <GridHeader
            fields={fields}
            schema={schema}
            seriesNames={seriesNames}
            onRenameSeries={onRenameSeries}
            onRemoveSeries={onRemoveSeries}
            seriesChartTypes={seriesChartTypes}
            onSeriesChartTypeChange={onSeriesChartTypeChange}
            isComposedChart={isComposedChart}
          />
          <tbody>
            {rows.map((row, rowIndex) => (
              <GridRow
                key={rowIndex}
                row={row}
                fields={fields}
                rowIndex={rowIndex}
                focusedCol={
                  focusedCell?.row === rowIndex ? focusedCell.col : null
                }
                canDelete={rows.length > 1}
                onUpdateCell={(field, value) =>
                  onUpdateCell(rowIndex, field, value)
                }
                onRemoveRow={() => onRemoveRow(rowIndex)}
                onKeyDown={(e, col) => handleKeyDown(e, rowIndex, col)}
                onFocus={(col) => setFocusedCell({ row: rowIndex, col })}
                registerCell={(col, el) => registerCell(rowIndex, col, el)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
