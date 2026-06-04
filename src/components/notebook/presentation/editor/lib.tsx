"use client";

import { BlockSelectionPlugin } from "@platejs/selection/react";
import { type TElement } from "@platejs/slate";
import {
  AreaChart,
  ArrowDownUp,
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  ChartScatter,
  Circle,
  CircleDashed,
  Clock,
  Diamond,
  Flower,
  Funnel,
  GitCompare,
  Grid2x2,
  Grid3x3,
  ImageIcon,
  Layers,
  Leaf,
  List,
  ListOrdered,
  PieChart,
  Pill,
  Quote,
  Radar,
  RefreshCw,
  Scale,
  Square,
  SquareAsterisk,
  SquareDashedBottomCode,
  SquareSplitVertical,
  SquareStack,
  Star,
  TrendingUp,
  Triangle,
  Workflow,
} from "lucide-react";
import { KEYS, NodeApi, PathApi, type NodeEntry, type Path } from "platejs";
import { type PlateEditor } from "platejs/react";
import { type CSSProperties, type ReactNode } from "react";
import { FaStairs } from "react-icons/fa6";

import { type MyEditor } from "@/components/plate/editor-kit";
import {
  getConnectedCircleItemPosition,
  getConnectedCircleItemTransform,
} from "./custom-elements/connected-circles-layout";
import {
  getSnakeGridColumn,
  getSnakeGridRow,
} from "./custom-elements/snake-shared";
import {
  updateSiblingsAfterDrop,
  updateSiblingsForcefully,
} from "./dnd/utils/updateSiblingsForcefully";
import { PALETTE_DROP_MUTABLE_KEY } from "./utils/paletteDrop";

export const BULLET_ITEM = "bullet";
export const BULLET_GROUP = "bullets";
export const STAIR_ITEM = "stair-item";
export const STAIRCASE_GROUP = "staircase";
export const CYCLE_ITEM = "cycle-item";
export const CYCLE_GROUP = "cycle";
export const ICON_ELEMENT = "icon";
export const ICON_LIST_ITEM = "icon-item";
export const ICON_LIST = "icons";
export const ARROW_LIST = "arrows";
export const ARROW_LIST_ITEM = "arrow-item";
export const PYRAMID_GROUP = "pyramid";
export const PYRAMID_ITEM = "pyramid-item";
export const TIMELINE_GROUP = "timeline";
export const TIMELINE_ITEM = "timeline-item";

// New components
export const BOX_GROUP = "boxes";
export const BOX_ITEM = "box-item";
export const COLUMN_GROUP = "column_group";
export const COLUMN_ITEM = "column";

export const COMPARE_GROUP = "compare";
export const COMPARE_SIDE = "compare-side";

export const BEFORE_AFTER_GROUP = "before-after";
export const BEFORE_AFTER_SIDE = "before-after-side";

export const PROS_CONS_GROUP = "pros-cons";
export const PROS_ITEM = "pros-item";
export const CONS_ITEM = "cons-item";

export const SEQUENCE_ARROW_GROUP = "arrow-vertical";
export const SEQUENCE_ARROW_ITEM = "arrow-vertical-item";

export const STATS_GROUP = "stats";
export const STATS_ITEM = "stats-item";

export const FLEX_BOX = "flex_box";

export const SLOPE_GROUP = "slope";
export const SLOPE_ITEM = "slope-item";
export const CONNECTED_CIRCLES_GROUP = "connected-circles";
export const CONNECTED_CIRCLES_ITEM = "connected-circle-item";
export const CIRCULAR_GRID_GROUP = "circular-grid";
export const CIRCULAR_GRID_ITEM = "circular-grid-item";
export const CIRCULAR_GRID_MAX_ITEMS = 6;
export const SNAKE_GROUP = "snake";
export const SNAKE_ITEM = "snake-item";
export const STEPS_GROUP = "steps";
export const STEPS_ITEM = "steps-item";

// Quote element
export const QUOTE_ELEMENT = "quote" as const;

// Individual chart element keys
export const PIE_CHART_ELEMENT = "chart-pie" as const;
export const BAR_CHART_ELEMENT = "chart-bar" as const;
export const AREA_CHART_ELEMENT = "chart-area" as const;
export const RADAR_CHART_ELEMENT = "chart-radar" as const;
export const SCATTER_CHART_ELEMENT = "chart-scatter" as const;
export const LINE_CHART_ELEMENT = "chart-line" as const;
export const RADIAL_BAR_CHART_ELEMENT = "chart-radial-bar" as const;
export const COMPOSED_CHART_ELEMENT = "chart-composed" as const;
export const TREEMAP_CHART_ELEMENT = "chart-treemap" as const;
export const BUBBLE_CHART_ELEMENT = "chart-bubble" as const;
export const DONUT_CHART_ELEMENT = "chart-donut" as const;

// New chart element keys - Phase 1: Standard Series
export const HISTOGRAM_CHART_ELEMENT = "chart-histogram" as const;
export const HEATMAP_CHART_ELEMENT = "chart-heatmap" as const;

// New chart element keys - Phase 2: Range Charts
export const RANGE_BAR_CHART_ELEMENT = "chart-range-bar" as const;
export const RANGE_AREA_CHART_ELEMENT = "chart-range-area" as const;
export const WATERFALL_CHART_ELEMENT = "chart-waterfall" as const;

// New chart element keys - Phase 3: Financial Charts
export const BOX_PLOT_CHART_ELEMENT = "chart-box-plot" as const;
export const CANDLESTICK_CHART_ELEMENT = "chart-candlestick" as const;
export const OHLC_CHART_ELEMENT = "chart-ohlc" as const;

// New chart element keys - Phase 4: Polar Charts
export const NIGHTINGALE_CHART_ELEMENT = "chart-nightingale" as const;
export const RADIAL_COLUMN_CHART_ELEMENT = "chart-radial-column" as const;

// New chart element keys - Phase 5: Hierarchical Charts
export const SUNBURST_CHART_ELEMENT = "chart-sunburst" as const;
export const SANKEY_CHART_ELEMENT = "chart-sankey" as const;
export const CHORD_CHART_ELEMENT = "chart-chord" as const;

// New chart element keys - Phase 6: Funnel Charts
export const FUNNEL_CHART_ELEMENT = "chart-funnel" as const;
export const CONE_FUNNEL_CHART_ELEMENT = "chart-cone-funnel" as const;
export const PYRAMID_CHART_ELEMENT = "chart-pyramid" as const;

// New chart element keys - Phase 7: Gauge Charts
export const RADIAL_GAUGE_ELEMENT = "chart-radial-gauge" as const;
export const LINEAR_GAUGE_ELEMENT = "chart-linear-gauge" as const;

// Button element key
export const BUTTON_ELEMENT = "button" as const;
export const CONTRIBUTOR_ELEMENT = "contributor" as const;
export const LABEL_ELEMENT = "label" as const;
export const PRESENTATION_TITLE_ELEMENT = "presentation-title" as const;

export type PresentationTitleVariant = "display" | "humongous" | "title";
export type PresentationElementAlignment = "center" | "left" | "right";

export type TPresentationTitleElement = TElement & {
  alignment?: PresentationElementAlignment;
  backgroundColor?: string;
  color?: string;
  textColor?: string;
  type: typeof PRESENTATION_TITLE_ELEMENT;
  variant?: PresentationTitleVariant;
};

