"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import {
  AREA_CHART_ELEMENT,
  BAR_CHART_ELEMENT,
  BOX_PLOT_CHART_ELEMENT,
  BUBBLE_CHART_ELEMENT,
  CANDLESTICK_CHART_ELEMENT,
  CHORD_CHART_ELEMENT,
  COMPOSED_CHART_ELEMENT,
  CONE_FUNNEL_CHART_ELEMENT,
  DONUT_CHART_ELEMENT,
  FUNNEL_CHART_ELEMENT,
  HEATMAP_CHART_ELEMENT,
  HISTOGRAM_CHART_ELEMENT,
  LINE_CHART_ELEMENT,
  LINEAR_GAUGE_ELEMENT,
  NIGHTINGALE_CHART_ELEMENT,
  OHLC_CHART_ELEMENT,
  PIE_CHART_ELEMENT,
  PYRAMID_CHART_ELEMENT,
  RADAR_CHART_ELEMENT,
  RADIAL_BAR_CHART_ELEMENT,
  RADIAL_COLUMN_CHART_ELEMENT,
  RADIAL_GAUGE_ELEMENT,
  RANGE_AREA_CHART_ELEMENT,
  RANGE_BAR_CHART_ELEMENT,
  SANKEY_CHART_ELEMENT,
  SCATTER_CHART_ELEMENT,
  SUNBURST_CHART_ELEMENT,
  TREEMAP_CHART_ELEMENT,
  WATERFALL_CHART_ELEMENT,
} from "../../lib";
import { type TChartNode } from "../../plugins/chart-plugin";
import {
  buildChartConfigOptions,
  getLabelKey,
  getValueKey,
  getValueKeys,
  getXKey,
  getYKey,
  getZKey,
  keyToLabel,
  sanitizeSankeyCycleData,
} from "../chart-utils";
import { EChartWrapper } from "./echart-wrapper";
import {
  getChartColor,
  getChartColors,
  type PresentationEChartsOption,
} from "./echart-wrapper";

type AnyRecord = Record<string, unknown>;
type SeriesChartType = "bar" | "line" | "area" | "scatter";
type EChartSeries = NonNullable<PresentationEChartsOption["series"]>;
type EChartSeriesItem = Record<string, unknown>;
type EChartAxis = Record<string, unknown>;
type ChartAnimationSettings = {
  duration?: number;
  enabled: boolean;
};
type ChartLegendEntry = {
  color: string;
  label: string;
};
type ChordNode = {
  color: string;
  endAngle: number;
  name: string;
  startAngle: number;
  value: number;
};
type ChordLink = {
  color: string;
  source: ChordNode;
  target: ChordNode;
  value: number;
};
type BinnedHistogramData = {
  labels: string[];
  valueKey: string;
  values: number[];
};

