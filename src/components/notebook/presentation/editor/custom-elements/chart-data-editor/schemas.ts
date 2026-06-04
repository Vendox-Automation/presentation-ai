import { getLabelKey } from "../chart-utils";
import {
  type ChartDataMode,
  type ChartDataType,
  type MultiSeriesData,
  type SeriesChartType,
} from "./types";

type ChartDataFieldType = "number" | "text";

export type ChartDataField = {
  key: string;
  label: string;
  type: ChartDataFieldType;
  placeholder?: string;
  editableHeader?: boolean;
  removable?: boolean;
  colorIndex?: number;
};

export type ChartDataRow = Record<string, string | number>;

export type ChartEditorSchema = {
  mode: ChartDataMode;
  description: string;
  fixedFields: ChartDataField[];
  supportsSeries: boolean;
  supportsZColumn: boolean;
  defaultRows: ChartDataRow[];
  defaultSeriesNames: string[];
};

const DEFAULT_CHART_TYPES: SeriesChartType[] = ["bar", "line", "area"];

const categoricalRows = [
  { label: "Q1 Revenue", value: 45200 },
  { label: "Q2 Revenue", value: 52800 },
  { label: "Q3 Revenue", value: 48100 },
  { label: "Q4 Revenue", value: 61400 },
];

const multiSeriesRows = [
  { label: "Jan", revenue: 4500, expenses: 3200, profit: 1300 },
  { label: "Feb", revenue: 5200, expenses: 3400, profit: 1800 },
  { label: "Mar", revenue: 4800, expenses: 3100, profit: 1700 },
  { label: "Apr", revenue: 6100, expenses: 3800, profit: 2300 },
];

