"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { ChartRenderer } from "@/components/notebook/presentation/editor/custom-elements/charts/ChartRenderer";
import { DEFAULT_CHART_DATA } from "@/components/notebook/presentation/editor/lib";

const BASE_WIDTH = 400;
const BASE_HEIGHT = 300;
const EMPTY_VARIANT_OPTIONS: Record<string, unknown> = {};

const sampleData = [
  { label: "A", value: 400 },
  { label: "B", value: 300 },
  { label: "C", value: 500 },
  { label: "D", value: 280 },
];

const scatterData = [
  { x: 10, y: 30, z: 15 },
  { x: 25, y: 45, z: 22 },
  { x: 35, y: 20, z: 18 },
  { x: 45, y: 55, z: 28 },
];

const ohlcData = [
  { date: "Mon", open: 100, high: 105, low: 98, close: 103 },
  { date: "Tue", open: 103, high: 108, low: 101, close: 107 },
  { date: "Wed", open: 107, high: 112, low: 104, close: 106 },
];

const boxPlotData = [
  { category: "A", min: 10, q1: 25, median: 50, q3: 75, max: 95 },
  { category: "B", min: 15, q1: 30, median: 55, q3: 80, max: 100 },
];

const rangeData = [
  { category: "A", low: 20, high: 80 },
  { category: "B", low: 30, high: 70 },
  { category: "C", low: 40, high: 90 },
];

const flowData = [
  { from: "A", to: "B", size: 10 },
  { from: "A", to: "C", size: 5 },
  { from: "B", to: "C", size: 15 },
];

const heatmapData = [
  { x: "A", y: "1", value: 10 },
  { x: "B", y: "1", value: 20 },
  { x: "A", y: "2", value: 30 },
  { x: "B", y: "2", value: 15 },
];

const histogramData = [
  { label: "0-20", value: 4 },
  { label: "20-40", value: 12 },
  { label: "40-60", value: 20 },
  { label: "60-80", value: 10 },
  { label: "80-100", value: 3 },
];

const waterfallData = [
  { category: "Start", amount: 100 },
  { category: "Add", amount: 50 },
  { category: "Sub", amount: -30 },
  { category: "Total", amount: 120 },
];

function getSampleDataForChart(chartType: string): unknown {
  switch (chartType) {
    case "chart-scatter":
    case "chart-bubble":
      return scatterData;
    case "chart-candlestick":
    case "chart-ohlc":
      return ohlcData;
    case "chart-box-plot":
      return boxPlotData;
    case "chart-range-bar":
    case "chart-range-area":
      return rangeData;
    case "chart-sankey":
    case "chart-chord":
      return flowData;
    case "chart-treemap":
    case "chart-sunburst":
      return DEFAULT_CHART_DATA.hierarchy;
    case "chart-heatmap":
      return heatmapData;
    case "chart-histogram":
      return histogramData;
    case "chart-waterfall":
      return waterfallData;
    case "chart-radial-gauge":
    case "chart-linear-gauge":
      return 75;
    default:
      return sampleData;
  }
}

interface InteractiveChartPreviewProps {
  chartType: string;
  className?: string;
  variantOptions?: Record<string, unknown>;
}

export function InteractiveChartPreview({
  chartType,
  className,
  variantOptions = EMPTY_VARIANT_OPTIONS,
}: InteractiveChartPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(0.3);

  const chartData = getSampleDataForChart(chartType);

  const previewOptions: Record<string, unknown> = {
    ...variantOptions,
    showLegend: false,
    showGrid: false,
    showAxisLabels: false,
    disableAnimation: true,
    previewMode: true,
  };

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const updateScale = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      const nextScale = rect && rect.width > 0 ? rect.width / BASE_WIDTH : 0.3;
      setScale(nextScale);
    };

    updateScale();

    const resizeObserver = new ResizeObserver(updateScale);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`pointer-events-none relative isolate select-none **:pointer-events-none **:select-none ${className ?? ""}`}
      style={{
        height: BASE_HEIGHT * scale,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        className="relative"
        style={{
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <ChartRenderer
          chartType={chartType}
          chartData={chartData}
          chartOptions={previewOptions}
          className="pointer-events-none h-full w-full border-0 p-1 shadow-none"
        />
      </div>
    </div>
  );
}