export interface ChartRendererProps {
  chartType: string;
  chartData: unknown;
  chartOptions?: Record<string, unknown>;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_CONTAINER_CLASS =
  "flex w-full flex-col rounded-lg border bg-card p-2 shadow-xs";
const EMPTY_CHART_OPTIONS: Record<string, unknown> = {};
const CHORD_LABEL_FONT_SIZE = 12;
const CHORD_VIEWBOX_SIZE = 400;
const CHORD_LABEL_PADDING = 8;
const CHORD_LABEL_BLEED = 24;
const SVG_LABEL_AVERAGE_CHAR_WIDTH = 0.56;
const PRESENT_MODE_ANIMATION_REPLAY_DELAY_MS = 360;

function toRecordArray(value: unknown): AnyRecord[] {
  return Array.isArray(value) ? (value as AnyRecord[]) : [];
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toText(value: unknown, fallback = ""): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return fallback;
}

function truncateSvgLabel(
  label: string,
  maxWidth: number,
  fontSize: number,
): string {
  const ellipsis = "...";
  const characterWidth = fontSize * SVG_LABEL_AVERAGE_CHAR_WIDTH;
  const maxCharacters = Math.floor(maxWidth / characterWidth);

  if (label.length <= maxCharacters) return label;
  if (maxCharacters <= ellipsis.length) return ellipsis;

  return `${label.slice(0, maxCharacters - ellipsis.length)}${ellipsis}`;
}

function getAnchoredSvgLabelWidth(
  anchor: "end" | "middle" | "start",
  x: number,
): number {
  const leftSpace = x - CHORD_LABEL_PADDING + CHORD_LABEL_BLEED;
  const rightSpace =
    CHORD_VIEWBOX_SIZE - x - CHORD_LABEL_PADDING + CHORD_LABEL_BLEED;

  if (anchor === "end") return Math.max(0, leftSpace);
  if (anchor === "start") return Math.max(0, rightSpace);

  return Math.max(0, Math.min(leftSpace, rightSpace) * 2);
}

function isRecord(value: unknown): value is AnyRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getSeriesArray(option: PresentationEChartsOption): EChartSeriesItem[] {
  const series = option.series;
  if (!series) return [];
  return Array.isArray(series)
    ? (series as EChartSeriesItem[])
    : [series as EChartSeriesItem];
}

function getLegendColor(
  seriesItem: EChartSeriesItem,
  index: number,
  element: TChartNode,
): string {
  const itemStyle = seriesItem.itemStyle;
  const itemStyleColor = isRecord(itemStyle) ? itemStyle.color : undefined;

  if (typeof itemStyleColor === "string") return itemStyleColor;
  return element.colors?.[index] ?? getChartColor(index);
}

function buildLegendEntries(
  option: PresentationEChartsOption,
  element: TChartNode,
): ChartLegendEntry[] {
  const entries = getSeriesArray(option).flatMap((seriesItem, seriesIndex) => {
    const seriesData = seriesItem.data;

    if (Array.isArray(seriesData)) {
      const namedData = seriesData.filter(
        (item): item is AnyRecord => isRecord(item) && "name" in item,
      );

      if (namedData.length > 0) {
        return namedData.map((item, itemIndex) => ({
          color: getLegendColor(item, itemIndex, element),
          label: toText(item.name, `Item ${itemIndex + 1}`),
        }));
      }
    }

    const name = seriesItem.name;
    return typeof name === "string" && name.length > 0
      ? [
          {
            color: getLegendColor(seriesItem, seriesIndex, element),
            label: name,
          },
        ]
      : [];
  });

  const seenLabels = new Set<string>();
  return entries.filter((entry) => {
    if (seenLabels.has(entry.label)) return false;
    seenLabels.add(entry.label);
    return true;
  });
}

function isLegendEnabled(option: PresentationEChartsOption): boolean {
  const legend = option.legend;
  if (Array.isArray(legend)) {
    return legend.some((item) => !isRecord(item) || item.show !== false);
  }

  return !isRecord(legend) || legend.show !== false;
}

function disableBuiltInLegend(
  option: PresentationEChartsOption,
): PresentationEChartsOption {
  const legend = option.legend;

  if (Array.isArray(legend)) {
    return {
      ...option,
      legend: legend.map((item) =>
        isRecord(item) ? { ...item, show: false } : item,
      ),
    };
  }

  return {
    ...option,
    legend: isRecord(legend) ? { ...legend, show: false } : { show: false },
  };
}

function getChartAnimationSettings(
  element: TChartNode,
): ChartAnimationSettings {
  const config = buildChartConfigOptions(element);

  return config.animation;
}

function withSeriesAnimation(
  option: PresentationEChartsOption,
  animation: ChartAnimationSettings,
): PresentationEChartsOption {
  const series = option.series;
  if (!series) return option;

  const applyAnimation = (seriesItem: EChartSeriesItem): EChartSeriesItem => ({
    ...seriesItem,
    animation: animation.enabled,
    animationDuration: animation.duration,
    animationDurationUpdate: animation.duration,
  });

  return {
    ...option,
    series: Array.isArray(series)
      ? (series as EChartSeriesItem[]).map(applyAnimation)
      : applyAnimation(series as EChartSeriesItem),
  };
}

function ChartLegend({ entries }: { entries: ChartLegendEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2 pt-1 text-[12px] leading-snug">
      {entries.map((entry) => (
        <div
          key={entry.label}
          className="flex max-w-full min-w-0 items-start gap-1.5"
        >
          <span
            className="mt-[0.3em] h-2.5 w-5 shrink-0 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="max-w-full min-w-0 wrap-break-word whitespace-normal">
            {entry.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function buildLegendPosition(position?: string): Record<string, unknown> {
  switch (position) {
    case "left":
      return { left: 8, top: "middle", orient: "vertical" };
    case "right":
      return { right: 8, top: "middle", orient: "vertical" };
    case "top":
      return { top: 8, left: "center", orient: "horizontal" };
    default:
      return { bottom: 8, left: "center", orient: "horizontal" };
  }
}

function buildBaseOption(
  element: TChartNode,
  previewMode: boolean,
): PresentationEChartsOption {
  const config = buildChartConfigOptions(element);
  const textColor = "var(--presentation-text)";
  const showTooltip = !previewMode;

  return {
    color: element.colors ?? getChartColors(),
    backgroundColor:
      config.background.visible && config.background.fill
        ? config.background.fill
        : "transparent",
    animation: config.animation.enabled,
    animationDuration: config.animation.duration,
    animationDurationUpdate: config.animation.duration,
    animationEasing: "cubicOut",
    animationEasingUpdate: "cubicOut",
    animationThreshold: 10000,
    textStyle: {
      color: textColor,
      fontFamily: "inherit",
    },
    title: config.title
      ? {
          text: config.title.text,
          subtext: config.subtitle?.text,
          left: "center",
          top: 4,
          textStyle: {
            color: config.title.color ?? textColor,
            fontSize: config.title.fontSize,
            fontWeight: 600,
          },
          subtextStyle: {
            color: config.subtitle?.color ?? textColor,
            fontSize: config.subtitle?.fontSize,
          },
        }
      : config.subtitle
        ? {
            subtext: config.subtitle.text,
            left: "center",
            top: 4,
            subtextStyle: {
              color: config.subtitle.color ?? textColor,
              fontSize: config.subtitle.fontSize,
            },
          }
        : undefined,
    legend: {
      show: config.legend.enabled,
      textStyle: { color: textColor },
      ...buildLegendPosition(config.legend.position),
    },
    tooltip: {
      show: showTooltip,
      trigger: "item",
      confine: true,
    },
  };
}

function buildAxisOptions(
  element: TChartNode,
  axis: "x" | "y",
  type: "category" | "value" = "value",
  data?: string[],
): EChartAxis {
  const config = buildChartConfigOptions(element);
  const axisConfig = axis === "x" ? config.xAxis : config.yAxis;
  const name = axisConfig.title?.text;

  return {
    type,
    data,
    name,
    nameTextStyle: { color: "var(--presentation-text)" },
    axisLabel: {
      show: axisConfig.showLabel,
      color: "var(--presentation-text)",
    },
    axisLine: { lineStyle: { color: "rgba(148, 163, 184, 0.6)" } },
    splitLine: {
      show: axisConfig.showGrid,
      lineStyle: { color: "rgba(148, 163, 184, 0.24)" },
    },
  };
}

function labels(dataArray: AnyRecord[], labelKey: string): string[] {
  return dataArray.map((item, index) =>
    toText(item[labelKey], `Item ${index + 1}`),
  );
}

function numericValues(dataArray: AnyRecord[], key: string): number[] {
  return dataArray.map((item) => toNumber(item[key]));
}

function isHistogramBinLabel(value: unknown): value is string {
  if (typeof value !== "string") return false;

  const normalizedValue = value.trim();

  return (
    /^\d+(?:\.\d+)?\s*(?:-|–|—|to)\s*\d+(?:\.\d+)?$/i.test(normalizedValue) ||
    /^(?:<|>|<=|>=)\s*\d+(?:\.\d+)?$/.test(normalizedValue)
  );
}

function getBinnedHistogramData(
  dataArray: AnyRecord[],
): BinnedHistogramData | null {
  if (dataArray.length === 0) return null;

  const first = dataArray[0];
  if (!first) return null;

  const explicitLabelKey = Object.keys(first).find((key) =>
    ["bin", "bucket", "interval", "range", "label", "name"].includes(
      key.toLowerCase(),
    ),
  );
  const labelKey = explicitLabelKey ?? getLabelKey(dataArray);
  const valueKey =
    Object.keys(first).find(
      (key) =>
        ["value", "count", "frequency", "freq"].includes(key.toLowerCase()) &&
        typeof first[key] === "number",
    ) ?? getValueKey(dataArray);

  const labelsAndValues = dataArray.map((item, index) => ({
    label: toText(item[labelKey], `Bin ${index + 1}`),
    value: item[valueKey],
  }));
  const hasValidValues = labelsAndValues.every(
    ({ value }) => typeof value === "number" && Number.isFinite(value),
  );

  if (!hasValidValues) return null;

  const hasExplicitBinKey = Boolean(explicitLabelKey);
  const hasRangeLabels = labelsAndValues.every(({ label }) =>
    isHistogramBinLabel(label),
  );

  if (!hasExplicitBinKey && !hasRangeLabels) return null;

  return {
    labels: labelsAndValues.map(({ label }) => label),
    valueKey,
    values: labelsAndValues.map(({ value }) => value as number),
  };
}

function buildPieSeries(
  dataArray: AnyRecord[],
  labelKey: string,
  valueKey: string,
  radius: string | [string, string],
  roseType?: "radius" | "area",
): EChartSeriesItem {
  return {
    type: "pie",
    radius,
    roseType,
    avoidLabelOverlap: true,
    itemStyle: { borderWidth: 1, borderColor: "rgba(255,255,255,0.28)" },
    label: { color: "var(--presentation-text)" },
    data: dataArray.map((item, index) => ({
      name: toText(item[labelKey], `Item ${index + 1}`),
      value: toNumber(item[valueKey]),
    })),
  };
}

function buildCartesianOption(
  element: TChartNode,
  chartType: "bar" | "line" | "scatter",
  dataArray: AnyRecord[],
  labelKey: string,
  valueKeys: string[],
  horizontal = false,
): Pick<PresentationEChartsOption, "grid" | "xAxis" | "yAxis" | "series"> {
  const categoryLabels = labels(dataArray, labelKey);
  const xAxis = horizontal
    ? buildAxisOptions(element, "x", "value")
    : buildAxisOptions(element, "x", "category", categoryLabels);
  const yAxis = horizontal
    ? buildAxisOptions(element, "y", "category", categoryLabels)
    : buildAxisOptions(element, "y", "value");

  const series = valueKeys.map((key, index) => {
    const color =
      index === 0 ? (element.color ?? getChartColor(0)) : getChartColor(index);
    const values = numericValues(dataArray, key);
    const seriesData = horizontal
      ? values.map((value, pointIndex) => [value, categoryLabels[pointIndex]])
      : values;

    return {
      type: chartType,
      name: keyToLabel(key),
      data: seriesData,
      smooth: chartType === "line" && element.interpolation !== "linear",
      step:
        chartType === "line" && element.interpolation?.startsWith("step")
          ? element.interpolation === "step-start"
            ? "start"
            : element.interpolation === "step-end"
              ? "end"
              : "middle"
          : false,
      itemStyle: { color },
      lineStyle: { color, width: 2 },
      areaStyle:
        chartType === "line" && element.curveType === "natural"
          ? { color, opacity: 0.18 }
          : undefined,
      symbolSize:
        chartType === "scatter" ? (element.marker?.size ?? 10) : undefined,
    };
  });

  return {
    grid: { top: 52, right: 28, bottom: 48, left: 54, containLabel: true },
    xAxis,
    yAxis,
    series: series as EChartSeries,
  };
}

function buildAreaOption(
  element: TChartNode,
  dataArray: AnyRecord[],
  labelKey: string,
  valueKeys: string[],
): Pick<PresentationEChartsOption, "grid" | "xAxis" | "yAxis" | "series"> {
  const base = buildCartesianOption(
    element,
    "line",
    dataArray,
    labelKey,
    valueKeys,
  );
  const series = valueKeys.map((key, index) => {
    const color =
      index === 0 ? (element.color ?? getChartColor(0)) : getChartColor(index);
    return {
      type: "line",
      name: keyToLabel(key),
      data: numericValues(dataArray, key),
      smooth: element.interpolation !== "linear",
      areaStyle: { color, opacity: 0.28 },
      itemStyle: { color },
      lineStyle: { color, width: 2 },
      symbol: "none",
    };
  });

  return { ...base, series: series as EChartSeries };
}

function buildRadarOption(
  element: TChartNode,
  dataArray: AnyRecord[],
  labelKey: string,
  valueKeys: string[],
): Pick<PresentationEChartsOption, "radar" | "series"> {
  const maxValue = Math.max(
    1,
    ...dataArray.flatMap((item) => valueKeys.map((key) => toNumber(item[key]))),
  );

  return {
    radar: {
      indicator: labels(dataArray, labelKey).map((name) => ({
        name,
        max: maxValue * 1.2,
      })),
      axisName: { color: "var(--presentation-text)" },
      splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.28)" } },
      splitArea: { show: false },
    },
    series: [
      {
        type: "radar",
        data: valueKeys.map((key, index) => ({
          name: keyToLabel(key),
          value: numericValues(dataArray, key),
          itemStyle: { color: getChartColor(index) },
          areaStyle:
            element.variant === "outline" ? undefined : { opacity: 0.18 },
          lineStyle: { width: element.variant === "outline" ? 3 : 2 },
        })),
      },
    ] as EChartSeries,
  };
}

function buildScatterOption(
  element: TChartNode,
  dataArray: AnyRecord[],
  bubble: boolean,
): Pick<PresentationEChartsOption, "grid" | "xAxis" | "yAxis" | "series"> {
  const xKey = getXKey(dataArray);
  const yKey = getYKey(dataArray);
  const zKey = getZKey(dataArray);
  const primaryColor = element.color ?? getChartColor(0);

  return {
    grid: { top: 44, right: 28, bottom: 48, left: 54, containLabel: true },
    xAxis: buildAxisOptions(element, "x", "value"),
    yAxis: buildAxisOptions(element, "y", "value"),
    series: [
      {
        type: "scatter",
        name: bubble ? "Bubble" : "Scatter",
        data: dataArray.map((item) => [
          toNumber(item[xKey]),
          toNumber(item[yKey]),
          toNumber(item[zKey], 10),
        ]),
        symbolSize: bubble
          ? (value: unknown) => {
              const tuple = Array.isArray(value) ? value : [];
              return Math.max(8, Math.min(44, toNumber(tuple[2], 10)));
            }
          : (element.marker?.size ?? 10),
        itemStyle: { color: primaryColor, opacity: bubble ? 0.72 : 1 },
      },
    ] as EChartSeries,
  };
}

function buildTreemapData(
  dataArray: AnyRecord[],
  labelKey: string,
  valueKey: string,
): EChartSeriesItem[] {
  return dataArray.map((item, index) => ({
    name: toText(item[labelKey], `Item ${index + 1}`),
    value: toNumber(item[valueKey], 1),
  }));
}

function normalizeHierarchy(dataArray: AnyRecord[]): EChartSeriesItem[] {
  const rowsWithParents = dataArray.filter(
    (item) => typeof item.parent === "string" && item.parent.trim().length > 0,
  );

  if (rowsWithParents.length > 0) {
    const nodeMap = new Map<string, EChartSeriesItem>();
    const childNames = new Set<string>();

    dataArray.forEach((item, index) => {
      const name = toText(item.name, `Item ${index + 1}`);
      nodeMap.set(name, {
        name,
        value: toNumber(item.value, 1),
        children: [],
      });
    });

    dataArray.forEach((item, index) => {
      const name = toText(item.name, `Item ${index + 1}`);
      const parent = toText(item.parent).trim();
      const node = nodeMap.get(name);
      const parentNode = parent.length > 0 ? nodeMap.get(parent) : undefined;

      if (node && parentNode) {
        const currentChildren = Array.isArray(parentNode.children)
          ? (parentNode.children as EChartSeriesItem[])
          : [];
        parentNode.children = [...currentChildren, node];
        childNames.add(name);
      }
    });

    return Array.from(nodeMap.entries())
      .filter(([name]) => !childNames.has(name))
      .map(([, node]) => {
        if (Array.isArray(node.children) && node.children.length === 0) {
          const { children: _children, ...leafNode } = node;
          return leafNode;
        }
        return node;
      });
  }

  return dataArray.map((item, index) => ({
    name: toText(item.name, `Item ${index + 1}`),
    value: toNumber(item.value, 1),
    children: Array.isArray(item.children)
      ? normalizeHierarchy(item.children as AnyRecord[])
      : undefined,
  }));
}

function buildFlowNodes(dataArray: AnyRecord[]): string[] {
  return Array.from(
    new Set(
      dataArray.flatMap((item) => [
        toText(item.from ?? item.source, "Source"),
        toText(item.to ?? item.target, "Target"),
      ]),
    ),
  );
}

function buildFlowLinks(dataArray: AnyRecord[]): EChartSeriesItem[] {
  return dataArray.map((item) => ({
    source: toText(item.from ?? item.source, "Source"),
    target: toText(item.to ?? item.target, "Target"),
    value: toNumber(item.size ?? item.value, 1),
  }));
}

function polarToCartesian(
  center: number,
  radius: number,
  angle: number,
): { x: number; y: number } {
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
}

function describeArc(
  center: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(center, radius, startAngle);
  const end = polarToCartesian(center, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function buildRibbonPath(
  center: number,
  radius: number,
  sourceStartAngle: number,
  sourceEndAngle: number,
  targetStartAngle: number,
  targetEndAngle: number,
): string {
  const sourceStart = polarToCartesian(center, radius, sourceStartAngle);
  const sourceEnd = polarToCartesian(center, radius, sourceEndAngle);
  const targetStart = polarToCartesian(center, radius, targetStartAngle);
  const targetEnd = polarToCartesian(center, radius, targetEndAngle);
  const sourceControl = polarToCartesian(
    center,
    radius * 0.08,
    (sourceStartAngle + sourceEndAngle) / 2,
  );
  const targetControl = polarToCartesian(
    center,
    radius * 0.08,
    (targetStartAngle + targetEndAngle) / 2,
  );
  const sourceLargeArc = sourceEndAngle - sourceStartAngle > Math.PI ? 1 : 0;
  const targetLargeArc = targetEndAngle - targetStartAngle > Math.PI ? 1 : 0;

  return [
    `M ${sourceStart.x} ${sourceStart.y}`,
    `A ${radius} ${radius} 0 ${sourceLargeArc} 1 ${sourceEnd.x} ${sourceEnd.y}`,
    `C ${sourceControl.x} ${sourceControl.y} ${targetControl.x} ${targetControl.y} ${targetStart.x} ${targetStart.y}`,
    `A ${radius} ${radius} 0 ${targetLargeArc} 1 ${targetEnd.x} ${targetEnd.y}`,
    `C ${targetControl.x} ${targetControl.y} ${sourceControl.x} ${sourceControl.y} ${sourceStart.x} ${sourceStart.y}`,
    "Z",
  ].join(" ");
}

function buildChordData(
  dataArray: AnyRecord[],
  element: TChartNode,
): { links: ChordLink[]; nodes: ChordNode[] } {
  const names = buildFlowNodes(dataArray);
  const nodeValues = new Map(names.map((name) => [name, 0]));

  const rawLinks = dataArray.map((item) => {
    const source = toText(item.from ?? item.source, "Source");
    const target = toText(item.to ?? item.target, "Target");
    const value = toNumber(item.size ?? item.value, 1);

    nodeValues.set(source, (nodeValues.get(source) ?? 0) + value);
    nodeValues.set(target, (nodeValues.get(target) ?? 0) + value);

    return { source, target, value };
  });

  const totalValue = Array.from(nodeValues.values()).reduce(
    (total, value) => total + value,
    0,
  );
  const gap = Math.PI / 60;
  const drawableAngle = Math.PI * 2 - gap * names.length;
  let cursor = -Math.PI / 2;

  const nodes = names.map((name, index) => {
    const value = nodeValues.get(name) ?? 0;
    const angle = totalValue > 0 ? (value / totalValue) * drawableAngle : 0;
    const startAngle = cursor;
    const endAngle = cursor + angle;
    cursor = endAngle + gap;

    return {
      color: element.colors?.[index] ?? getChartColor(index),
      endAngle,
      name,
      startAngle,
      value,
    };
  });
  const nodesByName = new Map(nodes.map((node) => [node.name, node]));

  return {
    nodes,
    links: rawLinks.flatMap((link) => {
      const source = nodesByName.get(link.source);
      const target = nodesByName.get(link.target);

      return source && target
        ? [
            {
              color: target.color,
              source,
              target,
              value: link.value,
            },
          ]
        : [];
    }),
  };
}

function CustomChordChart({
  dataArray,
  element,
}: {
  dataArray: AnyRecord[];
  element: TChartNode;
}) {
  const { links, nodes } = React.useMemo(
    () => buildChordData(dataArray, element),
    [dataArray, element],
  );
  const center = 200;
  const outerRadius = 150;
  const ribbonRadius = 126;

  return (
    <svg
      className="h-full min-h-[inherit] w-full overflow-visible"
      role="img"
      viewBox="0 0 400 400"
    >
      <title>Chord chart</title>
      <g>
        {links.map((link) => {
          const sourceAngle =
            (link.source.startAngle + link.source.endAngle) / 2;
          const targetAngle =
            (link.target.startAngle + link.target.endAngle) / 2;
          const sourceShare =
            link.source.value > 0 ? link.value / link.source.value : 0;
          const targetShare =
            link.target.value > 0 ? link.value / link.target.value : 0;
          const sourceHalfSpan =
            ((link.source.endAngle - link.source.startAngle) * sourceShare) / 2;
          const targetHalfSpan =
            ((link.target.endAngle - link.target.startAngle) * targetShare) / 2;

          return (
            <path
              d={buildRibbonPath(
                center,
                ribbonRadius,
                sourceAngle - sourceHalfSpan,
                sourceAngle + sourceHalfSpan,
                targetAngle - targetHalfSpan,
                targetAngle + targetHalfSpan,
              )}
              fill={link.color}
              fillOpacity={Math.min(0.42, 0.18 + link.value / 180)}
              key={`${link.source.name}-${link.target.name}-${link.value}-${link.source.startAngle}-${link.target.startAngle}`}
              stroke="rgba(255,255,255,0.48)"
              strokeWidth={1}
            />
          );
        })}
      </g>
      <g>
        {nodes.map((node) => {
          const labelAngle = (node.startAngle + node.endAngle) / 2;
          const labelPoint = polarToCartesian(
            center,
            outerRadius + 18,
            labelAngle,
          );
          const anchor =
            Math.cos(labelAngle) > 0.2
              ? "start"
              : Math.cos(labelAngle) < -0.2
                ? "end"
                : "middle";
          const label = truncateSvgLabel(
            node.name,
            getAnchoredSvgLabelWidth(anchor, labelPoint.x),
            CHORD_LABEL_FONT_SIZE,
          );

          return (
            <g key={node.name}>
              <path
                d={describeArc(
                  center,
                  outerRadius,
                  node.startAngle,
                  node.endAngle,
                )}
                fill="none"
                stroke={node.color}
                strokeLinecap="round"
                strokeWidth={26}
              />
              <text
                fill={node.color}
                fontSize={CHORD_LABEL_FONT_SIZE}
                textAnchor={anchor}
                x={labelPoint.x}
                y={labelPoint.y}
              >
                <title>{node.name}</title>
                {label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function buildFlowSeries(dataArray: AnyRecord[]): EChartSeriesItem {
  const names = buildFlowNodes(dataArray);

  return {
    type: "sankey",
    data: names.map((name) => ({ name })),
    links: buildFlowLinks(dataArray),
    lineStyle: { color: "gradient", curveness: 0.5 },
    label: { color: "var(--presentation-text)" },
  };
}

function buildFunnelSeries(
  dataArray: AnyRecord[],
  labelKey: string,
  valueKey: string,
  variant: "funnel" | "cone" | "pyramid",
): EChartSeriesItem {
  return {
    type: "funnel",
    sort: variant === "pyramid" ? "ascending" : "descending",
    funnelAlign: "center",
    width: variant === "cone" ? "55%" : "72%",
    minSize: variant === "cone" ? "12%" : "0%",
    maxSize: "100%",
    label: { color: "var(--presentation-text)" },
    data: dataArray.map((item, index) => ({
      name: toText(item[labelKey], `Stage ${index + 1}`),
      value: toNumber(item[valueKey]),
    })),
  };
}

function buildGaugeOption(
  element: TChartNode,
  chartData: unknown,
  dataArray: AnyRecord[],
  linear: boolean,
): Pick<PresentationEChartsOption, "series"> {
  const first = dataArray[0];
  const numericKey = first
    ? Object.keys(first).find((key) => typeof first[key] === "number")
    : undefined;
  const value =
    typeof chartData === "number"
      ? chartData
      : numericKey && first
        ? toNumber(first[numericKey], 50)
        : 50;
  const color = element.color ?? element.bar?.fill ?? getChartColor(0);

  if (linear) {
    return {
      series: [
        {
          type: "custom",
          coordinateSystem: "none",
          renderItem: (
            _params: unknown,
            api: {
              getWidth: () => number;
              getHeight: () => number;
              style: (
                style: Record<string, unknown>,
              ) => Record<string, unknown>;
            },
          ) => {
            const width = api.getWidth();
            const height = api.getHeight();
            const horizontal = element.orientation !== "vertical";
            const trackWidth = horizontal ? width * 0.74 : 18;
            const trackHeight = horizontal ? 18 : height * 0.68;
            const x = (width - trackWidth) / 2;
            const y = (height - trackHeight) / 2;
            const ratio = Math.max(0, Math.min(1, value / 100));
            const fillWidth = horizontal ? trackWidth * ratio : trackWidth;
            const fillHeight = horizontal ? trackHeight : trackHeight * ratio;
            const fillX = x;
            const fillY = horizontal ? y : y + trackHeight - fillHeight;

            return {
              type: "group",
              children: [
                {
                  type: "rect",
                  shape: { x, y, width: trackWidth, height: trackHeight, r: 9 },
                  style: api.style({
                    fill: "rgba(148, 163, 184, 0.22)",
                    stroke: "rgba(148, 163, 184, 0.34)",
                  }),
                },
                {
                  type: "rect",
                  shape: {
                    x: fillX,
                    y: fillY,
                    width: fillWidth,
                    height: fillHeight,
                    r: 9,
                  },
                  style: api.style({ fill: color }),
                },
                {
                  type: "text",
                  style: {
                    text: `${Math.round(value)}`,
                    x: width / 2,
                    y: horizontal ? y - 14 : y + trackHeight + 22,
                    textAlign: "center",
                    textVerticalAlign: "middle",
                    fill: "var(--presentation-text)",
                    fontSize: 18,
                    fontWeight: 600,
                  },
                },
              ],
            };
          },
          data: [value],
        },
      ] as EChartSeries,
    };
  }

  return {
    series: [
      {
        type: "gauge",
        radius: linear ? "70%" : "88%",
        startAngle: linear ? 180 : 220,
        endAngle: linear ? 0 : -40,
        progress: {
          show: true,
          width: linear ? 14 : 18,
          itemStyle: { color },
        },
        axisLine: {
          lineStyle: {
            width: linear ? 14 : 18,
            color: [[1, "rgba(148, 163, 184, 0.22)"]],
          },
        },
        pointer: {
          show: element.needle?.enabled ?? !linear,
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { color: "var(--presentation-text)" },
        detail: {
          valueAnimation: true,
          color: "var(--presentation-text)",
          formatter: "{value}",
        },
        data: [{ value }],
      },
    ] as EChartSeries,
  };
}

function buildHistogram(
  element: TChartNode,
  dataArray: AnyRecord[],
): Pick<PresentationEChartsOption, "grid" | "xAxis" | "yAxis" | "series"> {
  const binnedData = getBinnedHistogramData(dataArray);

  if (binnedData) {
    return {
      grid: { top: 44, right: 28, bottom: 48, left: 54, containLabel: true },
      xAxis: {
        ...buildAxisOptions(element, "x", "category", binnedData.labels),
        boundaryGap: true,
      },
      yAxis: buildAxisOptions(element, "y", "value"),
      series: [
        {
          type: "bar",
          name: keyToLabel(binnedData.valueKey),
          data: binnedData.values,
          barCategoryGap: "0%",
          barGap: "0%",
          itemStyle: { color: element.color ?? getChartColor(0) },
        },
      ] as EChartSeries,
    };
  }

  const first = dataArray[0];
  const xKey =
    first && Object.keys(first).find((key) => typeof first[key] === "number")
      ? Object.keys(first).find((key) => typeof first[key] === "number")!
      : "value";
  const values = numericValues(dataArray, xKey);
  const histogramOptions = element.options as AnyRecord | undefined;
  const nestedHistogramOptions = histogramOptions?.options as
    | AnyRecord
    | undefined;
  const binCount = toNumber(
    histogramOptions?.binCount ?? nestedHistogramOptions?.binCount,
    7,
  );
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 1;
  const range = max - min;
  const width = range > 0 ? range / binCount : 1;
  const bins = Array.from({ length: binCount }, (_, index) => ({
    label: `${Math.round(min + index * width)}-${Math.round(min + (index + 1) * width)}`,
    count: 0,
  }));

  for (const value of values) {
    const index = Math.min(
      binCount - 1,
      Math.max(0, Math.floor((value - min) / width)),
    );
    const bin = bins[index];
    if (bin) bin.count += 1;
  }

  return {
    grid: { top: 44, right: 28, bottom: 48, left: 54, containLabel: true },
    xAxis: {
      ...buildAxisOptions(
        element,
        "x",
        "category",
        bins.map((bin) => bin.label),
      ),
      boundaryGap: true,
    },
    yAxis: buildAxisOptions(element, "y", "value"),
    series: [
      {
        type: "bar",
        name: keyToLabel(xKey),
        data: bins.map((bin) => bin.count),
        barCategoryGap: "0%",
        barGap: "0%",
        itemStyle: { color: element.color ?? getChartColor(0) },
      },
    ] as EChartSeries,
  };
}

function buildHeatmap(
  element: TChartNode,
  dataArray: AnyRecord[],
): Pick<
  PresentationEChartsOption,
  "grid" | "xAxis" | "yAxis" | "visualMap" | "series"
> {
  const xValues = Array.from(
    new Set(dataArray.map((item) => toText(item.x, "X"))),
  );
  const yValues = Array.from(
    new Set(dataArray.map((item) => toText(item.y, "Y"))),
  );
  const values = dataArray.map((item) => toNumber(item.value));

  return {
    grid: { top: 44, right: 28, bottom: 48, left: 54, containLabel: true },
    xAxis: buildAxisOptions(element, "x", "category", xValues),
    yAxis: buildAxisOptions(element, "y", "category", yValues),
    visualMap: {
      min: Math.min(...values, 0),
      max: Math.max(...values, 1),
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: 0,
      inRange: { color: ["#dbeafe", "#2563eb"] },
      textStyle: { color: "var(--presentation-text)" },
    },
    series: [
      {
        type: "heatmap",
        data: dataArray.map((item) => [
          xValues.indexOf(toText(item.x, "X")),
          yValues.indexOf(toText(item.y, "Y")),
          toNumber(item.value),
        ]),
        label: { show: false },
      },
    ] as EChartSeries,
  };
}

function buildRangeBar(
  element: TChartNode,
  dataArray: AnyRecord[],
): Pick<PresentationEChartsOption, "grid" | "xAxis" | "yAxis" | "series"> {
  const categoryLabels = dataArray.map((item, index) =>
    toText(item.category, `Item ${index + 1}`),
  );
  const lowValues = numericValues(dataArray, "low");
  const ranges = dataArray.map(
    (item) => toNumber(item.high) - toNumber(item.low),
  );
  const horizontal = element.orientation === "horizontal";

  return {
    grid: { top: 44, right: 28, bottom: 48, left: 54, containLabel: true },
    xAxis: horizontal
      ? buildAxisOptions(element, "x", "value")
      : buildAxisOptions(element, "x", "category", categoryLabels),
    yAxis: horizontal
      ? buildAxisOptions(element, "y", "category", categoryLabels)
      : buildAxisOptions(element, "y", "value"),
    series: [
      {
        type: "bar",
        stack: "range",
        data: lowValues,
        itemStyle: { color: "transparent" },
        emphasis: { disabled: true },
      },
      {
        type: "bar",
        stack: "range",
        name: "Range",
        data: ranges,
        itemStyle: { color: element.color ?? getChartColor(0) },
      },
    ] as EChartSeries,
  };
}

function buildRangeArea(
  element: TChartNode,
  dataArray: AnyRecord[],
): Pick<PresentationEChartsOption, "grid" | "xAxis" | "yAxis" | "series"> {
  const categoryLabels = dataArray.map((item, index) =>
    toText(item.date ?? item.category, `Item ${index + 1}`),
  );
  const color = element.color ?? getChartColor(0);
  const lowValues = numericValues(dataArray, "low");
  const rangeValues = dataArray.map(
    (item) => toNumber(item.high) - toNumber(item.low),
  );

  return {
    grid: { top: 44, right: 28, bottom: 48, left: 54, containLabel: true },
    xAxis: buildAxisOptions(element, "x", "category", categoryLabels),
    yAxis: buildAxisOptions(element, "y", "value"),
    series: [
      {
        type: "line",
        name: "Low",
        stack: "range-band",
        data: lowValues,
        lineStyle: { color: "transparent", width: 0 },
        itemStyle: { color: "transparent" },
        areaStyle: { color: "transparent" },
        symbol: "none",
        tooltip: { show: false },
      },
      {
        type: "line",
        name: "High",
        stack: "range-band",
        data: rangeValues,
        lineStyle: { color, width: 2 },
        itemStyle: { color },
        areaStyle: { color, opacity: 0.22 },
        symbol: "none",
      },
      {
        type: "line",
        name: "Low",
        data: lowValues,
        lineStyle: { color, width: 1, type: "dashed" },
        itemStyle: { color },
        symbol: "none",
      },
    ] as EChartSeries,
  };
}

function buildWaterfall(
  element: TChartNode,
  dataArray: AnyRecord[],
): Pick<PresentationEChartsOption, "grid" | "xAxis" | "yAxis" | "series"> {
  const categoryLabels = dataArray.map((item, index) =>
    toText(item.category, `Item ${index + 1}`),
  );
  let runningTotal = 0;
  const offsets: number[] = [];
  const values: number[] = [];

  for (const item of dataArray) {
    const amount = toNumber(item.amount);
    offsets.push(Math.min(runningTotal, runningTotal + amount));
    values.push(Math.abs(amount));
    runningTotal += amount;
  }

  return {
    grid: { top: 44, right: 28, bottom: 48, left: 54, containLabel: true },
    xAxis: buildAxisOptions(element, "x", "category", categoryLabels),
    yAxis: buildAxisOptions(element, "y", "value"),
    series: [
      {
        type: "bar",
        stack: "waterfall",
        data: offsets,
        itemStyle: { color: "transparent" },
        emphasis: { disabled: true },
      },
      {
        type: "bar",
        stack: "waterfall",
        name: "Amount",
        data: values,
        itemStyle: {
          color: (params: { dataIndex: number }) =>
            toNumber(dataArray[params.dataIndex]?.amount) >= 0
              ? (element.color ?? getChartColor(0))
              : "#ef4444",
        },
      },
    ] as EChartSeries,
  };
}

function buildFinancial(
  element: TChartNode,
  dataArray: AnyRecord[],
  boxPlot = false,
): Pick<PresentationEChartsOption, "grid" | "xAxis" | "yAxis" | "series"> {
  const categoryLabels = dataArray.map((item, index) =>
    toText(item.date ?? item.category, `Item ${index + 1}`),
  );
  const data = boxPlot
    ? dataArray.map((item) => [
        toNumber(item.min),
        toNumber(item.q1),
        toNumber(item.median),
        toNumber(item.q3),
        toNumber(item.max),
      ])
    : dataArray.map((item) => [
        toNumber(item.open),
        toNumber(item.close),
        toNumber(item.low),
        toNumber(item.high),
      ]);

  return {
    grid: { top: 44, right: 28, bottom: 48, left: 54, containLabel: true },
    xAxis: buildAxisOptions(element, "x", "category", categoryLabels),
    yAxis: buildAxisOptions(element, "y", "value"),
    series: [
      {
        type: boxPlot ? "boxplot" : "candlestick",
        name: boxPlot ? "Distribution" : "OHLC",
        data,
        itemStyle: {
          color: "#16a34a",
          color0: "#ef4444",
          borderColor: "#16a34a",
          borderColor0: "#ef4444",
        },
      },
    ] as EChartSeries,
  };
}

function buildOhlcOption(
  element: TChartNode,
  dataArray: AnyRecord[],
): Pick<
  PresentationEChartsOption,
  "grid" | "xAxis" | "yAxis" | "tooltip" | "axisPointer" | "series"
> {
  const categoryLabels = dataArray.map((item, index) =>
    toText(item.date ?? item.category, `Item ${index + 1}`),
  );
  const values = dataArray.map((item, index) => [
    index,
    toNumber(item.open),
    toNumber(item.close),
    toNumber(item.low),
    toNumber(item.high),
  ]);

  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "cross" },
      confine: true,
    },
    axisPointer: { link: [{ xAxisIndex: "all" }] },
    grid: { top: 44, right: 28, bottom: 48, left: 54, containLabel: true },
    xAxis: {
      ...buildAxisOptions(element, "x", "category", categoryLabels),
      boundaryGap: false,
      axisLine: { onZero: false },
      min: "dataMin",
      max: "dataMax",
      axisPointer: { z: 100 },
    },
    yAxis: {
      ...buildAxisOptions(element, "y", "value"),
      scale: true,
      splitArea: { show: true },
    },
    series: [
      {
        name: "OHLC",
        type: "custom",
        dimensions: ["-", "open", "close", "lowest", "highest"],
        encode: {
          x: 0,
          y: [1, 2, 3, 4],
          tooltip: [1, 2, 3, 4],
        },
        renderItem: (
          _params: unknown,
          api: {
            value: (dimension: number) => number;
            coord: (data: [number, number]) => [number, number];
            size: (data: [number, number]) => [number, number];
            style: (style: Record<string, unknown>) => Record<string, unknown>;
            visual: (key: string) => unknown;
          },
        ) => {
          const xValue = api.value(0);
          const openPoint = api.coord([xValue, api.value(1)]);
          const closePoint = api.coord([xValue, api.value(2)]);
          const lowPoint = api.coord([xValue, api.value(3)]);
          const highPoint = api.coord([xValue, api.value(4)]);
          const halfWidth = api.size([1, 0])[0] * 0.35;
          const style = api.style({ stroke: api.visual("color") });

          return {
            type: "group",
            children: [
              {
                type: "line",
                shape: {
                  x1: lowPoint[0],
                  y1: lowPoint[1],
                  x2: highPoint[0],
                  y2: highPoint[1],
                },
                style,
              },
              {
                type: "line",
                shape: {
                  x1: openPoint[0],
                  y1: openPoint[1],
                  x2: openPoint[0] - halfWidth,
                  y2: openPoint[1],
                },
                style,
              },
              {
                type: "line",
                shape: {
                  x1: closePoint[0],
                  y1: closePoint[1],
                  x2: closePoint[0] + halfWidth,
                  y2: closePoint[1],
                },
                style,
              },
            ],
          };
        },
        data: values,
      },
    ] as EChartSeries,
  };
}

function buildComposed(
  element: TChartNode,
  dataArray: AnyRecord[],
  labelKey: string,
  valueKeys: string[],
): Pick<PresentationEChartsOption, "grid" | "xAxis" | "yAxis" | "series"> {
  const categoryLabels = labels(dataArray, labelKey);
  const seriesChartTypes = element.seriesChartTypes ?? {};
  const fallbackTypes: SeriesChartType[] = ["bar", "line", "area"];

  return {
    grid: { top: 52, right: 28, bottom: 48, left: 54, containLabel: true },
    xAxis: buildAxisOptions(element, "x", "category", categoryLabels),
    yAxis: buildAxisOptions(element, "y", "value"),
    series: valueKeys.map((key, index) => {
      const selectedType =
        seriesChartTypes[key] ?? fallbackTypes[index % fallbackTypes.length]!;
      const color = getChartColor(index);
      const type = selectedType === "area" ? "line" : selectedType;

      return {
        type,
        name: keyToLabel(key),
        data: numericValues(dataArray, key),
        smooth: selectedType !== "bar",
        areaStyle:
          selectedType === "area" ? { color, opacity: 0.24 } : undefined,
        itemStyle: { color },
        lineStyle: { color, width: 2 },
        symbolSize: selectedType === "scatter" ? 8 : undefined,
      };
    }) as EChartSeries,
  };
}

function buildChartOption(
  chartType: string,
  chartData: unknown,
  element: TChartNode,
): PresentationEChartsOption | null {
  const dataArray = toRecordArray(chartData);
  const labelKey = getLabelKey(dataArray);
  const valueKey = getValueKey(dataArray);
  const valueKeys = getValueKeys(dataArray);
  const primaryColor = element.color ?? getChartColor(0);
  const previewMode = element.previewMode === true;
  const base = buildBaseOption(element, previewMode);

  switch (chartType) {
    case PIE_CHART_ELEMENT:
      return {
        ...base,
        series: [
          buildPieSeries(dataArray, labelKey, valueKey, "68%"),
        ] as EChartSeries,
      };
    case DONUT_CHART_ELEMENT:
      return {
        ...base,
        series: [
          buildPieSeries(dataArray, labelKey, valueKey, [
            `${Math.round((element.innerRadiusRatio ?? 0.58) * 55)}%`,
            "70%",
          ]),
        ] as EChartSeries,
        graphic: element.innerLabels?.map((label, index) => ({
          type: "text",
          left: "center",
          top: `${47 + index * 7}%`,
          style: {
            text: label.text,
            fill: label.color ?? "var(--presentation-text)",
            fontSize: label.fontSize ?? 13,
            fontWeight: label.fontWeight ?? "normal",
            textAlign: "center",
          },
        })),
      };
    case BAR_CHART_ELEMENT:
      return {
        ...base,
        ...buildCartesianOption(
          element,
          "bar",
          dataArray,
          labelKey,
          [valueKey],
          element.orientation === "horizontal",
        ),
      };
    case LINE_CHART_ELEMENT:
      return {
        ...base,
        ...buildCartesianOption(
          element,
          "line",
          dataArray,
          labelKey,
          valueKeys,
        ),
      };
    case AREA_CHART_ELEMENT:
      return {
        ...base,
        ...buildAreaOption(element, dataArray, labelKey, valueKeys),
      };
    case RADAR_CHART_ELEMENT:
      return {
        ...base,
        ...buildRadarOption(element, dataArray, labelKey, valueKeys),
      };
    case SCATTER_CHART_ELEMENT:
      return { ...base, ...buildScatterOption(element, dataArray, false) };
    case BUBBLE_CHART_ELEMENT:
      return { ...base, ...buildScatterOption(element, dataArray, true) };
    case RADIAL_BAR_CHART_ELEMENT:
      return {
        ...base,
        angleAxis: {
          max: Math.max(...numericValues(dataArray, valueKey), 1) * 1.15,
          startAngle: 30,
          splitLine: { show: false },
          axisLabel: { color: "var(--presentation-text)" },
        },
        radiusAxis: {
          type: "category",
          data: labels(dataArray, labelKey),
          z: 10,
          axisLabel: { color: "var(--presentation-text)" },
        },
        polar: {},
        series: [
          {
            type: "bar",
            data: numericValues(dataArray, valueKey),
            coordinateSystem: "polar",
            name: keyToLabel(valueKey),
            roundCap: true,
            itemStyle: {
              color: primaryColor,
              opacity: 0.84,
              borderColor: primaryColor,
              borderWidth: 1,
            },
          },
        ] as EChartSeries,
      };
    case RADIAL_COLUMN_CHART_ELEMENT:
      return {
        ...base,
        polar: { radius: "72%" },
        angleAxis: {
          type: "category",
          data: labels(dataArray, labelKey),
          axisLabel: { color: "var(--presentation-text)" },
        },
        radiusAxis: {
          axisLabel: { color: "var(--presentation-text)" },
          splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.24)" } },
        },
        series: [
          {
            type: "bar",
            coordinateSystem: "polar",
            data: numericValues(dataArray, valueKey),
            itemStyle: { color: primaryColor },
          },
        ] as EChartSeries,
      };
    case TREEMAP_CHART_ELEMENT:
      return {
        ...base,
        series: [
          {
            type: "treemap",
            roam: false,
            data: buildTreemapData(dataArray, labelKey, valueKey),
            label: { color: "#fff" },
          },
        ] as EChartSeries,
      };
    case SUNBURST_CHART_ELEMENT:
      return {
        ...base,
        series: [
          {
            type: "sunburst",
            radius: [0, "78%"],
            data: normalizeHierarchy(dataArray),
            label: { color: "var(--presentation-text)" },
          },
        ] as EChartSeries,
      };
    case SANKEY_CHART_ELEMENT:
      return {
        ...base,
        series: [
          buildFlowSeries(
            toRecordArray(sanitizeSankeyCycleData(chartData).data),
          ),
        ] as EChartSeries,
      };
    case CHORD_CHART_ELEMENT:
      return null;
    case FUNNEL_CHART_ELEMENT:
      return {
        ...base,
        series: [
          buildFunnelSeries(dataArray, labelKey, valueKey, "funnel"),
        ] as EChartSeries,
      };
    case CONE_FUNNEL_CHART_ELEMENT:
      return {
        ...base,
        series: [
          buildFunnelSeries(dataArray, labelKey, valueKey, "cone"),
        ] as EChartSeries,
      };
    case PYRAMID_CHART_ELEMENT:
      return {
        ...base,
        series: [
          buildFunnelSeries(dataArray, labelKey, valueKey, "pyramid"),
        ] as EChartSeries,
      };
    case NIGHTINGALE_CHART_ELEMENT:
      return {
        ...base,
        series: [
          buildPieSeries(dataArray, labelKey, valueKey, "70%", "radius"),
        ] as EChartSeries,
      };
    case HISTOGRAM_CHART_ELEMENT:
      return { ...base, ...buildHistogram(element, dataArray) };
    case HEATMAP_CHART_ELEMENT:
      return { ...base, ...buildHeatmap(element, dataArray) };
    case RANGE_BAR_CHART_ELEMENT:
      return { ...base, ...buildRangeBar(element, dataArray) };
    case RANGE_AREA_CHART_ELEMENT:
      return { ...base, ...buildRangeArea(element, dataArray) };
    case WATERFALL_CHART_ELEMENT:
      return { ...base, ...buildWaterfall(element, dataArray) };
    case CANDLESTICK_CHART_ELEMENT:
      return { ...base, ...buildFinancial(element, dataArray) };
    case OHLC_CHART_ELEMENT:
      return { ...base, ...buildOhlcOption(element, dataArray) };
    case BOX_PLOT_CHART_ELEMENT:
      return { ...base, ...buildFinancial(element, dataArray, true) };
    case COMPOSED_CHART_ELEMENT:
      return {
        ...base,
        ...buildComposed(element, dataArray, labelKey, valueKeys),
      };
    case RADIAL_GAUGE_ELEMENT:
      return {
        ...base,
        ...buildGaugeOption(element, chartData, dataArray, false),
      };
    case LINEAR_GAUGE_ELEMENT:
      return {
        ...base,
        ...buildGaugeOption(element, chartData, dataArray, true),
      };
    default:
      return null;
  }
}

export function ChartRenderer({
  chartType,
  chartData,
  chartOptions = EMPTY_CHART_OPTIONS,
  className,
  style,
}: ChartRendererProps) {
  const element = React.useMemo(
    () =>
      ({
        type: chartType,
        ...chartOptions,
      }) as TChartNode,
    [chartOptions, chartType],
  );
  const previewMode = chartOptions.previewMode === true;
  const isPresenting = usePresentationState((state) => state.isPresenting);
  const dataArray = React.useMemo(() => toRecordArray(chartData), [chartData]);
  const isChordChart = chartType === CHORD_CHART_ELEMENT;
  const option = React.useMemo(
    () =>
      isChordChart ? null : buildChartOption(chartType, chartData, element),
    [chartData, chartType, element, isChordChart],
  );
  const legendEntries = React.useMemo(() => {
    if (isChordChart) {
      return buildChordData(dataArray, element).nodes.map((node) => ({
        color: node.color,
        label: node.name,
      }));
    }

    return option && isLegendEnabled(option)
      ? buildLegendEntries(option, element)
      : [];
  }, [dataArray, element, isChordChart, option]);
  const chartOption = React.useMemo(() => {
    if (!option) return option;

    const optionWithLegend =
      legendEntries.length > 0 ? disableBuiltInLegend(option) : option;

    return withSeriesAnimation(
      optionWithLegend,
      getChartAnimationSettings(element),
    );
  }, [element, legendEntries.length, option]);

  if (isChordChart) {
    return (
      <div
        className={cn(DEFAULT_CONTAINER_CLASS, className)}
        data-presentation-chart={chartType}
        style={{
          backgroundColor: "var(--presentation-background)",
          color: "var(--presentation-text)",
          borderColor: "hsl(var(--border))",
          ...style,
        }}
      >
        <div className="flex min-h-[inherit] w-full flex-1 flex-col">
          <div className="min-h-[inherit] flex-1">
            <CustomChordChart dataArray={dataArray} element={element} />
          </div>
          <ChartLegend entries={legendEntries} />
        </div>
      </div>
    );
  }

  if (!chartOption) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center bg-muted/30 p-4",
          className,
        )}
        style={style}
      >
        <p className="text-sm text-muted-foreground">
          Unsupported chart type: {chartType}
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(DEFAULT_CONTAINER_CLASS, className)}
      data-presentation-chart={chartType}
      style={{
        backgroundColor: "var(--presentation-background)",
        color: "var(--presentation-text)",
        borderColor: "hsl(var(--border))",
        ...style,
      }}
    >
      <div className="flex min-h-[inherit] w-full flex-1 flex-col">
        <EChartWrapper
          animationReplayDelayMs={
            isPresenting ? PRESENT_MODE_ANIMATION_REPLAY_DELAY_MS : 0
          }
          className="min-h-[inherit] flex-1"
          isPresenting={isPresenting}
          options={chartOption}
          previewMode={previewMode}
        />
        <ChartLegend entries={legendEntries} />
      </div>
    </div>
  );
}