export type TLabelElement = TElement & {
  alignment?: PresentationElementAlignment;
  backgroundColor?: string;
  color?: string;
  textColor?: string;
  type: typeof LABEL_ELEMENT;
};

export type TContributorElement = TElement & {
  alignment?: PresentationElementAlignment;
  backgroundColor?: string;
  color?: string;
  editedLabel?: string;
  textColor?: string;
  type: typeof CONTRIBUTOR_ELEMENT;
  updatedAt?: string | null;
};

// AntV Infographic element key
export const ANTV_INFOGRAPHIC = "antv-infographic" as const;

// Chart-specific capabilities for customization options
export const CHART_CAPABILITIES = {
  [BAR_CHART_ELEMENT]: {
    variants: ["default", "stacked", "horizontal"] as const,
  },
  [AREA_CHART_ELEMENT]: {
    variants: ["default", "stacked"] as const,
    curveTypes: ["linear", "monotone", "step", "natural"] as const,
  },
  [LINE_CHART_ELEMENT]: {
    curveTypes: ["linear", "monotone", "step", "natural"] as const,
  },
  [PIE_CHART_ELEMENT]: {
    variants: ["default"] as const,
  },
  [DONUT_CHART_ELEMENT]: {
    // Donut chart has a fixed inner radius ratio
  },
  [RADAR_CHART_ELEMENT]: {
    variants: ["default", "outline"] as const,
  },
  [SCATTER_CHART_ELEMENT]: {
    scatterShapes: ["circle", "star", "square", "triangle", "diamond"] as const,
  },
  [BUBBLE_CHART_ELEMENT]: {
    // Bubble chart uses z-axis for sizing, no special variants needed
  },
} as const;

