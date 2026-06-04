// Data types for different chart types
type LabelValueData = {
  label: string;
  value: number;
};

type XYData = {
  x: number;
  y: number;
  z?: number; // For bubble charts
};

// Multi-series data supports multiple value columns
export type MultiSeriesData = {
  [key: string]: string | number; // Additional value columns
};

// Range data for range bar/area charts
type RangeData = {
  category: string;
  low: number;
  high: number;
};

// Waterfall data with positive/negative amounts
type WaterfallData = {
  category: string;
  amount: number;
};

// OHLC data for financial charts (Candlestick, OHLC)
type OHLCData = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

// Box plot statistical data
type BoxPlotData = {
  category: string;
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
};

// Hierarchical data for treemap/sunburst
type HierarchicalData = {
  name: string;
  value?: number;
  children?: HierarchicalData[];
};

// Flow data for sankey/chord charts
type FlowData = {
  from: string;
  to: string;
  size: number;
};

// Funnel data (label + value)
type FunnelData = {
  label: string;
  value: number;
};

// Heatmap data with x, y coordinates and value
type HeatmapData = {
  x: string;
  y: string;
  value: number;
};

// Histogram data (single values for binning)
type HistogramData = {
  value: number;
};

// Gauge data (single numeric value or object with value)
type GaugeData = number | { value: number };

export type ChartDataType =
  | LabelValueData[]
  | XYData[]
  | MultiSeriesData[]
  | RangeData[]
  | WaterfallData[]
  | OHLCData[]
  | BoxPlotData[]
  | HierarchicalData[]
  | FlowData[]
  | FunnelData[]
  | HeatmapData[]
  | HistogramData[]
  | GaugeData;

// Chart data modes/categories - charts with same mode can convert to each other
export type ChartDataMode =
  | "categorical" // Shared editor mode from presentation chart conversion categories
  | "label-value" // Pie, Donut, Radar, RadialBar, Nightingale, Radial Column
  | "xy" // Scatter
  | "xyz" // Bubble
  | "multi-series" // Bar, Line, Area, Composed
  | "range" // Range Bar, Range Area
  | "waterfall" // Waterfall
  | "ohlc" // Candlestick, OHLC
  | "box-plot" // Box Plot
  | "hierarchical" // Treemap, Sunburst
  | "flow" // Sankey, Chord
  | "funnel" // Funnel, Cone Funnel, Pyramid
  | "heatmap" // Heatmap
  | "histogram" // Histogram
  | "gauge"; // Radial Gauge, Linear Gauge

// Available chart types for composed chart series
export type SeriesChartType = "bar" | "line" | "area" | "scatter";
