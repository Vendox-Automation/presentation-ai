"use client";

import { DRAG_ITEM_BLOCK } from "@platejs/dnd";
import { GripVertical } from "lucide-react";
import { useEditorRef } from "platejs/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useDrag } from "react-dnd";

import { updateDroppedElementAfterDrop } from "@/components/notebook/presentation/editor/dnd/utils/updateSiblingsForcefully";
import {
  getElementId,
  getPaletteMutableSignature,
  isPaletteDropMutable,
  replaceElementById,
  replaceFocusedEmptyParagraph,
  type PaletteDropTarget,
} from "@/components/notebook/presentation/editor/utils/paletteDrop";
import {
  type PlateSlide,
  type RootImage,
} from "@/components/notebook/presentation/utils/parser";
import { type MyEditor } from "@/components/plate/editor-kit";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { ChartPreview } from "./ChartPreview";
import { chartItems, type PaletteItem } from "./elements";
import { PanelSearchFilter } from "./PanelSearchFilter";
import { matchesPanelSearch } from "./PanelSearchFilter";

const KEYBOARD_APPLY_DELAY_MS = 250;

function getChartFilterValue(item: PaletteItem): string {
  if (
    [
      "chart-pie",
      "chart-donut",
      "chart-bar",
      "chart-line",
      "chart-area",
      "chart-radar",
      "chart-radial-bar",
      "chart-radial-column",
      "chart-composed",
      "chart-nightingale",
    ].includes(item.key)
  ) {
    return "basic";
  }
  if (
    [
      "chart-scatter",
      "chart-bubble",
      "chart-histogram",
      "chart-heatmap",
      "chart-box-plot",
    ].includes(item.key)
  ) {
    return "statistical";
  }
  if (
    ["chart-range-bar", "chart-range-area", "chart-waterfall"].includes(
      item.key,
    )
  ) {
    return "range";
  }
  if (["chart-candlestick", "chart-ohlc"].includes(item.key)) {
    return "financial";
  }
  if (["chart-treemap", "chart-sunburst", "chart-pyramid"].includes(item.key)) {
    return "hierarchy";
  }
  if (["chart-sankey", "chart-chord"].includes(item.key)) {
    return "flow";
  }
  if (["chart-funnel", "chart-cone-funnel"].includes(item.key)) {
    return "funnel";
  }
  return "gauge";
}