// Rich default chart data for each chart type
export const DEFAULT_CHART_DATA = {
  // Label-value charts (pie, bar, area, line, radar, radial bar, treemap)
  labelValue: [
    { label: "Q1 Revenue", value: 45200 },
    { label: "Q2 Revenue", value: 52800 },
    { label: "Q3 Revenue", value: 48100 },
    { label: "Q4 Revenue", value: 61400 },
    { label: "Q1 Next Year", value: 58900 },
  ],
  // Multi-series for composed and stacked charts
  multiSeries: [
    { label: "Jan", revenue: 4500, expenses: 3200, profit: 1300 },
    { label: "Feb", revenue: 5200, expenses: 3400, profit: 1800 },
    { label: "Mar", revenue: 4800, expenses: 3100, profit: 1700 },
    { label: "Apr", revenue: 6100, expenses: 3800, profit: 2300 },
    { label: "May", revenue: 5900, expenses: 3500, profit: 2400 },
    { label: "Jun", revenue: 6800, expenses: 4000, profit: 2800 },
  ],
  // XY coordinate data for scatter plots
  scatter: [
    { x: 10, y: 30 },
    { x: 25, y: 45 },
    { x: 35, y: 20 },
    { x: 45, y: 55 },
    { x: 55, y: 40 },
    { x: 65, y: 70 },
    { x: 75, y: 50 },
    { x: 85, y: 85 },
    { x: 95, y: 60 },
  ],
  // XYZ coordinate data for bubble charts (with z for radius)
  bubble: [
    { x: 10, y: 30, z: 15 },
    { x: 25, y: 45, z: 22 },
    { x: 35, y: 20, z: 18 },
    { x: 45, y: 55, z: 28 },
    { x: 55, y: 40, z: 12 },
    { x: 65, y: 70, z: 35 },
    { x: 75, y: 50, z: 20 },
    { x: 85, y: 85, z: 30 },
  ],
  // Pre-binned histogram values shaped like a normal distribution
  histogram: [
    { label: "15-25", value: 3 },
    { label: "25-35", value: 7 },
    { label: "35-45", value: 15 },
    { label: "45-55", value: 25 },
    { label: "55-65", value: 20 },
    { label: "65-75", value: 12 },
    { label: "75-85", value: 5 },
  ],
  // OHLC data for candlestick and OHLC charts (date, open, high, low, close)
  ohlc: [
    { date: "2024-01-02", open: 100, high: 105, low: 98, close: 103 },
    { date: "2024-01-03", open: 103, high: 108, low: 101, close: 107 },
    { date: "2024-01-04", open: 107, high: 112, low: 104, close: 106 },
    { date: "2024-01-05", open: 106, high: 110, low: 102, close: 109 },
    { date: "2024-01-08", open: 109, high: 115, low: 107, close: 114 },
  ],
  // Box plot data (category, min, q1, median, q3, max)
  boxPlot: [
    { category: "Q1 Sales", min: 10, q1: 25, median: 50, q3: 75, max: 95 },
    { category: "Q2 Sales", min: 15, q1: 30, median: 55, q3: 80, max: 100 },
    { category: "Q3 Sales", min: 20, q1: 35, median: 60, q3: 85, max: 105 },
    { category: "Q4 Sales", min: 12, q1: 28, median: 52, q3: 78, max: 98 },
  ],
  range: [
    { category: "Planning", low: 12, high: 28 },
    { category: "Design", low: 18, high: 36 },
    { category: "Build", low: 30, high: 62 },
    { category: "Launch", low: 48, high: 72 },
  ],
  waterfall: [
    { category: "Starting", amount: 42000 },
    { category: "New Sales", amount: 18000 },
    { category: "Churn", amount: -7000 },
    { category: "Expansion", amount: 11000 },
  ],
  hierarchy: [
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
  flow: [
    { from: "Visitors", to: "Leads", size: 80 },
    { from: "Leads", to: "Trials", size: 42 },
    { from: "Trials", to: "Customers", size: 18 },
  ],
  funnel: [
    { label: "Visitors", value: 12000 },
    { label: "Signups", value: 4200 },
    { label: "Trials", value: 1800 },
    { label: "Customers", value: 640 },
  ],
  heatmap: [
    { x: "Mon", y: "Morning", value: 12 },
    { x: "Mon", y: "Afternoon", value: 18 },
    { x: "Tue", y: "Morning", value: 15 },
    { x: "Tue", y: "Afternoon", value: 24 },
  ],
  gauge: [{ value: 64 }],
} as const;

// Element categories for organized dropdown
export const ELEMENT_CATEGORIES = {
  BULLETS: "Bullets",
  BOXES: "Boxes",
  STEPS: "Steps",
  SEQUENCES: "Sequences",
  LAYOUTS: "Circles",
  MEDIA_LISTS: "Media Lists",
  COMPARISONS: "Comparisons",
  CHARTS: "Charts",
  STATS: "Stats",
  QUOTES: "Quotes",
} as const;

// Category icons mapping
export const CATEGORY_ICONS = {
  [ELEMENT_CATEGORIES.BULLETS]: <ListOrdered className="h-4 w-4" />,
  [ELEMENT_CATEGORIES.BOXES]: <Square className="h-4 w-4" />,
  [ELEMENT_CATEGORIES.STEPS]: <FaStairs className="h-4 w-4" />,
  [ELEMENT_CATEGORIES.SEQUENCES]: <ArrowRight className="h-4 w-4" />,
  [ELEMENT_CATEGORIES.LAYOUTS]: <CircleDashed className="h-4 w-4" />,
  [ELEMENT_CATEGORIES.MEDIA_LISTS]: <ImageIcon className="h-4 w-4" />,
  [ELEMENT_CATEGORIES.COMPARISONS]: <GitCompare className="h-4 w-4" />,
  [ELEMENT_CATEGORIES.CHARTS]: <PieChart className="h-4 w-4" />,
  [ELEMENT_CATEGORIES.STATS]: <BarChart3 className="h-4 w-4" />,
  [ELEMENT_CATEGORIES.QUOTES]: <Quote className="h-4 w-4" />,
} as const;

// Chart data category mapping - maps each chart type to its data category
export type ChartDataCategory =
  | "categorical" // All charts using label + value(s): Bar, Line, Area, Composed, Pie, Donut, Radar, Radial Bar, Nightingale, Radial Column
  | "xy" // Scatter - x/y coordinates
  | "xyz" // Bubble - x/y/z coordinates
  | "range" // Range Bar, Range Area - category + low/high values
  | "ohlc" // Candlestick, OHLC - financial data
  | "box-plot" // Box Plot - statistical data
  | "hierarchical" // Treemap, Sunburst - nested data
  | "flow" // Sankey, Chord - from/to/size
  | "funnel" // Funnel, Cone Funnel, Pyramid - stage/value
  | "heatmap" // Heatmap - x/y/value matrix
  | "histogram" // Histogram - single values for binning
  | "waterfall" // Waterfall chart - standalone
  | "gauge"; // Radial/Linear Gauge - single value

// Map of chart element types to their data categories
const CHART_DATA_CATEGORY_MAP: Record<string, ChartDataCategory> = {
  // Categorical charts (label + value(s) - can transform between each other)
  // This includes both cartesian (x/y axes) and polar displays
  [PIE_CHART_ELEMENT]: "categorical",
  [DONUT_CHART_ELEMENT]: "categorical",
  [RADAR_CHART_ELEMENT]: "categorical",
  [RADIAL_BAR_CHART_ELEMENT]: "categorical",
  [NIGHTINGALE_CHART_ELEMENT]: "categorical",
  [RADIAL_COLUMN_CHART_ELEMENT]: "categorical",
  [BAR_CHART_ELEMENT]: "categorical",
  [LINE_CHART_ELEMENT]: "categorical",
  [AREA_CHART_ELEMENT]: "categorical",
  [COMPOSED_CHART_ELEMENT]: "categorical",

  // XY coordinate charts
  [SCATTER_CHART_ELEMENT]: "xy",

  // XYZ coordinate charts (includes size/z dimension)
  [BUBBLE_CHART_ELEMENT]: "xyz",

  // Range charts (category + low/high values)
  [RANGE_BAR_CHART_ELEMENT]: "range",
  [RANGE_AREA_CHART_ELEMENT]: "range",

  // OHLC charts (financial - open, high, low, close)
  [CANDLESTICK_CHART_ELEMENT]: "ohlc",
  [OHLC_CHART_ELEMENT]: "ohlc",

  // Box plot charts (statistical)
  [BOX_PLOT_CHART_ELEMENT]: "box-plot",

  // Hierarchical charts (nested data with children)
  [TREEMAP_CHART_ELEMENT]: "hierarchical",
  [SUNBURST_CHART_ELEMENT]: "hierarchical",

  // Flow charts (from, to, size)
  [SANKEY_CHART_ELEMENT]: "flow",
  [CHORD_CHART_ELEMENT]: "flow",

  // Funnel charts (stage/label + value)
  [FUNNEL_CHART_ELEMENT]: "funnel",
  [CONE_FUNNEL_CHART_ELEMENT]: "funnel",
  [PYRAMID_CHART_ELEMENT]: "funnel",

  // Heatmap charts (x, y, value matrix)
  [HEATMAP_CHART_ELEMENT]: "heatmap",

  // Histogram charts (single values for binning)
  [HISTOGRAM_CHART_ELEMENT]: "histogram",

  // Gauge charts (single value)
  [RADIAL_GAUGE_ELEMENT]: "gauge",
  [LINEAR_GAUGE_ELEMENT]: "gauge",

  // Waterfall chart (standalone - specific data format)
  [WATERFALL_CHART_ELEMENT]: "waterfall",
};

/**
 * Gets the data category for a chart type
 * Used to determine which charts can be converted to each other
 */
export function getChartDataCategory(
  chartType: string,
): ChartDataCategory | null {
  return CHART_DATA_CATEGORY_MAP[chartType] ?? null;
}

export function getDefaultChartDataForType(chartType: string): unknown {
  if (chartType === COMPOSED_CHART_ELEMENT) {
    return DEFAULT_CHART_DATA.multiSeries;
  }

  const targetDataCategory = getChartDataCategory(chartType);

  switch (targetDataCategory) {
    case "xy":
      return DEFAULT_CHART_DATA.scatter;
    case "xyz":
      return DEFAULT_CHART_DATA.bubble;
    case "ohlc":
      return DEFAULT_CHART_DATA.ohlc;
    case "box-plot":
      return DEFAULT_CHART_DATA.boxPlot;
    case "histogram":
      return DEFAULT_CHART_DATA.histogram;
    case "range":
      return DEFAULT_CHART_DATA.range;
    case "waterfall":
      return DEFAULT_CHART_DATA.waterfall;
    case "hierarchical":
      return DEFAULT_CHART_DATA.hierarchy;
    case "flow":
      return DEFAULT_CHART_DATA.flow;
    case "funnel":
      return DEFAULT_CHART_DATA.funnel;
    case "heatmap":
      return DEFAULT_CHART_DATA.heatmap;
    case "gauge":
      return DEFAULT_CHART_DATA.gauge;
    default:
      return DEFAULT_CHART_DATA.labelValue;
  }
}

/**
 * Helper function to check if two chart types are compatible (can convert between them)
 * Charts are compatible if they use the same data structure/category
 */
export function areChartTypesCompatible(
  chartType1: string,
  chartType2: string,
): boolean {
  const category1 = getChartDataCategory(chartType1);
  const category2 = getChartDataCategory(chartType2);

  // If either chart doesn't have a category, they're not compatible
  if (!category1 || !category2) {
    return false;
  }

  // Charts are compatible if they share the same data category
  return category1 === category2;
}

// Element capabilities - defines which elements support which layout options
export const ELEMENT_CAPABILITIES: Record<
  string,
  {
    orientation?: readonly string[];
    sidedness?: readonly ["single", "double"];
    numbered?: boolean;
    showLine?: boolean;
    showIcon?: boolean;
    columnSize?: readonly ["sm", "md", "lg", "xl"];
    alignment?: readonly ("left" | "center" | "right")[];
    variant?: readonly string[];
  }
> = {
  [TIMELINE_GROUP]: {
    orientation: ["vertical", "horizontal"] as const,
    sidedness: ["single", "double"] as const,
    numbered: true,
    showLine: true,
    alignment: ["left", "right"] as readonly ("left" | "right")[],
    variant: ["default", "boxes"] as const,
  },
  [ARROW_LIST]: {
    orientation: ["vertical", "horizontal"] as const,
    alignment: ["left", "center", "right"] as const,
  },
  [SEQUENCE_ARROW_GROUP]: {
    orientation: ["vertical", "horizontal"] as const,
  },
  [STEPS_GROUP]: {
    variant: ["default", "arrow", "box"] as const,
    columnSize: ["sm", "md", "lg", "xl"] as const,
  },
  [FLEX_BOX]: {
    columnSize: ["sm", "md", "lg", "xl"] as const,
  },
  [BOX_GROUP]: {
    orientation: ["vertical", "horizontal"] as const,
    columnSize: ["sm", "md", "lg", "xl"] as const,
  },
  [BULLET_GROUP]: {
    columnSize: ["sm", "md", "lg", "xl"] as const,
  },
  [STATS_GROUP]: {
    columnSize: ["sm", "md", "lg", "xl"] as const,
  },
  [SLOPE_GROUP]: {
    alignment: ["left", "center", "right"] as const,
  },
  [CONNECTED_CIRCLES_GROUP]: {
    alignment: ["left", "center", "right"] as const,
  },
  [CIRCULAR_GRID_GROUP]: {
    alignment: ["left", "center", "right"] as const,
  },
  [SNAKE_GROUP]: {
    alignment: ["left", "center", "right"] as const,
  },
  [ICON_LIST]: {
    orientation: ["side", "top"] as const,
    columnSize: ["sm", "md", "lg", "xl"] as const,
    variant: ["icon", "image"] as const,
  },
  [COMPARE_GROUP]: {
    columnSize: ["sm", "md", "lg", "xl"] as const,
  },
  [BEFORE_AFTER_GROUP]: {
    columnSize: ["sm", "md", "lg", "xl"] as const,
  },
  [STAIRCASE_GROUP]: {
    alignment: ["left", "right"] as readonly ("left" | "right")[],
    variant: ["default", "inside"] as const,
  },
  [PYRAMID_GROUP]: {
    alignment: ["left", "right"] as readonly ("left" | "right")[],
    variant: ["default", "inside"] as const,
  },
  [KEYS.callout]: {
    alignment: ["left", "center", "right"] as const,
    variant: [
      "note",
      "info",
      "warning",
      "caution",
      "success",
      "question",
    ] as const,
  },
  [BUTTON_ELEMENT]: {
    alignment: ["left", "center", "right"] as const,
  },
  [CONTRIBUTOR_ELEMENT]: {
    alignment: ["left", "center", "right"] as const,
  },
  [LABEL_ELEMENT]: {
    alignment: ["left", "center", "right"] as const,
  },
  [PRESENTATION_TITLE_ELEMENT]: {
    alignment: ["left", "center", "right"] as const,
    variant: ["title", "display", "humongous"] as const,
  },
};

// Helper functions to check element capabilities
export function supportsOrientation(elementType: string): boolean {
  return (
    elementType in ELEMENT_CAPABILITIES &&
    "orientation" in
      (ELEMENT_CAPABILITIES[elementType as keyof typeof ELEMENT_CAPABILITIES] ??
        [])
  );
}

export function supportsSidedness(elementType: string): boolean {
  return (
    elementType in ELEMENT_CAPABILITIES &&
    "sidedness" in
      (ELEMENT_CAPABILITIES[elementType as keyof typeof ELEMENT_CAPABILITIES] ??
        [])
  );
}

export function supportsNumbered(elementType: string): boolean {
  return (
    elementType in ELEMENT_CAPABILITIES &&
    "numbered" in
      (ELEMENT_CAPABILITIES[elementType as keyof typeof ELEMENT_CAPABILITIES] ??
        [])
  );
}

export function supportsShowLine(elementType: string): boolean {
  return (
    elementType in ELEMENT_CAPABILITIES &&
    "showLine" in
      (ELEMENT_CAPABILITIES[elementType as keyof typeof ELEMENT_CAPABILITIES] ??
        [])
  );
}

export function supportsAlignment(elementType: string): boolean {
  return (
    elementType in ELEMENT_CAPABILITIES &&
    "alignment" in
      (ELEMENT_CAPABILITIES[elementType as keyof typeof ELEMENT_CAPABILITIES] ??
        [])
  );
}

export function supportsColumnSize(elementType: string): boolean {
  return (
    elementType in ELEMENT_CAPABILITIES &&
    "columnSize" in
      (ELEMENT_CAPABILITIES[elementType as keyof typeof ELEMENT_CAPABILITIES] ??
        {})
  );
}

export function supportsVariant(elementType: string): boolean {
  return (
    elementType in ELEMENT_CAPABILITIES &&
    "variant" in
      (ELEMENT_CAPABILITIES[elementType as keyof typeof ELEMENT_CAPABILITIES] ??
        {})
  );
}

export function getVariantOptions(elementType: string): readonly string[] {
  const capabilities =
    ELEMENT_CAPABILITIES[elementType as keyof typeof ELEMENT_CAPABILITIES];
  return capabilities?.variant ?? [];
}

export function getAlignmentOptions(elementType: string) {
  const capabilities =
    ELEMENT_CAPABILITIES[elementType as keyof typeof ELEMENT_CAPABILITIES];
  return capabilities?.alignment ?? ["left", "center", "right"];
}

export function getOrientationOptions(elementType: string): readonly string[] {
  const capabilities =
    ELEMENT_CAPABILITIES[elementType as keyof typeof ELEMENT_CAPABILITIES];
  return capabilities?.orientation ?? [];
}

export function getSidednessOptions(elementType: string): readonly string[] {
  const capabilities =
    ELEMENT_CAPABILITIES[elementType as keyof typeof ELEMENT_CAPABILITIES];
  return capabilities?.sidedness ?? [];
}

export function getColumnSizeOptions(elementType: string): readonly string[] {
  if (supportsColumnSize(elementType)) {
    return ["sm", "md", "lg", "xl"] as const;
  }
  return [];
}

export const getColumnSizeLabel = (columnSize: "sm" | "md" | "lg" | "xl") => {
  switch (columnSize) {
    case "sm":
      return "Small";
    case "md":
      return "Medium";
    case "lg":
      return "Large";
    case "xl":
      return "Extra Large";
  }
};

// Grouped blocks structure for hierarchical dropdown - all variants stored directly
type GroupedBlockBase = {
  type: string;
  name: string;
  icon: ReactNode;
  variant?: string;
  key?: string;
  supportsOrientation?: boolean;
};

export const GROUPED_BLOCKS = {
  [ELEMENT_CATEGORIES.BULLETS]: [
    // Bullets variants
    {
      type: BULLET_GROUP,
      name: "Numbered",
      variant: "numbered",
      key: "bulletType",
      icon: <ListOrdered className="h-4 w-4" />,
    },
    {
      type: BULLET_GROUP,
      name: "Basic",
      variant: "basic",
      key: "bulletType",
      icon: <List className="h-4 w-4" />,
    },
    {
      type: BULLET_GROUP,
      name: "Arrow",
      variant: "arrow",
      key: "bulletType",
      icon: <ArrowRight className="h-4 w-4" />,
    },
  ],
  [ELEMENT_CATEGORIES.BOXES]: [
    // Boxes variants
    {
      type: BOX_GROUP,
      name: "Solid",
      variant: "solid",
      key: "boxType",
      icon: <Square className="h-4 w-4" />,
    },
    {
      type: BOX_GROUP,
      name: "Outline",
      variant: "outline",
      key: "boxType",
      icon: <SquareDashedBottomCode className="h-4 w-4" />,
    },
    {
      type: BOX_GROUP,
      name: "With Icons",
      variant: "icon",
      key: "boxType",
      icon: <SquareAsterisk className="h-4 w-4" />,
    },
    {
      type: BOX_GROUP,
      name: "Side Line",
      variant: "sideline",
      key: "boxType",
      icon: <SquareSplitVertical className="h-4 w-4" />,
    },
    {
      type: BOX_GROUP,
      name: "Side Line Text",
      variant: "side-label",
      key: "boxType",
      icon: <SquareSplitVertical className="h-4 w-4" />,
    },
    {
      type: BOX_GROUP,
      name: "Top Line Text",
      variant: "top-label",
      key: "boxType",
      icon: <SquareDashedBottomCode className="h-4 w-4" />,
    },
    {
      type: BOX_GROUP,
      name: "Top Circle",
      variant: "top-circle",
      key: "boxType",
      icon: <Circle className="h-4 w-4" />,
    },
    {
      type: BOX_GROUP,
      name: "Joined",
      variant: "joined",
      key: "boxType",
      icon: <SquareStack className="h-4 w-4" />,
    },
    {
      type: BOX_GROUP,
      name: "Joined Icons",
      variant: "joined-icon",
      key: "boxType",
      icon: <SquareAsterisk className="h-4 w-4" />,
    },
    {
      type: BOX_GROUP,
      name: "Leaf",
      variant: "leaf",
      key: "boxType",
      icon: <Leaf className="h-4 w-4" />,
    },
    {
      type: BOX_GROUP,
      name: "Labeled",
      variant: "labeled",
      key: "boxType",
      icon: <Layers className="h-4 w-4" />,
    },
    {
      type: BOX_GROUP,
      name: "Alternating",
      variant: "alternating",
      key: "boxType",
      icon: <ArrowDownUp className="h-4 w-4" />,
      supportsOrientation: true,
    },
  ],
  [ELEMENT_CATEGORIES.STEPS]: [
    {
      type: STEPS_GROUP,
      name: "Steps",
      variant: "default",
      key: "variant",
      icon: <ListOrdered className="h-4 w-4" />,
    },
    {
      type: STEPS_GROUP,
      name: "Arrow Steps",
      variant: "arrow",
      key: "variant",
      icon: <ArrowRight className="h-4 w-4" />,
    },
    {
      type: STEPS_GROUP,
      name: "Box Steps",
      variant: "box",
      key: "variant",
      icon: <Square className="h-4 w-4" />,
    },
    {
      type: STAIRCASE_GROUP,
      name: "Staircase",
      icon: <FaStairs className="h-4 w-4" />,
    },
    // Pyramid/Funnel variants
    {
      type: PYRAMID_GROUP,
      name: "Pyramid",
      variant: "pyramid",
      key: "isFunnel",
      icon: <Triangle className="h-4 w-4" />,
    },
    {
      type: PYRAMID_GROUP,
      name: "Funnel",
      variant: "funnel",
      key: "isFunnel",
      icon: <Funnel className="h-4 w-4" />,
    },
    // Arrow Sequence - consolidated orientation variants
    {
      type: SEQUENCE_ARROW_GROUP,
      name: "Arrow Sequence",
      icon: <ArrowDownUp className="h-4 w-4" />,
      supportsOrientation: true,
    },
    {
      type: SLOPE_GROUP,
      name: "Slope",
      icon: <TrendingUp className="h-4 w-4" />,
    },
  ],
  [ELEMENT_CATEGORIES.SEQUENCES]: [
    // Arrows variants
    {
      type: ARROW_LIST,
      name: "Arrow",
      variant: "arrow",
      key: "svgType",
      icon: <ArrowRight className="h-4 w-4" />,
    },
    {
      type: ARROW_LIST,
      name: "Pill",
      variant: "pill",
      key: "svgType",
      icon: <Pill className="h-4 w-4" />,
    },
    {
      type: ARROW_LIST,
      name: "Parallelogram",
      variant: "parallelogram",
      key: "svgType",
      icon: <Diamond className="h-4 w-4" />,
    },
    // Timeline - consolidated orientation variants
    {
      type: TIMELINE_GROUP,
      name: "Timeline",
      variant: "default",
      key: "variant",
      icon: <Clock className="h-4 w-4" />,
      supportsOrientation: true,
    },
    {
      type: TIMELINE_GROUP,
      name: "Timeline Boxes",
      variant: "boxes",
      key: "variant",
      icon: <Square className="h-4 w-4" />,
      supportsOrientation: true,
    },
    {
      type: SNAKE_GROUP,
      name: "Snake",
      icon: <Workflow className="h-4 w-4" />,
    },
  ],
  [ELEMENT_CATEGORIES.LAYOUTS]: [
    {
      type: CYCLE_GROUP,
      name: "Cycle",
      variant: "cycle",
      key: "variant",
      icon: <RefreshCw className="h-4 w-4" />,
    },
    {
      type: CYCLE_GROUP,
      name: "Flower",
      variant: "flower",
      key: "variant",
      icon: <Flower className="h-4 w-4" />,
    },
    {
      type: CYCLE_GROUP,
      name: "Ring",
      variant: "ring",
      key: "variant",
      icon: <CircleDashed className="h-4 w-4" />,
    },
    {
      type: CYCLE_GROUP,
      name: "Circle",
      variant: "circle",
      key: "variant",
      icon: <Circle className="h-4 w-4" />,
    },
    {
      type: CONNECTED_CIRCLES_GROUP,
      name: "Connected Circles",
      icon: <Workflow className="h-4 w-4" />,
    },
    {
      type: CIRCULAR_GRID_GROUP,
      name: "Circular Grid",
      icon: <Grid2x2 className="h-4 w-4" />,
    },
  ],
  [ELEMENT_CATEGORIES.MEDIA_LISTS]: [
    {
      type: ICON_LIST,
      name: "Icon List",
      variant: "icon",
      key: "variant",
      icon: <Star className="h-4 w-4" />,
    },
    {
      type: ICON_LIST,
      name: "Image List",
      variant: "image",
      key: "variant",
      icon: <ImageIcon className="h-4 w-4" />,
    },
  ],
  [ELEMENT_CATEGORIES.COMPARISONS]: [
    {
      type: COMPARE_GROUP,
      name: "Compare",
      icon: <GitCompare className="h-4 w-4" />,
    },
    {
      type: BEFORE_AFTER_GROUP,
      name: "Before/After",
      icon: <ArrowLeftRight className="h-4 w-4" />,
    },
    {
      type: PROS_CONS_GROUP,
      name: "Pros & Cons",
      icon: <Scale className="h-4 w-4" />,
    },
    {
      type: COLUMN_GROUP,
      name: "Columns",
      icon: <SquareStack className="h-4 w-4" />,
    },
  ],
  [ELEMENT_CATEGORIES.CHARTS]: [
    {
      type: PIE_CHART_ELEMENT,
      name: "Pie Chart",
      icon: <PieChart className="h-4 w-4" />,
    },
    {
      type: DONUT_CHART_ELEMENT,
      name: "Donut Chart",
      icon: <Circle className="h-4 w-4" />,
    },
    {
      type: BAR_CHART_ELEMENT,
      name: "Bar Chart",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      type: AREA_CHART_ELEMENT,
      name: "Area Chart",
      icon: <AreaChart className="h-4 w-4" />,
    },
    {
      type: RADAR_CHART_ELEMENT,
      name: "Radar Chart",
      icon: <Radar className="h-4 w-4" />,
    },
    {
      type: SCATTER_CHART_ELEMENT,
      name: "Scatter Chart",
      icon: <ChartScatter className="h-4 w-4" />,
    },
    {
      type: BUBBLE_CHART_ELEMENT,
      name: "Bubble Chart",
      icon: <Circle className="h-4 w-4" />,
    },
    {
      type: LINE_CHART_ELEMENT,
      name: "Line Chart",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      type: RADIAL_BAR_CHART_ELEMENT,
      name: "Radial Bar",
      icon: <Circle className="h-4 w-4" />,
    },
    {
      type: RADIAL_COLUMN_CHART_ELEMENT,
      name: "Radial Column",
      icon: <Circle className="h-4 w-4" />,
    },
    {
      type: COMPOSED_CHART_ELEMENT,
      name: "Composed",
      icon: <Layers className="h-4 w-4" />,
    },
    {
      type: TREEMAP_CHART_ELEMENT,
      name: "Treemap",
      icon: <Grid3x3 className="h-4 w-4" />,
    },
    // New chart types
    {
      type: HISTOGRAM_CHART_ELEMENT,
      name: "Histogram",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      type: HEATMAP_CHART_ELEMENT,
      name: "Heatmap",
      icon: <Grid3x3 className="h-4 w-4" />,
    },
    {
      type: RANGE_BAR_CHART_ELEMENT,
      name: "Range Bar",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      type: RANGE_AREA_CHART_ELEMENT,
      name: "Range Area",
      icon: <AreaChart className="h-4 w-4" />,
    },
    {
      type: WATERFALL_CHART_ELEMENT,
      name: "Waterfall",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      type: BOX_PLOT_CHART_ELEMENT,
      name: "Box Plot",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      type: CANDLESTICK_CHART_ELEMENT,
      name: "Candlestick",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      type: OHLC_CHART_ELEMENT,
      name: "OHLC",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      type: NIGHTINGALE_CHART_ELEMENT,
      name: "Nightingale",
      icon: <PieChart className="h-4 w-4" />,
    },
    {
      type: SUNBURST_CHART_ELEMENT,
      name: "Sunburst",
      icon: <Circle className="h-4 w-4" />,
    },
    {
      type: SANKEY_CHART_ELEMENT,
      name: "Sankey",
      icon: <Layers className="h-4 w-4" />,
    },
    {
      type: CHORD_CHART_ELEMENT,
      name: "Chord",
      icon: <Circle className="h-4 w-4" />,
    },
    {
      type: FUNNEL_CHART_ELEMENT,
      name: "Funnel",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      type: CONE_FUNNEL_CHART_ELEMENT,
      name: "Cone Funnel",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      type: PYRAMID_CHART_ELEMENT,
      name: "Pyramid Chart",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      type: RADIAL_GAUGE_ELEMENT,
      name: "Radial Gauge",
      icon: <Circle className="h-4 w-4" />,
    },
    {
      type: LINEAR_GAUGE_ELEMENT,
      name: "Linear Gauge",
      icon: <BarChart3 className="h-4 w-4" />,
    },
  ],
  [ELEMENT_CATEGORIES.STATS]: [
    {
      type: STATS_GROUP,
      name: "Plain",
      variant: "plain",
      key: "statsType",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      type: STATS_GROUP,
      name: "Circle",
      variant: "circle",
      key: "statsType",
      icon: <Star className="h-4 w-4" />,
    },
    {
      type: STATS_GROUP,
      name: "Circle Bold",
      variant: "circle-bold",
      key: "statsType",
      icon: <Square className="h-4 w-4" />,
    },
    {
      type: STATS_GROUP,
      name: "Star Rating",
      variant: "star",
      key: "statsType",
      icon: <Star className="h-4 w-4" />,
    },
    {
      type: STATS_GROUP,
      name: "Bar",
      variant: "bar",
      key: "statsType",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      type: STATS_GROUP,
      name: "Dot Grid",
      variant: "dot-grid",
      key: "statsType",
      icon: <SquareStack className="h-4 w-4" />,
    },
    {
      type: STATS_GROUP,
      name: "Dot Line",
      variant: "dot-line",
      key: "statsType",
      icon: <ArrowRight className="h-4 w-4" />,
    },
  ],
  [ELEMENT_CATEGORIES.QUOTES]: [
    {
      type: QUOTE_ELEMENT,
      name: "Large Quote",
      variant: "large",
      key: "variant",
      icon: <Quote className="h-4 w-4" />,
    },
    {
      type: QUOTE_ELEMENT,
      name: "Side Quote with Icon",
      variant: "sidequote-icon",
      key: "variant",
      icon: <Quote className="h-4 w-4" />,
    },
    {
      type: QUOTE_ELEMENT,
      name: "Simple Side Quote",
      variant: "sidequote",
      key: "variant",
      icon: <Quote className="h-4 w-4" />,
    },
  ],
} as const satisfies Record<string, readonly GroupedBlockBase[]>;

type GroupedBlockList = readonly GroupedBlockBase[];

// Keep BLOCKS for backward compatibility but mark as deprecated
export const BLOCKS = Object.values(GROUPED_BLOCKS).flat();

const HIDDEN_LAYOUT_TOOLBAR_TYPES = new Set<string>([QUOTE_ELEMENT]);

// Helper function to check if an element type is a chart
export function isChartType(elementType: string): boolean {
  return GROUPED_BLOCKS[ELEMENT_CATEGORIES.CHARTS].some(
    (chart) => chart.type === elementType,
  );
}

export function getElementDisplayName(
  elementType: string,
  element?: Record<string, unknown>,
): string {
  if (element) {
    for (const elements of Object.values(GROUPED_BLOCKS)) {
      const foundVariant = elements.find((el) => {
        if (el.type !== elementType) return false;

        const block = el as GroupedBlockBase;
        if (block.variant && block.key) {
          if (block.key === "isFunnel") {
            const isFunnelValue = element.isFunnel;
            const currentFunnelVariant =
              isFunnelValue === "funnel" || isFunnelValue === true
                ? "funnel"
                : "pyramid";
            return currentFunnelVariant === block.variant;
          }

          const elementValue = element[block.key];
          return (
            elementValue === block.variant ||
            (!elementValue &&
              block.type === ICON_LIST &&
              block.variant === "icon") ||
            (!elementValue && block.variant === "default")
          );
        }

        return false;
      });

      if (foundVariant) return foundVariant.name;
    }
  }

  for (const elements of Object.values(GROUPED_BLOCKS)) {
    const found = elements.find((el) => el.type === elementType);
    if (found) return found.name;
  }

  return "Unknown";
}

/**
 * Gets available conversion options based on the current element type
 * Returns grouped structure for hierarchical dropdown
 */
export function getAvailableConversionOptions(
  currentElementType: string,
): Record<string, GroupedBlockList> {
  const isCurrentElementChart = isChartType(currentElementType);

  // If current element is a chart, only show chart category
  if (isCurrentElementChart) {
    return {
      [ELEMENT_CATEGORIES.CHARTS]: GROUPED_BLOCKS[
        ELEMENT_CATEGORIES.CHARTS
      ].filter((chart) =>
        areChartTypesCompatible(currentElementType, chart.type),
      ),
    };
  }

  // For non-chart elements, show all categories except charts
  const availableGroups: Record<string, GroupedBlockList> = {};

  for (const [category, elements] of Object.entries(GROUPED_BLOCKS)) {
    if (category !== ELEMENT_CATEGORIES.CHARTS) {
      const filteredElements = elements.filter((element) => {
        if (HIDDEN_LAYOUT_TOOLBAR_TYPES.has(element.type)) {
          return currentElementType === element.type;
        }
        return true;
      });

      if (filteredElements.length > 0) {
        availableGroups[category] = filteredElements;
      }
    }
  }

  return availableGroups;
}

type ParentChildRelationship = {
  child: string | readonly string[];
};

export const PARENT_CHILD_RELATIONSHIP = {
  [BULLET_GROUP]: {
    child: BULLET_ITEM,
  },
  [STAIRCASE_GROUP]: {
    child: STAIR_ITEM,
  },
  [CYCLE_GROUP]: {
    child: CYCLE_ITEM,
  },
  [ICON_LIST]: {
    child: ICON_LIST_ITEM,
  },
  [ARROW_LIST]: {
    child: ARROW_LIST_ITEM,
  },
  [PYRAMID_GROUP]: {
    child: PYRAMID_ITEM,
  },
  [TIMELINE_GROUP]: {
    child: TIMELINE_ITEM,
  },
  [BOX_GROUP]: {
    child: BOX_ITEM,
  },
  [COLUMN_GROUP]: {
    child: COLUMN_ITEM,
  },
  [COMPARE_GROUP]: {
    child: COMPARE_SIDE,
  },
  [BEFORE_AFTER_GROUP]: {
    child: BEFORE_AFTER_SIDE,
  },
  [PROS_CONS_GROUP]: {
    child: [PROS_ITEM, CONS_ITEM],
  },
  [STATS_GROUP]: {
    child: STATS_ITEM,
  },
  [SEQUENCE_ARROW_GROUP]: {
    child: SEQUENCE_ARROW_ITEM,
  },
  [SLOPE_GROUP]: {
    child: SLOPE_ITEM,
  },
  [CONNECTED_CIRCLES_GROUP]: {
    child: CONNECTED_CIRCLES_ITEM,
  },
  [CIRCULAR_GRID_GROUP]: {
    child: CIRCULAR_GRID_ITEM,
  },
  [SNAKE_GROUP]: {
    child: SNAKE_ITEM,
  },
  [STEPS_GROUP]: {
    child: STEPS_ITEM,
  },
} as const satisfies Record<string, ParentChildRelationship>;

export const LAYOUT_CHILD_TYPES = new Set<string>(
  Object.values(PARENT_CHILD_RELATIONSHIP).flatMap(({ child }) =>
    Array.isArray(child) ? child : [child],
  ),
);

export function isLayoutChildType(type: unknown): type is string {
  return typeof type === "string" && LAYOUT_CHILD_TYPES.has(type);
}

function isLayoutToolbarBlockType(type: unknown): type is string {
  return (
    type === "img" ||
    type === KEYS.table ||
    type === KEYS.mediaEmbed ||
    type === KEYS.callout ||
    type === ANTV_INFOGRAPHIC ||
    type === BUTTON_ELEMENT ||
    type === CONTRIBUTOR_ELEMENT ||
    type === LABEL_ELEMENT ||
    isChartType(typeof type === "string" ? type : "") ||
    isLayoutChildType(type) ||
    isLayoutParentType(type)
  );
}

function isElementNode(node: unknown): node is TElement {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    "children" in node
  );
}

