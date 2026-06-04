import { useCallback, useMemo, useState } from "react";

import {
  buildFields,
  createEmptyRow,
  getDefaultSeriesChartType,
  getInitialEditorState,
  rowsToChartData,
  type ChartDataField,
  type ChartDataRow,
} from "./schemas";
import {
  type ChartDataMode,
  type ChartDataType,
  type SeriesChartType,
} from "./types";

function toNumber(value: string | number): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toCellValue(
  field: ChartDataField,
  value: string | number,
): string | number {
  return field.type === "number" ? toNumber(value) : String(value);
}

export function useChartEditor(
  initialData: ChartDataType,
  chartType: ChartDataMode,
  initialSeriesChartTypes?: Record<string, SeriesChartType>,
) {
  const initialState = useMemo(
    () => getInitialEditorState(initialData, chartType),
    [chartType, initialData],
  );
  const [rows, setRows] = useState<ChartDataRow[]>(initialState.rows);
  const [labelKey] = useState(initialState.labelKey);
  const [seriesNames, setSeriesNames] = useState<string[]>(
    initialState.seriesNames,
  );
  const [seriesChartTypes, setSeriesChartTypes] = useState<
    Record<string, SeriesChartType>
  >(() => {
    if (
      initialSeriesChartTypes &&
      Object.keys(initialSeriesChartTypes).length > 0
    ) {
      return initialSeriesChartTypes;
    }

    return initialState.seriesNames.reduce<Record<string, SeriesChartType>>(
      (types, seriesName, index) => {
        types[seriesName] = getDefaultSeriesChartType(index);
        return types;
      },
      {},
    );
  });
  const [focusedCell, setFocusedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);

  const hasZColumn =
    initialState.schema.mode === "xyz" ||
    rows.some((row) => typeof row.z === "number");

  const fields = useMemo(
    () => buildFields(initialState.schema, labelKey, seriesNames, hasZColumn),
    [hasZColumn, initialState.schema, labelKey, seriesNames],
  );

  const data = useMemo(() => rowsToChartData(rows), [rows]);

  const updateCell = useCallback(
    (rowIndex: number, fieldKey: string, value: string | number) => {
      const field = fields.find((candidate) => candidate.key === fieldKey);
      if (!field) return;

      setRows((currentRows) =>
        currentRows.map((row, index) =>
          index === rowIndex
            ? { ...row, [fieldKey]: toCellValue(field, value) }
            : row,
        ),
      );
    },
    [fields],
  );

  const addRow = useCallback(() => {
    setRows((currentRows) => [...currentRows, createEmptyRow(fields)]);
  }, [fields]);

  const removeRow = useCallback((index: number) => {
    setRows((currentRows) =>
      currentRows.length <= 1
        ? currentRows
        : currentRows.filter((_, rowIndex) => rowIndex !== index),
    );
  }, []);

  const addSeries = useCallback(() => {
    const newSeriesName = `Series ${seriesNames.length + 1}`;
    const nextSeriesNames = [...seriesNames, newSeriesName];
    setSeriesNames(nextSeriesNames);
    setRows((currentRows) =>
      currentRows.map((row) => ({
        ...row,
        [newSeriesName]: 0,
      })),
    );
    setSeriesChartTypes((currentTypes) => ({
      ...currentTypes,
      [newSeriesName]: getDefaultSeriesChartType(seriesNames.length),
    }));
  }, [seriesNames]);

  const removeSeries = useCallback(
    (seriesName: string) => {
      if (seriesNames.length <= 1) return;

      setSeriesNames((currentNames) =>
        currentNames.filter((name) => name !== seriesName),
      );
      setRows((currentRows) =>
        currentRows.map((row) => {
          const { [seriesName]: _removed, ...rest } = row;
          return rest;
        }),
      );
      setSeriesChartTypes((currentTypes) => {
        const { [seriesName]: _removed, ...rest } = currentTypes;
        return rest;
      });
    },
    [seriesNames.length],
  );

  const renameSeries = useCallback(
    (oldName: string, newName: string) => {
      const trimmedName = newName.trim();
      if (!trimmedName || trimmedName === oldName) return;
      if (seriesNames.includes(trimmedName)) return;

      setSeriesNames((currentNames) =>
        currentNames.map((name) => (name === oldName ? trimmedName : name)),
      );
      setRows((currentRows) =>
        currentRows.map((row) => {
          const { [oldName]: value, ...rest } = row;
          return { ...rest, [trimmedName]: value ?? 0 };
        }),
      );
      setSeriesChartTypes((currentTypes) => {
        const { [oldName]: chartTypeForSeries, ...rest } = currentTypes;
        return {
          ...rest,
          [trimmedName]: chartTypeForSeries ?? "bar",
        };
      });
    },
    [seriesNames],
  );

  const updateSeriesChartType = useCallback(
    (seriesName: string, newChartType: SeriesChartType) => {
      setSeriesChartTypes((currentTypes) => ({
        ...currentTypes,
        [seriesName]: newChartType,
      }));
    },
    [],
  );

  const addZColumn = useCallback(() => {
    setRows((currentRows) =>
      currentRows.map((row) => ({
        ...row,
        z: typeof row.z === "number" ? row.z : 10,
      })),
    );
  }, []);

  const removeZColumn = useCallback(() => {
    if (initialState.schema.mode === "xyz") return;

    setRows((currentRows) =>
      currentRows.map((row) => {
        const { z: _removed, ...rest } = row;
        return rest;
      }),
    );
  }, [initialState.schema.mode]);

  return {
    data: data as ChartDataType,
    rows,
    fields,
    schema: initialState.schema,
    seriesNames,
    seriesChartTypes,
    focusedCell,
    setFocusedCell,
    updateCell,
    addRow,
    removeRow,
    addSeries,
    removeSeries,
    renameSeries,
    updateSeriesChartType,
    addZColumn,
    removeZColumn,
    hasZColumn,
    labelKey,
  };
}
