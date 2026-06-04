"use client";

import { type ReactNode } from "react";

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
} from "@/components/notebook/presentation/editor/lib";
import * as TemplatePreviews from "@/components/notebook/presentation/utils/template-previews";
import { cn } from "@/lib/utils";

const CHART_PREVIEWS: Record<string, ReactNode> = {
  [AREA_CHART_ELEMENT]: <TemplatePreviews.AreaChartPreview />,
  [BAR_CHART_ELEMENT]: <TemplatePreviews.BarChartPreview />,
  [BOX_PLOT_CHART_ELEMENT]: <TemplatePreviews.BoxPlotChartPreview />,
  [BUBBLE_CHART_ELEMENT]: <TemplatePreviews.BubbleChartPreview />,
  [CANDLESTICK_CHART_ELEMENT]: <TemplatePreviews.CandlestickChartPreview />,
  [CHORD_CHART_ELEMENT]: <TemplatePreviews.ChordChartPreview />,
  [COMPOSED_CHART_ELEMENT]: <TemplatePreviews.CombinationChartPreview />,
  [CONE_FUNNEL_CHART_ELEMENT]: <TemplatePreviews.ConeFunnelChartPreview />,
  [DONUT_CHART_ELEMENT]: <TemplatePreviews.DonutChartPreview />,
  [FUNNEL_CHART_ELEMENT]: <TemplatePreviews.FunnelChartPreview />,
  [HEATMAP_CHART_ELEMENT]: <TemplatePreviews.HeatmapChartPreview />,
  [HISTOGRAM_CHART_ELEMENT]: <TemplatePreviews.HistogramChartPreview />,
  [LINE_CHART_ELEMENT]: <TemplatePreviews.LineChartPreview />,
  [LINEAR_GAUGE_ELEMENT]: <TemplatePreviews.LinearGaugeChartPreview />,
  [NIGHTINGALE_CHART_ELEMENT]: <TemplatePreviews.NightingaleChartPreview />,
  [OHLC_CHART_ELEMENT]: <TemplatePreviews.OHLCChartPreview />,
  [PIE_CHART_ELEMENT]: <TemplatePreviews.PieChartPreview />,
  [PYRAMID_CHART_ELEMENT]: <TemplatePreviews.PyramidChartPreview2 />,
  [RADAR_CHART_ELEMENT]: <TemplatePreviews.RadarLineChartPreview />,
  [RADIAL_BAR_CHART_ELEMENT]: <TemplatePreviews.RadialBarChartPreview />,
  [RADIAL_COLUMN_CHART_ELEMENT]: <TemplatePreviews.RadialColumnChartPreview />,
  [RADIAL_GAUGE_ELEMENT]: <TemplatePreviews.RadialGaugeChartPreview />,
  [RANGE_AREA_CHART_ELEMENT]: <TemplatePreviews.RangeAreaChartPreview />,
  [RANGE_BAR_CHART_ELEMENT]: <TemplatePreviews.RangeBarChartPreview />,
  [SANKEY_CHART_ELEMENT]: <TemplatePreviews.SankeyChartPreview />,
  [SCATTER_CHART_ELEMENT]: <TemplatePreviews.ScatterChartPreview />,
  [SUNBURST_CHART_ELEMENT]: <TemplatePreviews.SunburstChartPreview />,
  [TREEMAP_CHART_ELEMENT]: <TemplatePreviews.TreemapChartPreview />,
  [WATERFALL_CHART_ELEMENT]: <TemplatePreviews.WaterfallChartPreview />,
};

interface ChartPreviewProps {
  chartType: string;
  className?: string;
}

export function ChartPreview({ chartType, className }: ChartPreviewProps) {
  const preview = CHART_PREVIEWS[chartType] ?? (
    <TemplatePreviews.BarChartPreview />
  );

  return (
    <div
      className={cn(
        "pointer-events-none aspect-4/3 w-full overflow-hidden rounded-sm border bg-card select-none **:pointer-events-none **:select-none",
        className,
      )}
    >
      {preview}
    </div>
  );
}