export function isLayoutParentType(type: unknown): type is string {
  return typeof type === "string" && type in PARENT_CHILD_RELATIONSHIP;
}

function getLayoutChildTypes(parentType: string): readonly string[] {
  const childType =
    PARENT_CHILD_RELATIONSHIP[
      parentType as keyof typeof PARENT_CHILD_RELATIONSHIP
    ]?.child;

  if (!childType) return [];

  if (typeof childType === "string") {
    return [childType];
  }

  return childType;
}

export function getLayoutParentTypes(childType: string): readonly string[] {
  const parentTypes: string[] = [];

  for (const [parentType, relationship] of Object.entries(
    PARENT_CHILD_RELATIONSHIP,
  )) {
    const children =
      typeof relationship.child === "string"
        ? [relationship.child]
        : relationship.child;

    if (children.some((child) => child === childType)) {
      parentTypes.push(parentType);
    }
  }

  return parentTypes;
}

export function canLayoutChildTypeBePlacedInParent(
  childType: string,
  parentType: string,
): boolean {
  return getLayoutChildTypes(parentType).includes(childType);
}

function getRelationshipChildType(parentType: string, index: number) {
  const childType = PARENT_CHILD_RELATIONSHIP[parentType]?.child;

  if (Array.isArray(childType)) {
    return childType[index % childType.length];
  }

  return childType;
}