export function ChartPanel({ isLoaded }: { isLoaded: boolean }) {
  const paletteDropTarget = usePresentationState((s) => s.paletteDropTarget);
  const currentSlideId = usePresentationState((s) => s.currentSlideId);
  const setPaletteDropTarget = usePresentationState(
    (s) => s.setPaletteDropTarget,
  );
  const updateSlide = usePresentationState((s) => s.updateSlide);
  const editor = useEditorRef<MyEditor>(currentSlideId ?? undefined);

  const insertFocusedItem = useCallback(
    (item: PaletteItem) => {
      if (!currentSlideId) return;

      const insertedElement = replaceFocusedEmptyParagraph(editor, item.node);
      const insertedElementId = getElementId(insertedElement ?? undefined);

      if (!insertedElementId) return;

      const insertedEntry = editor.api.node({ id: insertedElementId, at: [] });
      if (insertedEntry) {
        updateDroppedElementAfterDrop(editor, insertedEntry[1]);
      }

      updateSlide(currentSlideId, {
        content: editor.children as PlateSlide["content"],
      });

      const updatedEntry = editor.api.node({ id: insertedElementId, at: [] });
      const [updatedElement] = updatedEntry ?? [];

      setPaletteDropTarget({
        editorId: currentSlideId,
        elementId: insertedElementId,
        itemKey: item.key,
        source: "charts",
        mutableSignature: updatedElement
          ? getPaletteMutableSignature(updatedElement)
          : undefined,
      });
    },
    [currentSlideId, editor, setPaletteDropTarget, updateSlide],
  );

  if (!isLoaded) {
    return (
      <div className="animate-fade-in scrollbar-thin flex h-full flex-col gap-4 overflow-y-auto px-4 pb-5 scrollbar-thumb-primary scrollbar-track-transparent">
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: chartItems.length }).map((_, i) => (
            <div key={i} className="rounded-md border p-2">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
                <div className="h-4 w-4 shrink-0 animate-pulse rounded-full bg-muted" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="aspect-video w-full rounded-sm bg-muted/30">
                <Skeleton className="h-full w-full rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (paletteDropTarget?.source === "charts") {
    return <TrackedChartPanel paletteDropTarget={paletteDropTarget} />;
  }

  return <ChartPanelContent insertFocusedItem={insertFocusedItem} />;
}

function TrackedChartPanel({
  paletteDropTarget,
}: {
  paletteDropTarget: PaletteDropTarget;
}) {
  const setPaletteDropTarget = usePresentationState(
    (s) => s.setPaletteDropTarget,
  );
  const updateSlide = usePresentationState((s) => s.updateSlide);
  const slides = usePresentationState((s) => s.slides);
  const editor = useEditorRef<MyEditor>(paletteDropTarget.editorId);

  const replaceTrackedDrop = useCallback(
    (item: PaletteItem) => {
      if (paletteDropTarget.targetKind === "rootImage") {
        const chartElement = item.node as TElementWithChartData;
        const currentRootImage = slides.find(
          (slide) => slide.id === paletteDropTarget.editorId,
        )?.rootImage;

        if (!isPaletteDropMutable(currentRootImage)) {
          setPaletteDropTarget(null);
          return;
        }
        if (
          paletteDropTarget.mutableSignature &&
          getPaletteMutableSignature(currentRootImage) !==
            paletteDropTarget.mutableSignature
        ) {
          setPaletteDropTarget(null);
          return;
        }

        const nextRootImage = {
          ...currentRootImage,
          query: currentRootImage?.query ?? "",
          chartType: chartElement.type,
          chartData: chartElement.data,
          chartOptions: {
            variant: chartElement.variant,
            disableAnimation: true,
          },
          paletteDropMutable: true,
          url: undefined,
          embedType: undefined,
          imageSource: undefined,
        } satisfies RootImage;

        updateSlide(paletteDropTarget.editorId, {
          rootImage: nextRootImage,
        });
        setPaletteDropTarget({
          ...paletteDropTarget,
          itemKey: item.key,
          mutableSignature: getPaletteMutableSignature(nextRootImage),
        });
        return;
      }

      const replaced = replaceElementById(
        editor,
        paletteDropTarget.elementId,
        item.node,
        paletteDropTarget.mutableSignature,
      );

      if (!replaced) {
        setPaletteDropTarget(null);
        return;
      }

      updateSlide(paletteDropTarget.editorId, {
        content: editor.children as PlateSlide["content"],
      });
      const updatedEntry = editor.api.node({
        id: paletteDropTarget.elementId,
        at: [],
      });
      const [updatedElement] = updatedEntry ?? [];

      setPaletteDropTarget({
        ...paletteDropTarget,
        itemKey: item.key,
        mutableSignature: updatedElement
          ? getPaletteMutableSignature(updatedElement)
          : undefined,
      });
    },
    [editor, paletteDropTarget, setPaletteDropTarget, slides, updateSlide],
  );

  const initialSelectedIndex = Math.max(
    chartItems.findIndex((item) => item.key === paletteDropTarget.itemKey),
    0,
  );

  return (
    <ChartPanelContent
      key={paletteDropTarget.elementId}
      initialSelectedIndex={initialSelectedIndex}
      replaceTrackedDrop={replaceTrackedDrop}
    />
  );
}

type TElementWithChartData = PaletteItem["node"] & {
  data?: unknown;
  variant?: string;
};

function ChartPanelContent({
  initialSelectedIndex = 0,
  insertFocusedItem,
  replaceTrackedDrop,
}: {
  initialSelectedIndex?: number;
  insertFocusedItem?: (item: PaletteItem) => void;
  replaceTrackedDrop?: (item: PaletteItem) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [searchQuery, setSearchQuery] = useState("");
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const applyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filteredChartItems = useMemo(
    () =>
      chartItems.filter((item) => {
        const category = getChartFilterValue(item);

        return matchesPanelSearch(searchQuery, [
          item.label,
          item.key,
          category,
        ]);
      }),
    [searchQuery],
  );

  const focusCard = useCallback((index: number) => {
    cardRefs.current[index]?.focus();
  }, []);

  useEffect(() => {
    window.requestAnimationFrame(() => {
      focusCard(initialSelectedIndex);
    });
  }, [focusCard, initialSelectedIndex]);

  useEffect(() => {
    setSelectedIndex((currentIndex) =>
      filteredChartItems.length === 0
        ? 0
        : Math.min(currentIndex, filteredChartItems.length - 1),
    );
  }, [filteredChartItems.length]);

  useEffect(
    () => () => {
      if (applyTimeoutRef.current) {
        clearTimeout(applyTimeoutRef.current);
      }
    },
    [],
  );

  const commitSelection = useCallback(
    (index: number) => {
      const item = filteredChartItems[index];

      if (!item) return;

      if (replaceTrackedDrop) {
        replaceTrackedDrop(item);
        return;
      }

      insertFocusedItem?.(item);
    },
    [filteredChartItems, insertFocusedItem, replaceTrackedDrop],
  );

  const selectItem = useCallback(
    (index: number) => {
      if (applyTimeoutRef.current) {
        clearTimeout(applyTimeoutRef.current);
        applyTimeoutRef.current = null;
      }

      setSelectedIndex(index);
      commitSelection(index);
    },
    [commitSelection],
  );

  const scheduleSelectionCommit = useCallback(
    (index: number) => {
      if (applyTimeoutRef.current) {
        clearTimeout(applyTimeoutRef.current);
      }

      applyTimeoutRef.current = setTimeout(() => {
        applyTimeoutRef.current = null;
        commitSelection(index);

        window.requestAnimationFrame(() => {
          focusCard(index);
        });
      }, KEYBOARD_APPLY_DELAY_MS);
    },
    [commitSelection, focusCard],
  );

  const moveSelection = useCallback(
    (nextIndex: number) => {
      const boundedIndex = Math.min(
        Math.max(nextIndex, 0),
        filteredChartItems.length - 1,
      );

      if (boundedIndex < 0) return;

      setSelectedIndex(boundedIndex);
      focusCard(boundedIndex);
      if (replaceTrackedDrop) {
        scheduleSelectionCommit(boundedIndex);
      }
    },
    [
      filteredChartItems.length,
      focusCard,
      replaceTrackedDrop,
      scheduleSelectionCommit,
    ],
  );

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>, index: number) => {
      const columns = 2;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          event.stopPropagation();
          moveSelection(index - 1);
          break;
        case "ArrowRight":
          event.preventDefault();
          event.stopPropagation();
          moveSelection(index + 1);
          break;
        case "ArrowUp":
          event.preventDefault();
          event.stopPropagation();
          moveSelection(index - columns);
          break;
        case "ArrowDown":
          event.preventDefault();
          event.stopPropagation();
          moveSelection(index + columns);
          break;
        case "Home":
          event.preventDefault();
          event.stopPropagation();
          moveSelection(0);
          break;
        case "End":
          event.preventDefault();
          event.stopPropagation();
          moveSelection(filteredChartItems.length - 1);
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          event.stopPropagation();
          selectItem(index);
          break;
      }
    },
    [filteredChartItems.length, moveSelection, selectItem],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PanelSearchFilter
        onQueryChange={setSearchQuery}
        placeholder="Search charts..."
        query={searchQuery}
      />
      <div className="scrollbar-thin flex-1 overflow-y-auto px-4 scrollbar-thumb-primary scrollbar-track-transparent">
        {filteredChartItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 py-4">
            {filteredChartItems.map((item, index) => (
              <ChartCard
                key={item.key}
                item={item}
                refCallback={(node) => {
                  cardRefs.current[index] = node;
                }}
                isSelected={selectedIndex === index}
                tabIndex={selectedIndex === index ? 0 : -1}
                onClick={() => selectItem(index)}
                onFocus={() => setSelectedIndex(index)}
                onKeyDown={(event) => handleCardKeyDown(event, index)}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            No charts match your search.
          </div>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  item,
  refCallback,
  isSelected,
  tabIndex,
  onClick,
  onFocus,
  onKeyDown,
}: {
  item: PaletteItem;
  refCallback: (node: HTMLDivElement | null) => void;
  isSelected: boolean;
  tabIndex: number;
  onClick: () => void;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DRAG_ITEM_BLOCK,
    item: {
      id: `external-${item.key}`,
      element: item.node,
      itemKey: item.key,
      sourcePanel: "charts" as const,
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <div
      ref={(el) => {
        refCallback(el);
        if (el) drag(el);
      }}
      aria-label={item.label}
      aria-pressed={isSelected}
      tabIndex={tabIndex}
      data-panel-arrow-target="true"
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      className={cn(
        "group cursor-grab rounded-md border p-2 px-4 transition hover:border hover:border-primary hover:shadow focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:cursor-grabbing",
        isSelected && "border-primary ring-1 ring-primary",
        isDragging && "opacity-50",
      )}
    >
      <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
        <GripVertical className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        <span>{item.label}</span>
      </div>
      <ChartPreview chartType={item.node.type as string} className="w-full" />
    </div>
  );
}