const CHART_EDITOR_SCHEMAS: Record<ChartDataMode, ChartEditorSchema> = {
  categorical: {
    mode: "categorical",
    description: "Use one label column and one or more numeric series.",
    fixedFields: [{ key: "label", label: "Label", type: "text" }],
    supportsSeries: true,
    supportsZColumn: false,
    defaultRows: categoricalRows,
    defaultSeriesNames: ["value"],
  },
  "label-value": {
    mode: "label-value",
    description: "Use one label and one value for each slice or segment.",
    fixedFields: [{ key: "label", label: "Label", type: "text" }],
    supportsSeries: true,
    supportsZColumn: false,
    defaultRows: categoricalRows,
    defaultSeriesNames: ["value"],
  },
  "multi-series": {
    mode: "multi-series",
    description: "Use one category column with multiple numeric series.",
    fixedFields: [{ key: "label", label: "Category", type: "text" }],
    supportsSeries: true,
    supportsZColumn: false,
    defaultRows: multiSeriesRows,
    defaultSeriesNames: ["revenue", "expenses", "profit"],
  },
  xy: {
    mode: "xy",
    description: "Use numeric X and Y coordinates for each point.",
    fixedFields: [
      { key: "x", label: "X", type: "number" },
      { key: "y", label: "Y", type: "number" },
    ],
    supportsSeries: false,
    supportsZColumn: false,
    defaultRows: [
      { x: 10, y: 30 },
      { x: 25, y: 45 },
      { x: 40, y: 28 },
      { x: 55, y: 62 },
    ],
    defaultSeriesNames: [],
  },
  xyz: {
    mode: "xyz",
    description: "Use X/Y coordinates and Z for bubble size.",
    fixedFields: [
      { key: "x", label: "X", type: "number" },
      { key: "y", label: "Y", type: "number" },
      { key: "z", label: "Z (Size)", type: "number" },
    ],
    supportsSeries: false,
    supportsZColumn: true,
    defaultRows: [
      { x: 10, y: 30, z: 15 },
      { x: 25, y: 45, z: 22 },
      { x: 40, y: 28, z: 18 },
      { x: 55, y: 62, z: 30 },
    ],
    defaultSeriesNames: [],
  },
  range: {
    mode: "range",
    description: "Use a category with low and high values.",
    fixedFields: [
      { key: "category", label: "Category", type: "text" },
      { key: "low", label: "Low", type: "number" },
      { key: "high", label: "High", type: "number" },
    ],
    supportsSeries: false,
    supportsZColumn: false,
    defaultRows: [
      { category: "Planning", low: 12, high: 28 },
      { category: "Design", low: 18, high: 36 },
      { category: "Build", low: 30, high: 62 },
    ],
    defaultSeriesNames: [],
  },
  waterfall: {
    mode: "waterfall",
    description: "Use positive and negative amounts to build a running total.",
    fixedFields: [
      { key: "category", label: "Category", type: "text" },
      { key: "amount", label: "Amount", type: "number" },
    ],
    supportsSeries: false,
    supportsZColumn: false,
    defaultRows: [
      { category: "Starting", amount: 42000 },
      { category: "New Sales", amount: 18000 },
      { category: "Churn", amount: -7000 },
      { category: "Expansion", amount: 11000 },
    ],
    defaultSeriesNames: [],
  },
  ohlc: {
    mode: "ohlc",
    description: "Use date, open, high, low, and close price values.",
    fixedFields: [
      { key: "date", label: "Date", type: "text" },
      { key: "open", label: "Open", type: "number" },
      { key: "high", label: "High", type: "number" },
      { key: "low", label: "Low", type: "number" },
      { key: "close", label: "Close", type: "number" },
    ],
    supportsSeries: false,
    supportsZColumn: false,
    defaultRows: [
      { date: "2024-01-02", open: 100, high: 105, low: 98, close: 103 },
      { date: "2024-01-03", open: 103, high: 108, low: 101, close: 107 },
      { date: "2024-01-04", open: 107, high: 112, low: 104, close: 106 },
    ],
    defaultSeriesNames: [],
  },
  "box-plot": {
    mode: "box-plot",
    description: "Use min, quartiles, median, and max for each category.",
    fixedFields: [
      { key: "category", label: "Category", type: "text" },
      { key: "min", label: "Min", type: "number" },
      { key: "q1", label: "Q1", type: "number" },
      { key: "median", label: "Median", type: "number" },
      { key: "q3", label: "Q3", type: "number" },
      { key: "max", label: "Max", type: "number" },
    ],
    supportsSeries: false,
    supportsZColumn: false,
    defaultRows: [
      { category: "Q1 Sales", min: 10, q1: 25, median: 50, q3: 75, max: 95 },
      { category: "Q2 Sales", min: 15, q1: 30, median: 55, q3: 80, max: 100 },
      { category: "Q3 Sales", min: 20, q1: 35, median: 60, q3: 85, max: 105 },
    ],
    defaultSeriesNames: [],
  },
  hierarchical: {
    mode: "hierarchical",
    description: "Use an optional parent name to nest rows inside a hierarchy.",
    fixedFields: [
      { key: "name", label: "Name", type: "text" },
      { key: "parent", label: "Parent", type: "text", placeholder: "Optional" },
      { key: "value", label: "Value", type: "number" },
    ],
    supportsSeries: false,
    supportsZColumn: false,
    defaultRows: [
      { name: "Digital Experience", parent: "", value: 186 },
      { name: "Acquisition", parent: "Digital Experience", value: 78 },
      { name: "Organic Search", parent: "Acquisition", value: 34 },
      { name: "Paid Campaigns", parent: "Acquisition", value: 27 },
      { name: "Referral", parent: "Acquisition", value: 17 },
      { name: "Engagement", parent: "Digital Experience", value: 64 },
      { name: "Product Tours", parent: "Engagement", value: 26 },
      { name: "Templates", parent: "Engagement", value: 22 },
      { name: "Workspace Sharing", parent: "Engagement", value: 16 },
      { name: "Retention", parent: "Digital Experience", value: 44 },
      { name: "Weekly Active Teams", parent: "Retention", value: 25 },
      { name: "Automations", parent: "Retention", value: 19 },
    ],
    defaultSeriesNames: [],
  },
  flow: {
    mode: "flow",
    description: "Use source, target, and size for each connection.",
    fixedFields: [
      { key: "from", label: "From", type: "text" },
      { key: "to", label: "To", type: "text" },
      { key: "size", label: "Size", type: "number" },
    ],
    supportsSeries: false,
    supportsZColumn: false,
    defaultRows: [
      { from: "Visitors", to: "Leads", size: 80 },
      { from: "Leads", to: "Trials", size: 42 },
      { from: "Trials", to: "Customers", size: 18 },
    ],
    defaultSeriesNames: [],
  },
  funnel: {
    mode: "funnel",
    description: "Use a funnel stage label and numeric value.",
    fixedFields: [
      { key: "label", label: "Stage", type: "text" },
      { key: "value", label: "Value", type: "number" },
    ],
    supportsSeries: false,
    supportsZColumn: false,
    defaultRows: [
      { label: "Visitors", value: 12000 },
      { label: "Signups", value: 4200 },
      { label: "Trials", value: 1800 },
      { label: "Customers", value: 640 },
    ],
    defaultSeriesNames: [],
  },
  heatmap: {
    mode: "heatmap",
    description: "Use X category, Y category, and value for each cell.",
    fixedFields: [
      { key: "x", label: "X", type: "text" },
      { key: "y", label: "Y", type: "text" },
      { key: "value", label: "Value", type: "number" },
    ],
    supportsSeries: false,
    supportsZColumn: false,
    defaultRows: [
      { x: "Mon", y: "Morning", value: 12 },
      { x: "Mon", y: "Afternoon", value: 18 },
      { x: "Tue", y: "Morning", value: 15 },
      { x: "Tue", y: "Afternoon", value: 24 },
    ],
    defaultSeriesNames: [],
  },
  histogram: {
    mode: "histogram",
    description:
      "Use bin labels and frequencies. Raw values are still rendered if supplied.",
    fixedFields: [
      { key: "label", label: "Bin", type: "text" },
      { key: "value", label: "Frequency", type: "number" },
    ],
    supportsSeries: false,
    supportsZColumn: false,
    defaultRows: [
      { label: "15-25", value: 3 },
      { label: "25-35", value: 7 },
      { label: "35-45", value: 15 },
      { label: "45-55", value: 25 },
    ],
    defaultSeriesNames: [],
  },
  gauge: {
    mode: "gauge",
    description: "Use one value between 0 and 100.",
    fixedFields: [{ key: "value", label: "Value", type: "number" }],
    supportsSeries: false,
    supportsZColumn: false,
    defaultRows: [{ value: 64 }],
    defaultSeriesNames: [],
  },
};