function getProcessedLayoutVariant(variant?: Record<string, unknown>) {
  const processedVariant = variant ? { ...variant } : {};

  if (processedVariant.isFunnel !== undefined) {
    processedVariant.isFunnel =
      processedVariant.isFunnel === "funnel" ||
      processedVariant.isFunnel === true;
  }

  return processedVariant;
}

function getNodeById(
  editor: MyEditor,
  elementId: string | undefined,
): NodeEntry<TElement> | undefined {
  if (!elementId) return undefined;

  return editor.api.node({
    id: elementId,
    at: [],
  }) as NodeEntry<TElement> | undefined;
}

export function getDirectLayoutToolbarTargetEntry(
  editor: MyEditor,
  elementId: string | undefined,
): NodeEntry<TElement> | undefined {
  const entry = getNodeById(editor, elementId);
  if (!entry) return undefined;

  const [element] = entry;
  return isLayoutToolbarBlockType(element.type) ? entry : undefined;
}

export function getLayoutChangeTargetEntry(
  editor: MyEditor,
  targetElementId?: string,
): NodeEntry<TElement> | undefined {
  const selectionIds = editor.getOption(BlockSelectionPlugin, "selectedIds");
  const selectedElementId = Array.from(selectionIds ?? [])[0];
  const elementId =
    targetElementId ??
    (typeof selectedElementId === "string" ? selectedElementId : undefined);
  const directEntry = getNodeById(editor, elementId);

  if (!directEntry) return undefined;

  const [element, path] = directEntry;

  if (isLayoutParentType(element.type) || isChartType(element.type)) {
    return directEntry;
  }

  if (path.length === 0) return directEntry;

  const parentPath = PathApi.parent(path) as Path;
  const parentElement = NodeApi.get(editor, parentPath);

  if (isElementNode(parentElement) && isLayoutParentType(parentElement.type)) {
    return [parentElement, parentPath];
  }

  return directEntry;
}

