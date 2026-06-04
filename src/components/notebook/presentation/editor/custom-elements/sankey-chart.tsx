"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";

import { type TChartNode } from "../plugins/chart-plugin";
import { ChartRenderer } from "./charts/ChartRenderer";

export default function SankeyChartElement(
  props: PlateElementProps<TChartNode>,
) {
  const element = props.element;

  return (
    <PlateElement {...props}>
      <div
        className="relative mb-4 w-full"
        contentEditable={false}
        data-slate-chart={String(element.type)}
      >
        <ChartRenderer
          chartType={String(element.type)}
          chartData={element.data}
          chartOptions={element as unknown as Record<string, unknown>}
          className="min-h-64"
        />
      </div>
    </PlateElement>
  );
}