function normalizeChartDataMode(mode: ChartDataMode): ChartDataMode {
  return mode in CHART_EDITOR_SCHEMAS ? mode : "categorical";
}

export function getSchemaForMode(mode: ChartDataMode): ChartEditorSchema {
  return CHART_EDITOR_SCHEMAS[normalizeChartDataMode(mode)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toCellValue(
  value: unknown,
  type: ChartDataFieldType,
): string | number {
  if (type === "number") {
    return typeof value === "number" && Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function flattenHierarchyRows(
  rows: readonly Record<string, unknown>[],
  parent = "",
): ChartDataRow[] {
  return rows.flatMap((row, index) => {
    const name =
      typeof row.name === "string" && row.name.trim().length > 0
        ? row.name
        : `Item ${index + 1}`;
    const value = typeof row.value === "number" ? row.value : 0;
    const children = Array.isArray(row.children)
      ? flattenHierarchyRows(row.children.filter(isRecord), name)
      : [];

    return [{ name, parent, value }, ...children];
  });
}

function normalizeRows(
  data: ChartDataType,
  schema: ChartEditorSchema,
): ChartDataRow[] {
  if (!Array.isArray(data) || data.length === 0) {
    return schema.defaultRows.map((row) => ({ ...row }));
  }

  if (schema.mode === "hierarchical") {
    return flattenHierarchyRows(data.filter(isRecord));
  }

  return data.filter(isRecord).map((row) => {
    const normalizedRow: ChartDataRow = {};
    for (const field of schema.fixedFields) {
      normalizedRow[field.key] = toCellValue(row[field.key], field.type);
    }
    for (const [key, value] of Object.entries(row)) {
      if (!(key in normalizedRow)) {
        normalizedRow[key] =
          typeof value === "number" && Number.isFinite(value)
            ? value
            : typeof value === "string"
              ? value
              : "";
      }
    }
    return normalizedRow;
  });
}

function getNumericKeys(rows: ChartDataRow[], labelKey: string): string[] {
  const sample = rows[0];
  if (!sample) return [];

  return Object.keys(sample).filter(
    (key) => key !== labelKey && typeof sample[key] === "number",
  );
}

export function getInitialEditorState(
  data: ChartDataType,
  mode: ChartDataMode,
): {
  rows: ChartDataRow[];
  schema: ChartEditorSchema;
  labelKey: string;
  seriesNames: string[];
} {
  const schema = getSchemaForMode(mode);
  const rows = normalizeRows(data, schema);
  const labelKey =
    schema.supportsSeries && rows.length > 0 ? getLabelKey(rows) : "label";
  const seriesNames = schema.supportsSeries
    ? getNumericKeys(rows, labelKey)
    : [];

  return {
    rows,
    schema,
    labelKey,
    seriesNames:
      seriesNames.length > 0
        ? seriesNames
        : schema.defaultSeriesNames.length > 0
          ? schema.defaultSeriesNames
          : [],
  };
}

export function buildFields(
  schema: ChartEditorSchema,
  labelKey: string,
  seriesNames: string[],
  hasZColumn: boolean,
): ChartDataField[] {
  if (schema.mode === "xy" && hasZColumn) {
    return [
      ...schema.fixedFields,
      { key: "z", label: "Z (Size)", type: "number" },
    ];
  }

  if (!schema.supportsSeries) {
    return schema.fixedFields;
  }

  const labelField = {
    key: labelKey,
    label: labelKey === "label" ? "Label" : labelKey,
    type: "text" as const,
  };

  return [
    labelField,
    ...seriesNames.map((name, index) => ({
      key: name,
      label: name,
      type: "number" as const,
      editableHeader: true,
      removable: seriesNames.length > 1,
      colorIndex: index,
    })),
  ];
}

export function createEmptyRow(
  fields: readonly ChartDataField[],
): ChartDataRow {
  return fields.reduce<ChartDataRow>((row, field) => {
    row[field.key] = field.type === "number" ? 0 : "";
    return row;
  }, {});
}

export function getDefaultSeriesChartType(index: number): SeriesChartType {
  return DEFAULT_CHART_TYPES[index % DEFAULT_CHART_TYPES.length] ?? "bar";
}

export function rowsToChartData(rows: ChartDataRow[]): ChartDataType {
  return rows.map((row) => ({ ...row })) as MultiSeriesData[];
}
