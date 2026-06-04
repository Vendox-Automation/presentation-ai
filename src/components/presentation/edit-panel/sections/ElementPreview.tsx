"use client";

import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleUserRound,
  FileText,
  Info,
  List,
  ListChecks,
  ListOrdered,
  Sigma,
  Star,
  Tag,
  ToggleLeft,
} from "lucide-react";
import { type ReactNode } from "react";

import * as TemplatePreviews from "@/components/notebook/presentation/utils/template-previews";
import { cn } from "@/lib/utils";

const HEADING_WIDTH_BY_LEVEL = {
  1: "w-11/12",
  2: "w-10/12",
  3: "w-9/12",
  4: "w-8/12",
  5: "w-7/12",
  6: "w-6/12",
} satisfies Record<1 | 2 | 3 | 4 | 5 | 6, string>;

const DEFAULT_STAT_VALUES = [64, 28, 91] as const;

const STEPS_ARROW_ITEMS = [
  { id: "first", titleWidth: "w-12", bodyWidth: "w-16" },
  { id: "second", titleWidth: "w-12", bodyWidth: "w-14" },
  { id: "third", titleWidth: "w-14", bodyWidth: "w-16" },
] as const;

const renderVerticalStat = (
  value: number,
  visual: ReactNode,
  className?: string,
) => (
  <div
    key={value}
    className={cn("flex min-w-0 flex-col items-start gap-1.5", className)}
  >
    <div className="flex h-8 w-full items-center">{visual}</div>
    {renderStatValue()}
    {renderStatLabel()}
  </div>
);

const renderStatValue = () => (
  <div className="h-2 w-6 rounded bg-muted-foreground/25" aria-hidden="true" />
);

const renderStatLabel = () => (
  <div className="h-1.5 w-9 rounded bg-muted" aria-hidden="true" />
);

function HeadingPreview({ level }: { level: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const heightClass = level <= 2 ? "h-5" : level <= 4 ? "h-4" : "h-3";

  return (
    <div className="flex size-full items-center p-4">
      <div className="w-full space-y-2">
        <div
          className={cn(
            heightClass,
            HEADING_WIDTH_BY_LEVEL[level],
            "rounded bg-muted-foreground/35",
          )}
        />
        <div className="h-1.5 w-2/3 rounded bg-muted" />
      </div>
    </div>
  );
}

function ParagraphPreview() {
  return (
    <div className="flex size-full flex-col justify-center gap-1.5 p-4">
      <div className="h-1.5 w-full rounded bg-muted-foreground/20" />
      <div className="h-1.5 w-11/12 rounded bg-muted-foreground/20" />
      <div className="h-1.5 w-10/12 rounded bg-muted-foreground/20" />
      <div className="h-1.5 w-7/12 rounded bg-muted-foreground/20" />
    </div>
  );
}

function StaircaseShapePreview() {
  return (
    <div className="flex size-full flex-col justify-center gap-1.5 p-4">
      <div className="h-4 w-1/3 rounded bg-muted-foreground/25" />
      <div className="h-4 w-2/3 rounded bg-muted-foreground/25" />
      <div className="h-4 w-full rounded bg-muted-foreground/25" />
    </div>
  );
}

function FeatureBoxesPreview() {
  return (
    <div className="flex size-full items-center justify-center p-3">
      <div className="grid w-full grid-cols-3 gap-1.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-1 rounded border border-border p-1.5">
            <div className="h-1.5 w-3/4 rounded bg-muted-foreground/20" />
            <div className="h-1 w-full rounded bg-muted" />
            <div className="h-1 w-5/6 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ComparePointsPreview() {
  return (
    <div className="flex size-full items-center gap-1 p-3">
      <div className="flex flex-1 flex-col gap-1">
        <div className="mb-0.5 h-2 w-3/4 rounded bg-muted-foreground/20" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="size-1 shrink-0 rounded-full bg-muted-foreground/30" />
            <div className="h-1 flex-1 rounded bg-muted" />
          </div>
        ))}
      </div>
      {/* VS badge */}
      <div className="flex shrink-0 items-center justify-center">
        <div className="flex size-5 items-center justify-center rounded-full border border-muted-foreground/25 bg-muted/40">
          <span className="text-[8px] font-bold text-muted-foreground/60">
            vs
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="mb-0.5 h-2 w-3/4 rounded bg-muted-foreground/20" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="size-1 shrink-0 rounded-full bg-muted-foreground/30" />
            <div className="h-1 flex-1 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function BeforeAfterPreview() {
  return (
    <div className="flex size-full items-center gap-1 p-3">
      <div className="flex flex-1 flex-col gap-1">
        <div className="mb-0.5 h-2 w-3/4 rounded bg-muted-foreground/20" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="size-1 shrink-0 rounded-full bg-muted-foreground/30" />
            <div className="h-1 flex-1 rounded bg-muted" />
          </div>
        ))}
      </div>
      {/* Arrow right icon */}
      <div className="flex shrink-0 items-center justify-center">
        <div className="flex size-5 items-center justify-center rounded-full border border-muted-foreground/25 bg-muted/40">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-3 text-muted-foreground/50"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="mb-0.5 h-2 w-3/4 rounded bg-muted-foreground/20" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="size-1 shrink-0 rounded-full bg-muted-foreground/30" />
            <div className="h-1 flex-1 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProsConsPreview() {
  return (
    <div className="flex size-full gap-0 overflow-hidden p-2">
      <div className="flex flex-1 flex-col gap-1.5 rounded-l-sm bg-green-500/15 p-2">
        <div className="h-1.5 w-3/4 rounded bg-green-500/50" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-1 w-full rounded bg-green-500/25" />
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 rounded-r-sm bg-red-500/15 p-2">
        <div className="h-1.5 w-3/4 rounded bg-red-500/50" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-1 w-full rounded bg-red-500/25" />
        ))}
      </div>
    </div>
  );
}

