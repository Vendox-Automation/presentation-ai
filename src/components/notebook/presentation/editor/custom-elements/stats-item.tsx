"use client";

import { Star } from "lucide-react";
import { NodeApi, PathApi } from "platejs";
import {
  PlateElement,
  useReadOnly,
  type PlateElementProps,
} from "platejs/react";

import { cn } from "@/lib/utils";
import {
  type TStatsGroupElement,
  type TStatsItemElement,
} from "../plugins/stats-plugin";
import { getAlignmentClasses } from "../utils";
import { getPresentationAccentColor } from "./color-utils";

interface StatValueProps {
  className: string;
  color: string;
  fitToContent?: boolean;
  isReadOnly: boolean;
  stat: string;
  onChange: (newStat: string) => void;
  onFocus: () => void;
}

function StatValue({
  className,
  color,
  fitToContent = false,
  isReadOnly,
  stat,
  onChange,
  onFocus,
}: StatValueProps) {
  if (isReadOnly) {
    return (
      <span
        className={cn("inline-block max-w-full wrap-anywhere", className)}
        style={{ color }}
      >
        {stat}
      </span>
    );
  }

  return (
    <input
      aria-label="stats item control"
      type="text"
      value={stat}
      onFocus={onFocus}
      onKeyDown={(e) => {
        e.stopPropagation();
      }}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onChange(e.target.value)}
      className={cn(
        "max-w-full min-w-0 border-none bg-transparent outline-none",
        className,
      )}
      style={{
        color,
        ...(fitToContent ? { width: `${Math.max(stat.length, 1) + 1}ch` } : {}),
      }}
    />
  );
}

interface StatsItemVisualProps {
  alignment: "left" | "center" | "right";
  color?: string;
  isReadOnly: boolean;
  stat: string;
  statsType: NonNullable<TStatsGroupElement["statsType"]>;
  onChange: (newStat: string) => void;
  onFocus: () => void;
}

