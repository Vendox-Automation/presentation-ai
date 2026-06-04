import { keyToLabel } from "../chart-utils";
import { EditableHeader } from "./editable-header";
import { type ChartDataField, type ChartEditorSchema } from "./schemas";
import { type SeriesChartType } from "./types";

const EMPTY_SERIES_CHART_TYPES: Record<string, SeriesChartType> = {};

interface GridHeaderProps {
  fields: ChartDataField[];
  schema: ChartEditorSchema;
  seriesNames: string[];
  onRenameSeries: (oldName: string, newName: string) => void;
  onRemoveSeries: (name: string) => void;
  seriesChartTypes?: Record<string, SeriesChartType>;
  onSeriesChartTypeChange?: (
    seriesName: string,
    chartType: SeriesChartType,
  ) => void;
  isComposedChart?: boolean;
}

export function GridHeader({
  fields,
  schema,
  seriesNames,
  onRenameSeries,
  onRemoveSeries,
  seriesChartTypes = EMPTY_SERIES_CHART_TYPES,
  onSeriesChartTypeChange,
  isComposedChart = false,
}: GridHeaderProps) {
  return (
    <thead className="sticky top-0 z-10">
      <tr className="border-b-2 border-border bg-muted/60">
        <th className="h-8 w-10 border-r border-border bg-muted/80 text-center text-xs font-semibold text-muted-foreground">
          #
        </th>

        {fields.map((field) => (
          <th
            key={field.key}
            className="h-8 min-w-28 border-r border-border px-2 text-left text-xs font-semibold last:border-r-0"
          >
            {field.editableHeader ? (
              <EditableHeader
                value={field.key}
                onRename={(newName) => onRenameSeries(field.key, newName)}
                onRemove={() => onRemoveSeries(field.key)}
                canRemove={seriesNames.length > 1}
                colorIndex={field.colorIndex ?? 0}
                chartType={seriesChartTypes[field.key] ?? "bar"}
                onChartTypeChange={
                  onSeriesChartTypeChange
                    ? (type) => onSeriesChartTypeChange(field.key, type)
                    : undefined
                }
                showChartTypePicker={isComposedChart}
              />
            ) : (
              <span>{keyToLabel(field.label)}</span>
            )}
          </th>
        ))}

        <th className="h-8 w-10 border-l border-border bg-muted/80">
          <span className="sr-only">Delete row</span>
        </th>
      </tr>
      {schema.mode === "hierarchical" && (
        <tr className="border-b border-border bg-muted/30 text-[11px] text-muted-foreground">
          <td
            aria-label="Hierarchy indicator"
            className="border-r border-border"
          />
          <td className="px-2 py-1" colSpan={fields.length + 1}>
            Parent values must match another row's Name exactly.
          </td>
        </tr>
      )}
    </thead>
  );
}