// Single helper per latest instruction: given only editor and element, derive class.
// Note: CYCLE_ITEM grid positioning is now handled by CycleElement parent component
export function getGridClassForElement(
  _editor: PlateEditor,
  element: TElement,
): string {
  // CYCLE_ITEM grid positioning is now handled by CycleElement wrapper
  if (element.type === CYCLE_ITEM) return "";

  if (element.type === PROS_ITEM || element.type === CONS_ITEM) return "h-full";

  if (element.type === SNAKE_ITEM) return "z-10 min-w-0 text-center";

  if (element.type === KEYS.column) return "flex-1";
  return "";
}

export function getGridStyleForElement(
  editor: PlateEditor,
  element: TElement,
): CSSProperties | undefined {
  if (
    element.type !== CIRCULAR_GRID_ITEM &&
    element.type !== CONNECTED_CIRCLES_ITEM &&
    element.type !== SNAKE_ITEM
  ) {
    return undefined;
  }

  const path = editor.api.findPath(element);
  if (!path) return undefined;

  const index = path.at(-1);
  if (typeof index !== "number") return undefined;

  if (element.type === SNAKE_ITEM) {
    const isTopBandItem = index % 2 === 1;

    return {
      alignSelf: isTopBandItem ? "end" : "stretch",
      gridColumn: getSnakeGridColumn(index),
      gridRow: getSnakeGridRow(index),
      justifySelf: "stretch",
    };
  }

  if (element.type === CONNECTED_CIRCLES_ITEM) {
    const parentPath = PathApi.parent(path);
    const parentElement = NodeApi.get(editor, parentPath);
    const total = isElementNode(parentElement)
      ? parentElement.children.length
      : 1;
    const position = getConnectedCircleItemPosition(index, total);
    const transform = getConnectedCircleItemTransform(index, total);

    return {
      gridColumn: position.gridColumn,
      gridRow: position.gridRow,
      justifySelf: "center",
      transform,
    };
  }

  const visibleIndex = Math.max(
    0,
    Math.min(index, CIRCULAR_GRID_MAX_ITEMS - 1),
  );
  const parentPath = PathApi.parent(path);
  const parentElement = NodeApi.get(editor, parentPath);
  const total = isElementNode(parentElement)
    ? Math.min(parentElement.children.length || 1, CIRCULAR_GRID_MAX_ITEMS)
    : 1;
  const isPromotedOddItem = total % 2 === 1 && visibleIndex === total - 1;
  const row = isPromotedOddItem
    ? 1
    : total === 4
      ? visibleIndex < 2
        ? 1
        : 3
      : Math.floor(visibleIndex / 2) + (total % 2 === 1 ? 2 : 1);
  const isLeftColumn = visibleIndex % 2 === 0;

  return {
    alignSelf: row === 1 ? "end" : row === 3 ? "start" : "center",
    display: index < CIRCULAR_GRID_MAX_ITEMS ? undefined : "none",
    gridColumn: isPromotedOddItem ? "1 / 3" : isLeftColumn ? "1" : "2",
    gridRow: `${row}`,
    justifySelf: isPromotedOddItem ? "center" : isLeftColumn ? "end" : "start",
    transform:
      row === 2 || isPromotedOddItem
        ? undefined
        : `translateX(${isLeftColumn ? 72 : -72}px)`,
  };
}