function StatsItemVisual({
  alignment,
  color,
  isReadOnly,
  stat,
  statsType,
  onChange,
  onFocus,
}: StatsItemVisualProps) {
  const statValue = parseFloat(stat) || 0;
  const percentage = Math.min(Math.max(statValue, 0), 100);
  const primaryColor = color || "var(--presentation-primary)";
  const ringTrackColor =
    "var(--presentation-card-background, var(--presentation-primary))";
  const ringProgressColor =
    color || "var(--presentation-smart-layout, var(--presentation-primary))";
  const smartColor =
    color || "var(--presentation-smart-layout, var(--presentation-primary))";

  switch (statsType) {
    case "plain":
      return (
        <div
          className={cn(
            "w-full min-w-0 text-6xl font-bold text-primary",
            getAlignmentClasses(alignment),
          )}
        >
          <StatValue
            className={cn("text-6xl font-bold", getAlignmentClasses(alignment))}
            color={primaryColor}
            fitToContent
            isReadOnly={isReadOnly}
            stat={stat}
            onChange={onChange}
            onFocus={onFocus}
          />
        </div>
      );

    case "circle":
      return (
        <div className="relative size-32">
          <svg className="h-full w-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={ringTrackColor}
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={ringProgressColor}
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <StatValue
              className="w-full text-center text-2xl font-bold"
              color={primaryColor}
              isReadOnly={isReadOnly}
              stat={stat}
              onChange={onChange}
              onFocus={onFocus}
            />
          </div>
        </div>
      );

    case "circle-bold":
      return (
        <div className="relative size-35">
          <svg className="h-full w-full" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={ringTrackColor}
              strokeWidth="12"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={ringProgressColor}
              strokeWidth="12"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
              transform="rotate(-90 50 50)"
            />
            <circle
              cx="50"
              cy="50"
              r="30"
              fill="none"
              stroke={ringTrackColor}
              strokeWidth="4"
              opacity="0.4"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <StatValue
              className="w-full text-center text-2xl font-bold"
              color={smartColor}
              isReadOnly={isReadOnly}
              stat={stat}
              onChange={onChange}
              onFocus={onFocus}
            />
          </div>
        </div>
      );

    case "star":
      const filledStars = statValue % 5 || 5;
      return (
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-8 w-8",
                  i < filledStars
                    ? "fill-current text-primary"
                    : "text-gray-300",
                )}
                style={{
                  color: smartColor,
                }}
              />
            ))}
          </div>
          <StatValue
            className="w-full text-center text-2xl font-bold"
            color={smartColor}
            isReadOnly={isReadOnly}
            stat={stat}
            onChange={onChange}
            onFocus={onFocus}
          />
        </div>
      );

    case "bar":
      return (
        <div className="flex w-full items-center gap-1">
          <div className="h-8 w-full flex-1 border border-(--presentation-smart-layout) bg-(--presentation-background)">
            <div
              className="h-8 transition-all duration-300"
              style={{
                width: `${percentage}%`,
                backgroundColor: color || "var(--presentation-secondary)",
              }}
            />
          </div>
          <StatValue
            className="min-w-max text-center text-2xl font-bold"
            color={smartColor}
            fitToContent
            isReadOnly={isReadOnly}
            stat={stat}
            onChange={onChange}
            onFocus={onFocus}
          />
        </div>
      );

    case "dot-grid":
      const filledDots = Math.round((percentage / 100) * 100);
      return (
        <div className="flex flex-col gap-2">
          <div className="grid size-32 grid-cols-10 gap-1">
            {Array.from({ length: 100 }).map((_, i) => (
              <div
                key={i}
                className="size-2 rounded-full"
                style={{
                  backgroundColor:
                    i < filledDots
                      ? "var(--presentation-secondary)"
                      : smartColor,
                }}
              />
            ))}
          </div>
          <StatValue
            className="w-full text-2xl font-bold"
            color={smartColor}
            isReadOnly={isReadOnly}
            stat={stat}
            onChange={onChange}
            onFocus={onFocus}
          />
        </div>
      );

    case "dot-line":
      const filledLineDots = Math.round((percentage / 100) * 20);
      return (
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="size-4 rounded-full"
                style={{
                  backgroundColor:
                    i < filledLineDots
                      ? "var(--presentation-secondary)"
                      : smartColor,
                }}
              />
            ))}
          </div>
          <StatValue
            className="w-full text-2xl font-bold"
            color={smartColor}
            isReadOnly={isReadOnly}
            stat={stat}
            onChange={onChange}
            onFocus={onFocus}
          />
        </div>
      );

    default:
      return null;
  }
}

export const StatsItem = (props: PlateElementProps<TStatsItemElement>) => {
  const readOnly = useReadOnly();
  // Get parent element for variant and color information
  const parentPath = PathApi.parent(props.path);
  const parentElement = NodeApi.get(
    props.editor,
    parentPath,
  ) as TStatsGroupElement;

  const statsType = parentElement?.statsType ?? "plain";
  const { stat = "0" } = props.element;

  // Get alignment - use item alignment if set, otherwise inherit from parent
  const itemAlignment = props.element.alignment;
  const parentAlignment = parentElement?.alignment;
  const alignment = itemAlignment ?? parentAlignment ?? "left";
  const accentColor = getPresentationAccentColor(
    props.element,
    parentElement,
    "var(--presentation-primary)",
  );

  const handleStatChange = (newStat: string) => {
    if (readOnly) return;
    const itemPath = props.editor.api.findPath(props.element);
    if (!itemPath) return;
    props.editor.tf.setNodes({ stat: newStat }, { at: itemPath });
  };

  const blurEditor = () => {
    props.editor.tf.blur();
  };

  return (
    <PlateElement
      {...props}
      className={cn("grid min-w-0 grid-flow-row grid-cols-1 gap-4 p-6")}
    >
      <div
        className="flex h-max w-full min-w-0"
        contentEditable={false}
        data-decor="true"
        data-slate-void="true"
      >
        <StatsItemVisual
          alignment={alignment}
          color={accentColor}
          isReadOnly={readOnly}
          stat={stat}
          statsType={statsType}
          onChange={handleStatChange}
          onFocus={blurEditor}
        />
      </div>

      <div className={cn(getAlignmentClasses(alignment))}>
        <div>{props.children}</div>
      </div>
    </PlateElement>
  );
};
