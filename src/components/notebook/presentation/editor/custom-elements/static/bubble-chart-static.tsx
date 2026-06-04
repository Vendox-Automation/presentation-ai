"use client";

import { SlateElement, type SlateElementProps } from "platejs/static";

import { type TChartNode } from "../../plugins/chart-plugin";
import { ChartRenderer } from "../charts/ChartRenderer";

export default function BubbleChartStatic(
  props: SlateElementProps<TChartNode>,
) {
  const element = props.element;

  return (
    <SlateElement {...props}>
      <div
        className="relative mb-4 w-full"
        data-slate-chart={String(element.type)}
      >
        <ChartRenderer
          chartType={String(element.type)}
          chartData={element.data}
          chartOptions={element as unknown as Record<string, unknown>}
          className="min-h-64"
        />
      </div>
    </SlateElement>
  );
}