/**
 * Handles the conversion of layout elements to different types
 * @param editor - The Plate editor instance
 * @param type - The target element type to convert to
 * @param variant - Optional variant properties to apply
 */
export function handleLayoutChange(
  editor: MyEditor,
  type: string,
  variant?: Record<string, unknown>,
  targetElementId?: string,
): TElement | null {
  const targetEntry = getLayoutChangeTargetEntry(editor, targetElementId);
  const [element, elementPath] = targetEntry ?? [];

  if (!element || !elementPath) return null;

  const getUpdatedElement = () => {
    const updatedElementId =
      typeof element.id === "string" ? element.id : undefined;
    const updatedEntry =
      getNodeById(editor, updatedElementId) ??
      (editor.api.node({ at: elementPath }) as NodeEntry<TElement> | undefined);
    const [updatedElement] = updatedEntry ?? [];

    return updatedElement ?? null;
  };

  // Handle non-chart layout/content element conversions.
  if (!isChartType(element.type)) {
    editor.tf.withoutNormalizing(() => {
      const processedVariant = getProcessedLayoutVariant(variant);

      // If we're changing variants within the same type, just update the variant
      if (type === element.type && Object.keys(processedVariant).length > 0) {
        editor.tf.setNodes(
          { ...processedVariant, [PALETTE_DROP_MUTABLE_KEY]: false },
          {
            at: elementPath,
          },
        );
      } else {
        // If we're changing the element type, update type and variant
        editor.tf.setNodes(
          { type, ...processedVariant, [PALETTE_DROP_MUTABLE_KEY]: false },
          { at: elementPath },
        );
        // Update child element types
        element.children.forEach((_, index) => {
          const childType = getRelationshipChildType(type, index);
          if (!childType) return;

          editor.tf.setNodes(
            { type: childType },
            { at: [...elementPath, index] },
          );
        });
      }
      updateSiblingsForcefully(editor, element, elementPath);
    });
    return getUpdatedElement();
  }

  // Handle chart elements (direct conversion)
  if (isChartType(element.type)) {
    const currentData = (element as { data?: unknown }).data;

    // Add default data if converting to a chart and there's no existing data
    const chartData =
      currentData && Array.isArray(currentData) && currentData.length > 0
        ? undefined // Keep existing data
        : getDefaultChartDataForType(type);

    editor.tf.setNodes(
      {
        type,
        ...(chartData ? { data: chartData } : {}),
        [PALETTE_DROP_MUTABLE_KEY]: false,
      },
      { at: elementPath },
    );
  }

  return getUpdatedElement();
}