function IconListPreview() {
  return (
    <div className="flex size-full flex-col justify-center gap-2 p-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="size-3.5 shrink-0 rounded bg-muted-foreground/30" />
          <div className="flex-1 space-y-0.5">
            <div className="h-1.5 w-full rounded bg-muted-foreground/20" />
            <div className="h-1 w-5/6 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ImagePlaceholderPreview() {
  return (
    <div className="flex size-full items-center justify-center p-4">
      <div className="flex size-full items-center justify-center rounded border-2 border-dashed border-muted-foreground/20 bg-muted/30">
        <svg
          className="size-6 text-muted-foreground/30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    </div>
  );
}

function CalloutPreview() {
  return (
    <div className="flex size-full items-center p-3">
      <div className="flex w-full items-start gap-2 rounded bg-amber-500/10 p-2">
        <Info className="size-4 shrink-0 text-blue-500/70" />
        <div className="flex-1 space-y-1">
          <div className="h-1.5 w-full rounded bg-muted-foreground/20" />
          <div className="h-1 w-5/6 rounded bg-muted" />
          <div className="h-1 w-4/5 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

function TocPreview() {
  return (
    <div className="flex size-full flex-col justify-center gap-2 p-3">
      {[80, 60, 70].map((w, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="size-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
          <div
            className="h-1.5 rounded bg-muted-foreground/20"
            style={{ width: `${w}%` }}
          />
          <div className="flex-1 border-b border-dashed border-muted-foreground/10" />
          <div className="h-1.5 w-3 rounded bg-muted-foreground/20" />
        </div>
      ))}
    </div>
  );
}

function CodeBlockPreview() {
  return (
    <div className="flex size-full items-center p-3">
      <div className="w-full overflow-hidden rounded bg-muted/60 px-2.5 py-2">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <div className="h-1 w-7 rounded bg-blue-400/50" />
            <div className="h-1 w-10 rounded bg-muted-foreground/25" />
            <div className="h-1 w-5 rounded bg-green-400/50" />
          </div>
          <div className="ml-3 flex items-center gap-1.5">
            <div className="h-1 w-8 rounded bg-purple-400/50" />
            <div className="h-1 w-6 rounded bg-orange-400/40" />
          </div>
          <div className="ml-3 flex items-center gap-1.5">
            <div className="h-1 w-12 rounded bg-muted-foreground/20" />
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1 w-3 rounded bg-muted-foreground/25" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DividerPreview() {
  return (
    <div className="flex size-full items-center justify-center p-4">
      <div className="h-px w-full bg-muted-foreground/25" />
    </div>
  );
}

function ButtonPreview() {
  return (
    <div className="flex size-full items-center justify-center p-4">
      <div className="rounded bg-primary px-4 py-2">
        <div className="h-1.5 w-16 rounded bg-primary-foreground/60" />
      </div>
    </div>
  );
}

function IconOnlyPreview({ icon }: { icon: ReactNode }) {
  return (
    <div className="flex size-full items-center justify-center p-4 text-muted-foreground/70 [&_svg]:size-8">
      {icon}
    </div>
  );
}

function StatsPreview({
  variant,
}: {
  variant?: "bar" | "circle" | "dot-grid" | "dot-line" | "plain" | "star";
}) {
  if (variant === "circle") {
    return (
      <div className="grid size-full grid-cols-3 items-center gap-3 p-4">
        {[70, 50, 85].map((value) =>
          renderVerticalStat(
            value,
            <div className="flex size-8 items-center justify-center rounded-full border-4 border-muted-foreground/25 text-[7px] font-semibold text-muted-foreground/55">
              {value}
            </div>,
          ),
        )}
      </div>
    );
  }

  if (variant === "bar") {
    return (
      <div className="grid size-full grid-cols-3 items-center gap-3 p-4">
        {[74, 52, 89].map((value) =>
          renderVerticalStat(
            value,
            <div className="h-4 w-full rounded-sm border border-muted-foreground/25 bg-card">
              <div
                className="h-full bg-muted-foreground/35"
                style={{ width: `${value}%` }}
              />
            </div>,
          ),
        )}
      </div>
    );
  }

  if (variant === "dot-grid") {
    return (
      <div className="grid size-full grid-cols-3 items-center gap-3 p-4">
        {[68, 41, 96].map((value) =>
          renderVerticalStat(
            value,
            <div className="grid size-8 grid-cols-5 gap-0.5">
              {Array.from(
                { length: 25 },
                (_, index) => `dot-${value}-${index}`,
              ).map((dotId, index) => (
                <div
                  key={dotId}
                  className={cn(
                    "size-1 rounded-full",
                    index < Math.round((value / 100) * 25)
                      ? "bg-muted-foreground/35"
                      : "bg-muted",
                  )}
                />
              ))}
            </div>,
          ),
        )}
      </div>
    );
  }

  if (variant === "dot-line") {
    return (
      <div className="grid size-full grid-cols-3 items-center gap-3 p-4">
        {[60, 75, 90].map((value) =>
          renderVerticalStat(
            value,
            <div className="flex gap-1.5">
              <div className="size-2.5 rounded-full bg-muted-foreground/35" />
              <div className="size-2.5 rounded-full bg-muted-foreground/35" />
            </div>,
          ),
        )}
      </div>
    );
  }

  if (variant === "star") {
    return (
      <div className="grid size-full grid-cols-3 items-center gap-3 p-4">
        {[4, 5, 4].map((value) =>
          renderVerticalStat(
            value,
            <Star className="size-4 fill-muted-foreground/35 text-muted-foreground/35" />,
          ),
        )}
      </div>
    );
  }

  return (
    <div className="grid size-full grid-cols-3 items-center gap-3 p-4">
      {DEFAULT_STAT_VALUES.map((value) =>
        renderVerticalStat(
          value,
          <div className="h-5 w-8 rounded bg-muted-foreground/35" />,
        ),
      )}
    </div>
  );
}

function MediaEmbedPreview({ infographic = false }: { infographic?: boolean }) {
  return (
    <div className="flex size-full items-center justify-center p-4">
      <div className="flex size-full items-center justify-center rounded border-2 border-dashed border-muted-foreground/20 bg-muted/30">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-8 rounded-sm bg-muted-foreground/25" />
          <div className="h-1.5 w-16 rounded bg-muted-foreground/20" />
          {infographic && <div className="h-1 w-10 rounded bg-muted" />}
        </div>
      </div>
    </div>
  );
}

function LargeQuotePreview() {
  return (
    <div className="flex size-full items-center justify-center p-3">
      <div className="flex w-full items-center justify-center gap-2">
        <div className="text-2xl font-serif text-amber-300/70">"</div>
        <div className="flex flex-col items-center gap-1.5">
          <div className="h-2 w-28 rounded bg-muted-foreground/25" />
          <div className="h-2 w-24 rounded bg-muted-foreground/20" />
          <div className="mt-1 h-1.5 w-14 rounded bg-muted-foreground/25" />
        </div>
        <div className="text-2xl font-serif text-amber-300/70">"</div>
      </div>
    </div>
  );
}

function QuoteWithIconPreview() {
  return (
    <div className="flex size-full items-center p-3">
      <div className="flex w-full gap-2 rounded bg-amber-500/10 p-2">
        <div className="w-1 shrink-0 rounded-full bg-amber-500/70" />
        <div className="flex flex-1 flex-col justify-center gap-1.5">
          <div className="size-3 rounded bg-amber-500/70" />
          <div className="h-1.5 w-full rounded bg-muted-foreground/25" />
          <div className="h-1.5 w-4/5 rounded bg-muted-foreground/20" />
          <div className="mt-0.5 h-1.5 w-16 rounded bg-muted-foreground/35" />
        </div>
      </div>
    </div>
  );
}

function SideQuotePreview() {
  return (
    <div className="flex size-full items-center justify-center p-4">
      <div className="flex w-full items-start gap-2">
        <div className="mt-0.5 h-10 w-1 shrink-0 rounded-full bg-amber-500/70" />
        <div className="flex flex-col justify-center gap-1.5">
          <div className="h-1.5 w-28 rounded bg-muted-foreground/20" />
          <div className="h-1.5 w-24 rounded bg-muted-foreground/15" />
          <div className="h-1.5 w-20 rounded bg-muted-foreground/15" />
          <div className="mt-0.5 h-1 w-12 rounded bg-muted-foreground/30" />
        </div>
      </div>
    </div>
  );
}

function ColumnsPreview() {
  return (
    <div className="flex size-full items-center justify-center p-3">
      <div className="grid w-full grid-cols-3 gap-2">
        {["left", "middle", "right"].map((column) => (
          <div key={column} className="space-y-1">
            <div className="h-2 rounded bg-muted-foreground/20" />
            <div className="h-1 rounded bg-muted" />
            <div className="h-1 rounded bg-muted" />
            <div className="h-1 w-4/5 rounded bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}

function StepsArrowPreview() {
  const columns = STEPS_ARROW_ITEMS.length;

  return (
    <div className="grid size-full grid-cols-3 items-stretch gap-2 p-3">
      {STEPS_ARROW_ITEMS.map((step, index) => {
        const topMargin = Math.max(0, (columns - 1 - index) * 1.35);

        return (
          <div key={step.id} className="flex min-w-0 flex-col">
            <div
              className="flex flex-1 flex-col"
              style={{ marginTop: `${topMargin}rem` }}
            >
              <div
                className="mb-2 flex w-full shrink-0 items-center pr-2 text-muted-foreground/35"
                aria-hidden="true"
              >
                <div className="h-1.5 flex-1 bg-current" />
                <svg
                  viewBox="0 0 16 24"
                  className="-ml-px h-3.5 w-2.5 shrink-0 fill-current"
                >
                  <path d="M0 0l16 12-16 12z" />
                </svg>
              </div>
              <div className="space-y-1.5">
                <div
                  className={cn(
                    "h-2 rounded bg-muted-foreground/30",
                    step.titleWidth,
                  )}
                />
                <div className={cn("h-1.5 rounded bg-muted", step.bodyWidth)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProcessArrowsPreview() {
  return (
    <div className="flex size-full items-center justify-center p-4">
      <div className="flex flex-col gap-1.5 text-muted-foreground/30">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-2">
            <svg
              viewBox="0 0 90 72"
              className="h-5 w-7 shrink-0 overflow-visible"
              aria-hidden="true"
              preserveAspectRatio="none"
            >
              <path d="M0 54L45 72L90 54L90 0L45 18L0 0Z" fill="currentColor" />
            </svg>
            <div className="flex flex-col gap-1">
              <div className="h-1.5 w-14 rounded bg-muted-foreground/25" />
              <div className="h-1 w-10 rounded bg-muted-foreground/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const ELEMENT_PREVIEWS: Record<string, ReactNode> = {
  title: <HeadingPreview level={1} />,
  "title-display": <HeadingPreview level={1} />,
  "title-humongous": <HeadingPreview level={1} />,
  "heading-1": <HeadingPreview level={1} />,
  "heading-2": <HeadingPreview level={2} />,
  "heading-3": <HeadingPreview level={3} />,
  "heading-4": <HeadingPreview level={4} />,
  heading: <HeadingPreview level={2} />,
  paragraph: <ParagraphPreview />,
  blockquote: <SideQuotePreview />,
  label: <IconOnlyPreview icon={<Tag />} />,
  bullets: <TemplatePreviews.LargeBulletsPreview />,
  "bulleted-list": <IconOnlyPreview icon={<List />} />,
  "numbered-list": <IconOnlyPreview icon={<ListOrdered />} />,
  "todo-list": <IconOnlyPreview icon={<ListChecks />} />,
  timeline: <TemplatePreviews.TimelineSequencePreview />,
  steps: <StepsArrowPreview />,
  "steps-default": <StepsArrowPreview />,
  "steps-arrow": <StepsArrowPreview />,
  "steps-box": <StepsArrowPreview />,
  arrows: <ProcessArrowsPreview />,
  "arrow-vertical": <TemplatePreviews.SequenceArrowPreview />,
  slope: <TemplatePreviews.SlopeDiagramPreview />,
  snake: <TemplatePreviews.SnakeDiagramPreview />,
  pyramid: <TemplatePreviews.PyramidOutsideTextPreview />,
  cycle: <TemplatePreviews.CyclePreview />,
  "connected-circles": <TemplatePreviews.ConnectedCirclesDiagramPreview />,
  "circular-grid": <TemplatePreviews.CircularGridDiagramPreview />,
  staircase: <StaircaseShapePreview />,
  boxes: <FeatureBoxesPreview />,
  compare: <ComparePointsPreview />,
  "before-after": <BeforeAfterPreview />,
  "pros-cons": <ProsConsPreview />,
  "icon-list": <IconListPreview />,
  button: <ButtonPreview />,
  toggle: <IconOnlyPreview icon={<ToggleLeft />} />,
  image: <ImagePlaceholderPreview />,
  columns: <ColumnsPreview />,
  callout: <CalloutPreview />,
  "callout-note": <IconOnlyPreview icon={<FileText />} />,
  "callout-info": <IconOnlyPreview icon={<Info />} />,
  "callout-warning": <IconOnlyPreview icon={<CircleAlert />} />,
  "callout-caution": <IconOnlyPreview icon={<CircleAlert />} />,
  "callout-success": <IconOnlyPreview icon={<CircleCheck />} />,
  "callout-question": <IconOnlyPreview icon={<CircleHelp />} />,
  toc: <TocPreview />,
  "quote-large": <LargeQuotePreview />,
  "quote-side-icon": <QuoteWithIconPreview />,
  "quote-side": <SideQuotePreview />,
  code: <CodeBlockPreview />,
  math: <IconOnlyPreview icon={<Sigma />} />,
  contributors: <IconOnlyPreview icon={<CircleUserRound />} />,
  hr: <DividerPreview />,
  table: <TemplatePreviews.ThreeRowTablePreview />,
  "table-2x2": <TemplatePreviews.ThreeRowTablePreview />,
  "table-3x3": <TemplatePreviews.ThreeRowTablePreview />,
  "table-4x4": <TemplatePreviews.ThreeRowTablePreview />,
  "stats-plain": <StatsPreview />,
  "stats-circle": <StatsPreview variant="circle" />,
  "stats-star": <StatsPreview variant="star" />,
  "stats-bar": <StatsPreview variant="bar" />,
  "stats-dot-grid": <StatsPreview variant="dot-grid" />,
  "stats-dot-line": <StatsPreview variant="dot-line" />,
  "media-embed": <MediaEmbedPreview />,
  infographic: <MediaEmbedPreview infographic />,
};

interface ElementPreviewProps {
  elementKey: string;
  className?: string;
}

export function ElementPreview({ elementKey, className }: ElementPreviewProps) {
  const preview = ELEMENT_PREVIEWS[elementKey] ?? (
    <TemplatePreviews.LargeBulletsPreview />
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
