"use client";

import { type EChartsOption } from "echarts";
import {
  BarChart,
  BoxplotChart,
  CandlestickChart,
  CustomChart,
  FunnelChart,
  GaugeChart,
  GraphChart,
  HeatmapChart,
  LineChart,
  PieChart,
  RadarChart,
  SankeyChart,
  ScatterChart,
  SunburstChart,
  TreemapChart,
} from "echarts/charts";
import {
  GraphicComponent,
  GridComponent,
  LegendComponent,
  PolarComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { type EChartsType } from "echarts/core";
import { CanvasRenderer, SVGRenderer } from "echarts/renderers";
import { useCallback, useEffect, useRef, type CSSProperties } from "react";
import { useInView } from "react-intersection-observer";

import { cn } from "@/lib/utils";

export type PresentationEChartsOption = EChartsOption;
type EChartsSeriesItem = Record<string, unknown>;

echarts.use([
  BarChart,
  BoxplotChart,
  CandlestickChart,
  CustomChart,
  FunnelChart,
  GaugeChart,
  GraphChart,
  HeatmapChart,
  LineChart,
  PieChart,
  RadarChart,
  SankeyChart,
  ScatterChart,
  SunburstChart,
  TreemapChart,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  PolarComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
  SVGRenderer,
]);

export interface EChartWrapperProps {
  options: PresentationEChartsOption;
  className?: string;
  style?: CSSProperties;
  renderer?: "svg" | "canvas";
  previewMode?: boolean;
  animationReplayDelayMs?: number;
  isPresenting?: boolean;
}

function withoutEChartsAnimation(
  options: PresentationEChartsOption,
): PresentationEChartsOption {
  const series = options.series;
  const disableSeriesAnimation = (seriesItem: unknown): unknown => {
    if (
      typeof seriesItem !== "object" ||
      seriesItem === null ||
      Array.isArray(seriesItem)
    ) {
      return seriesItem;
    }

    return {
      ...(seriesItem as EChartsSeriesItem),
      animation: false,
      animationDuration: 0,
      animationDurationUpdate: 0,
    };
  };

  return {
    ...options,
    animation: false,
    animationDuration: 0,
    animationDurationUpdate: 0,
    series: Array.isArray(series)
      ? (series.map(
          disableSeriesAnimation,
        ) as PresentationEChartsOption["series"])
      : (disableSeriesAnimation(series) as PresentationEChartsOption["series"]),
  };
}

export function EChartWrapper({
  options,
  className,
  style,
  renderer = "svg",
  previewMode = false,
  animationReplayDelayMs = 0,
  isPresenting = false,
}: EChartWrapperProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<EChartsType | null>(null);
  const { inView, ref: inViewRef } = useInView({
    threshold: 0.6,
  });
  const setRootRef = useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      inViewRef(node);
    },
    [inViewRef],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const chart =
      chartRef.current ??
      echarts.init(root, null, {
        renderer,
      });
    chartRef.current = chart;

    return () => {
      chart.dispose();
      chartRef.current = null;
    };
  }, [renderer]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const visiblePresentAnimation = isPresenting && inView;

    chart.setOption(
      visiblePresentAnimation ? options : withoutEChartsAnimation(options),
      {
        notMerge: true,
        lazyUpdate: false,
      },
    );
  }, [inView, isPresenting, options]);

  useEffect(() => {
    if (!isPresenting || !inView || options.animation !== true) return;

    const chart = chartRef.current;
    if (!chart) return;

    let timeoutId: number | null = null;
    let firstFrameId: number | null = null;
    let secondFrameId: number | null = null;

    const replayAnimation = () => {
      const currentChart = chartRef.current;
      const root = rootRef.current;
      if (!currentChart || !root) return;

      currentChart.resize();
      currentChart.clear();
      currentChart.setOption(options, {
        notMerge: true,
        lazyUpdate: false,
      });
    };

    timeoutId = window.setTimeout(() => {
      firstFrameId = window.requestAnimationFrame(() => {
        secondFrameId = window.requestAnimationFrame(replayAnimation);
      });
    }, animationReplayDelayMs);

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      if (firstFrameId !== null) {
        window.cancelAnimationFrame(firstFrameId);
      }
      if (secondFrameId !== null) {
        window.cancelAnimationFrame(secondFrameId);
      }
    };
  }, [animationReplayDelayMs, inView, isPresenting, options]);

  useEffect(() => {
    const root = rootRef.current;
    const chart = chartRef.current;
    if (!root || !chart) return;

    const observer = new ResizeObserver(() => {
      chart.resize();
    });
    observer.observe(root);
    chart.resize();

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className={cn("h-full min-h-[inherit] w-full", className)}
      data-echart="true"
      data-echart-renderer={renderer}
      data-echart-preview={previewMode ? "true" : "false"}
      data-ppt-ignore="true"
      style={{
        backgroundColor: "var(--presentation-background)",
        color: "var(--presentation-text)",
        ...style,
      }}
    >
      <div ref={setRootRef} className="h-full min-h-[inherit] w-full" />
    </div>
  );
}

export const CHART_COLORS = [
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
];

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length] ?? CHART_COLORS[0]!;
}

export function getChartColors(): string[] {
  return CHART_COLORS;
}