/**
 * Handles updating node properties with forced sibling updates
 * @param editor - The Plate editor instance
 * @param key - The property key to update
 * @param value - The new value for the property
 */
export function handleNodePropertyUpdate(
  editor: MyEditor,
  key: string,
  value:
    | string
    | boolean
    | number
    | Record<string, unknown>
    | unknown[]
    | undefined,
  targetElementId?: string,
): void {
  const selectionIds = editor.getOption(BlockSelectionPlugin, "selectedIds");
  const targetId = targetElementId ?? Array.from(selectionIds ?? [])[0];

  if (!targetId) return;

  const node = Array.from(
    editor.api.nodes({
      at: [],
      match: (n) => "id" in n && n.id === targetId,
    }),
  );
  const [rawElement] = node?.[0] ?? [];

  if (!rawElement) return;

  const element = rawElement as TElement;

  const elementPath = editor.api.findPath(element);
  if (!elementPath) return;

  editor.tf.withoutNormalizing(() => {
    if (value === undefined) {
      // Remove the property by setting it to undefined
      editor.tf.setNodes(
        { [key]: undefined, [PALETTE_DROP_MUTABLE_KEY]: false },
        { at: elementPath },
      );
    } else {
      if (element.type === ANTV_INFOGRAPHIC && key === "syntax") {
        editor.tf.setNodes(
          { [key]: value, data: undefined, [PALETTE_DROP_MUTABLE_KEY]: false },
          { at: elementPath },
        );
      } else {
        // Update the node property - convert boolean to string for numbered property
        editor.tf.setNodes(
          { [key]: value, [PALETTE_DROP_MUTABLE_KEY]: false },
          { at: elementPath },
        );
      }
    }
    if (isLayoutParentType(element.type)) {
      updateSiblingsForcefully(editor, element, elementPath);
    } else {
      updateSiblingsAfterDrop(editor, element, elementPath);
    }
  });
}
