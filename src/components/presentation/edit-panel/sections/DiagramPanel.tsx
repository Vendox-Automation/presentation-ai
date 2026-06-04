"use client";

import { DRAG_ITEM_BLOCK } from "@platejs/dnd";
import { ChevronDown, GripVertical } from "lucide-react";
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
  applyThemeToSyntax,
  type InfographicPaletteThemeColors,
} from "@/components/notebook/presentation/editor/utils/infographic-utils";
import {
  getElementId,
  getPaletteMutableSignature,
  replaceElementById,
  replaceFocusedEmptyParagraph,
  type PaletteDropTarget,
} from "@/components/notebook/presentation/editor/utils/paletteDrop";
import { type PlateSlide } from "@/components/notebook/presentation/utils/parser";
import { type MyEditor } from "@/components/plate/editor-kit";
import { ScrollList, type ScrollListRange } from "@/components/ui/scroll-list";
import { Skeleton } from "@/components/ui/skeleton";
import { renderInfographicPreviewHtml } from "@/hooks/presentation/infographic/infographic-preview-renderer";
import { resolvePresentationThemeData } from "@/lib/presentation/theme-resolution";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { usePresentationTheme } from "../../providers/PresentationThemeProvider";
import {
  diagramCategories,
  type DiagramCategory,
  type DiagramItem,
} from "./diagrams";
import { PanelSearchFilter } from "./PanelSearchFilter";
import { matchesPanelSearch } from "./PanelSearchFilter";

const KEYBOARD_APPLY_DELAY_MS = 250;
const VIRTUAL_ROW_OVERSCAN = 1_200;
const PREVIEW_LOOKAHEAD_PX = 3_600;
const PREVIEW_LOOKBEHIND_PX = 1_000;
const HEADER_ROW_HEIGHT = 37;
const CARD_ROW_HEIGHT = 159;
const ROW_GAP = 0;
const ALL_DIAGRAM_ITEMS = diagramCategories.flatMap(
  (category) => category.items,
);

type DiagramPreviewCache = {
  failedKeys: Set<string>;
  markupByKey: Map<string, string>;
};

type DiagramPreviewRequest = {
  isDark: boolean;
  items: DiagramItem[];
  themeColors: InfographicPaletteThemeColors | null;
};

type PreviewCandidate<TItem> = {
  distance: number;
  item: TItem;
};

type VirtualHeaderRow = {
  categoryKey: string;
  categoryName: string;
  collapsed: boolean;
  count: number;
  height: number;
  key: string;
  type: "header";
};

type VirtualCardRow = {
  categoryKey: string;
  categoryName: string;
  height: number;
  items: DiagramItem[];
  key: string;
  type: "cards";
};

type VirtualDiagramRow = VirtualHeaderRow | VirtualCardRow;

const diagramPreviewMarkupCache = new Map<string, string>();
const diagramPreviewFailureCache = new Set<string>();
const diagramPreviewPromiseCache = new Map<string, Promise<void>>();

function getDiagramPreviewCacheKey(
  item: DiagramItem,
  isDark: boolean,
  themeColors: InfographicPaletteThemeColors | null,
): string {
  return [
    item.key,
    isDark ? "dark" : "light",
    themeColors?.primary ?? "",
    themeColors?.accent ?? "",
    themeColors?.smartLayout ?? "",
    themeColors?.text ?? "",
    themeColors?.heading ?? "",
    themeColors?.cardBackground ?? "",
  ].join("|");
}

async function renderDiagramPreviewMarkup(
  item: DiagramItem,
  isDark: boolean,
  themeColors: InfographicPaletteThemeColors | null,
): Promise<string> {
  return renderInfographicPreviewHtml(
    applyThemeToSyntax(item.syntax, isDark, themeColors),
  );
}

async function ensureDiagramPreviewMarkup(
  item: DiagramItem,
  isDark: boolean,
  themeColors: InfographicPaletteThemeColors | null,
): Promise<void> {
  const cacheKey = getDiagramPreviewCacheKey(item, isDark, themeColors);

  if (
    diagramPreviewMarkupCache.has(cacheKey) ||
    diagramPreviewFailureCache.has(cacheKey)
  ) {
    return;
  }

  const existingPromise = diagramPreviewPromiseCache.get(cacheKey);
  if (existingPromise) {
    await existingPromise;
    return;
  }

  const previewPromise = renderDiagramPreviewMarkup(item, isDark, themeColors)
    .then((markup) => {
      diagramPreviewMarkupCache.set(cacheKey, markup);
    })
    .catch((error: unknown) => {
      console.error("Failed to render diagram preview:", error);
      diagramPreviewFailureCache.add(cacheKey);
    })
    .finally(() => {
      diagramPreviewPromiseCache.delete(cacheKey);
    });

  diagramPreviewPromiseCache.set(cacheKey, previewPromise);
  await previewPromise;
}

function getPendingPreviewItem(
  items: DiagramItem[],
  isDark: boolean,
  themeColors: InfographicPaletteThemeColors | null,
): DiagramItem | undefined {
  return items.find((item) => {
    const cacheKey = getDiagramPreviewCacheKey(item, isDark, themeColors);
    return (
      !diagramPreviewMarkupCache.has(cacheKey) &&
      !diagramPreviewFailureCache.has(cacheKey) &&
      !diagramPreviewPromiseCache.has(cacheKey)
    );
  });
}

function useDiagramPreviewCache(
  isDark: boolean,
  themeColors: InfographicPaletteThemeColors | null,
  requestedPreviewItems: DiagramItem[],
): DiagramPreviewCache {
  const [, setCacheVersion] = useState(0);
  const isMountedRef = useRef(false);
  const isPreloadingRef = useRef(false);
  const latestRequestRef = useRef<DiagramPreviewRequest>({
    isDark,
    items: requestedPreviewItems,
    themeColors,
  });

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    latestRequestRef.current = {
      isDark,
      items: requestedPreviewItems,
      themeColors,
    };

    async function preloadRequestedDiagrams() {
      if (isPreloadingRef.current) return;

      isPreloadingRef.current = true;

      try {
        const request = latestRequestRef.current;
        const item = getPendingPreviewItem(
          request.items,
          request.isDark,
          request.themeColors,
        );

        if (item) {
          await ensureDiagramPreviewMarkup(
            item,
            request.isDark,
            request.themeColors,
          );

          if (isMountedRef.current) {
            setCacheVersion((version) => version + 1);
          }
        }
      } finally {
        isPreloadingRef.current = false;
        const request = latestRequestRef.current;

        if (
          isMountedRef.current &&
          getPendingPreviewItem(
            request.items,
            request.isDark,
            request.themeColors,
          )
        ) {
          void preloadRequestedDiagrams();

          isPreloadingRef.current = false;
          const latestRequest = latestRequestRef.current;

          if (
            isMountedRef.current &&
            getPendingPreviewItem(
              latestRequest.items,
              latestRequest.isDark,
              latestRequest.themeColors,
            )
          ) {
            void preloadRequestedDiagrams();
          }
        }
      }
    }

    void preloadRequestedDiagrams();
  }, [isDark, requestedPreviewItems, themeColors]);

  const currentFailedKeys = new Set<string>();
  const markupByKey = new Map<string, string>();

  for (const item of ALL_DIAGRAM_ITEMS) {
    const cacheKey = getDiagramPreviewCacheKey(item, isDark, themeColors);
    const markup = diagramPreviewMarkupCache.get(cacheKey);

    if (markup) {
      markupByKey.set(cacheKey, markup);
    }
    if (diagramPreviewFailureCache.has(cacheKey)) {
      currentFailedKeys.add(cacheKey);
    }
  }

  return {
    failedKeys: currentFailedKeys,
    markupByKey,
  };
}

function buildVirtualRows(
  categories: DiagramCategory[],
  collapsedCategoryKeys: ReadonlySet<string>,
): VirtualDiagramRow[] {
  return categories.flatMap<VirtualDiagramRow>((category) => {
    const cardRows: VirtualCardRow[] = [];
    const collapsed = collapsedCategoryKeys.has(category.key);

    if (!collapsed) {
      for (let index = 0; index < category.items.length; index += 2) {
        const items = category.items.slice(index, index + 2);
        cardRows.push({
          type: "cards",
          key: `${category.key}-cards-${index}`,
          categoryKey: category.key,
          categoryName: category.name,
          items,
          height: CARD_ROW_HEIGHT,
        });
      }
    }

    return [
      {
        type: "header",
        key: `${category.key}-header`,
        categoryKey: category.key,
        categoryName: category.name,
        collapsed,
        count: category.items.length,
        height: HEADER_ROW_HEIGHT,
      },
      ...cardRows,
    ];
  });
}

function getRequestedPreviewItems(
  rows: VirtualDiagramRow[],
  scrollTop: number,
  viewportHeight: number,
): DiagramItem[] {
  const visibleStart = scrollTop;
  const visibleEnd = scrollTop + viewportHeight;
  const preloadStart = Math.max(0, scrollTop - PREVIEW_LOOKBEHIND_PX);
  const preloadEnd = visibleEnd + PREVIEW_LOOKAHEAD_PX;
  const visibleItems: DiagramItem[] = [];
  const nearbyCandidates: PreviewCandidate<DiagramItem>[] = [];
  let top = 0;

  for (const row of rows) {
    const rowHeight = row.height + ROW_GAP;
    const rowBottom = top + rowHeight;
    const isCardRow = row.type === "cards";
    const isVisible = rowBottom >= visibleStart && top <= visibleEnd;
    const isNearViewport = rowBottom >= preloadStart && top <= preloadEnd;

    if (isCardRow && isVisible) {
      visibleItems.push(...row.items);
    } else if (isCardRow && isNearViewport) {
      const distance =
        rowBottom < visibleStart ? visibleStart - rowBottom : top - visibleEnd;

      for (const item of row.items) {
        nearbyCandidates.push({ distance, item });
      }
    }

    top += rowHeight;
  }

  return [
    ...visibleItems,
    ...nearbyCandidates
      .sort((left, right) => left.distance - right.distance)
      .map((candidate) => candidate.item),
  ];
}

function getActiveCategory(
  rows: VirtualDiagramRow[],
  scrollTop: number,
): { row: VirtualHeaderRow; top: number } | null {
  let top = 0;
  let activeHeader: { row: VirtualHeaderRow; top: number } | null = null;

  for (const row of rows) {
    if (top > scrollTop + HEADER_ROW_HEIGHT) {
      break;
    }

    if (row.type === "header") {
      activeHeader = { row, top };
    }
    top += row.height + ROW_GAP;
  }

  return activeHeader;
}

export function DiagramPanel({ isLoaded }: { isLoaded: boolean }) {
  const paletteDropTarget = usePresentationState((s) => s.paletteDropTarget);
  const currentSlideId = usePresentationState((s) => s.currentSlideId);
  const setPaletteDropTarget = usePresentationState(
    (s) => s.setPaletteDropTarget,
  );
  const updateSlide = usePresentationState((s) => s.updateSlide);
  const editor = useEditorRef<MyEditor>(currentSlideId ?? undefined);

  const insertFocusedItem = useCallback(
    (item: DiagramItem) => {
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
        source: "diagrams",
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
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="rounded-md border p-2">
              <div className="aspect-video w-full rounded-sm bg-muted/30">
                <Skeleton className="h-full w-full rounded-sm" />
              </div>
              <div className="mt-1.5 flex items-center gap-1 px-0.5">
                <div className="size-3 shrink-0 animate-pulse rounded-full bg-muted" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (paletteDropTarget?.source === "diagrams") {
    return <TrackedDiagramPanel paletteDropTarget={paletteDropTarget} />;
  }

  return <DiagramPanelContent insertFocusedItem={insertFocusedItem} />;
}

function TrackedDiagramPanel({
  paletteDropTarget,
}: {
  paletteDropTarget: PaletteDropTarget;
}) {
  const setPaletteDropTarget = usePresentationState(
    (s) => s.setPaletteDropTarget,
  );
  const updateSlide = usePresentationState((s) => s.updateSlide);
  const editor = useEditorRef<MyEditor>(paletteDropTarget.editorId);

  const replaceTrackedDrop = useCallback(
    (item: DiagramItem) => {
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
    [editor, paletteDropTarget, setPaletteDropTarget, updateSlide],
  );

  const initialSelectedIndex = Math.max(
    ALL_DIAGRAM_ITEMS.findIndex(
      (item) => item.key === paletteDropTarget.itemKey,
    ),
    0,
  );

  return (
    <DiagramPanelContent
      key={paletteDropTarget.elementId}
      initialSelectedIndex={initialSelectedIndex}
      replaceTrackedDrop={replaceTrackedDrop}
    />
  );
}

function DiagramPanelContent({
  initialSelectedIndex = 0,
  insertFocusedItem,
  replaceTrackedDrop,
}: {
  initialSelectedIndex?: number;
  insertFocusedItem?: (item: DiagramItem) => void;
  replaceTrackedDrop?: (item: DiagramItem) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategoryKeys, setCollapsedCategoryKeys] = useState<
    Set<string>
  >(() => new Set());
  const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const applyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { resolvedTheme } = usePresentationTheme();
  const isDark = resolvedTheme === "dark";
  const presentationTheme = usePresentationState((state) => state.theme);
  const customThemeData = usePresentationState(
    (state) => state.customThemeData,
  );
  const themeColors = useMemo<InfographicPaletteThemeColors | null>(
    () =>
      resolvePresentationThemeData({
        customThemeData,
        theme: presentationTheme,
      })?.colors ?? null,
    [customThemeData, presentationTheme],
  );
  const filteredCategories = useMemo(
    () =>
      diagramCategories
        .map((category) => ({
          ...category,
          items: category.items.filter((item) => {
            return matchesPanelSearch(searchQuery, [
              item.label,
              item.key,
              item.templateId,
              item.categoryName,
              item.categoryKey,
            ]);
          }),
        }))
        .filter((category) => category.items.length > 0),
    [searchQuery],
  );
  const visibleDiagramItems = useMemo(
    () => filteredCategories.flatMap((category) => category.items),
    [filteredCategories],
  );
  const virtualRows = useMemo(
    () => buildVirtualRows(filteredCategories, collapsedCategoryKeys),
    [collapsedCategoryKeys, filteredCategories],
  );
  const itemIndexByKey = useMemo(
    () => new Map(visibleDiagramItems.map((item, index) => [item.key, index])),
    [visibleDiagramItems],
  );
  const [scrollRange, setScrollRange] = useState<ScrollListRange>({
    scrollTop: 0,
    viewportHeight: 0,
  });
  const requestedPreviewItems = useMemo(
    () =>
      getRequestedPreviewItems(
        virtualRows,
        scrollRange.scrollTop,
        scrollRange.viewportHeight,
      ),
    [scrollRange.scrollTop, scrollRange.viewportHeight, virtualRows],
  );
  const previewCache = useDiagramPreviewCache(
    isDark,
    themeColors,
    requestedPreviewItems,
  );
  const activeCategory = getActiveCategory(virtualRows, scrollRange.scrollTop);
  const shouldShowStickyCategory =
    activeCategory != null && activeCategory.top < scrollRange.scrollTop;
  const scrollListKey = useMemo(
    () => [searchQuery, ...[...collapsedCategoryKeys].sort()].join("|"),
    [collapsedCategoryKeys, searchQuery],
  );

  const toggleCategory = useCallback((categoryKey: string) => {
    setCollapsedCategoryKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);

      if (nextKeys.has(categoryKey)) {
        nextKeys.delete(categoryKey);
      } else {
        nextKeys.add(categoryKey);
      }

      return nextKeys;
    });
  }, []);

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
      visibleDiagramItems.length === 0
        ? 0
        : Math.min(currentIndex, visibleDiagramItems.length - 1),
    );
  }, [visibleDiagramItems.length]);

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
      const item = visibleDiagramItems[index];

      if (!item) return;

      if (replaceTrackedDrop) {
        replaceTrackedDrop(item);
        return;
      }

      insertFocusedItem?.(item);
    },
    [insertFocusedItem, replaceTrackedDrop, visibleDiagramItems],
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
        visibleDiagramItems.length - 1,
      );

      if (boundedIndex < 0) return;

      setSelectedIndex(boundedIndex);
      focusCard(boundedIndex);
      if (replaceTrackedDrop) {
        scheduleSelectionCommit(boundedIndex);
      }
    },
    [
      focusCard,
      replaceTrackedDrop,
      scheduleSelectionCommit,
      visibleDiagramItems.length,
    ],
  );

  const handleCardKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
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
          moveSelection(visibleDiagramItems.length - 1);
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          event.stopPropagation();
          selectItem(index);
          break;
      }
    },
    [moveSelection, selectItem, visibleDiagramItems.length],
  );

  const renderDiagramRow = useCallback(
    ({ item: row }: { item: VirtualDiagramRow }) =>
      row.type === "header" ? (
        <DiagramCategoryTrigger row={row} onToggle={toggleCategory} />
      ) : (
        <div className="grid h-full grid-cols-2 gap-3 px-4 py-2">
          {row.items.map((item) => {
            const index = itemIndexByKey.get(item.key);
            if (index === undefined) return null;

            const cacheKey = getDiagramPreviewCacheKey(
              item,
              isDark,
              themeColors,
            );
            const previewMarkup = previewCache.markupByKey.get(cacheKey);
            const hasPreviewError = previewCache.failedKeys.has(cacheKey);

            return (
              <DiagramCard
                key={item.key}
                item={item}
                previewMarkup={previewMarkup}
                hasPreviewError={hasPreviewError}
                refCallback={(node) => {
                  cardRefs.current[index] = node;
                }}
                isSelected={selectedIndex === index}
                tabIndex={selectedIndex === index ? 0 : -1}
                onClick={() => selectItem(index)}
                onFocus={() => setSelectedIndex(index)}
                onKeyDown={(event) => handleCardKeyDown(event, index)}
              />
            );
          })}
        </div>
      ),
    [
      handleCardKeyDown,
      isDark,
      itemIndexByKey,
      previewCache.failedKeys,
      previewCache.markupByKey,
      selectItem,
      selectedIndex,
      themeColors,
      toggleCategory,
    ],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PanelSearchFilter
        onQueryChange={setSearchQuery}
        placeholder="Search diagrams..."
        query={searchQuery}
      />
      <div className="relative min-h-0 flex-1">
        {visibleDiagramItems.length > 0 ? (
          <>
            {shouldShowStickyCategory && (
              <div className="absolute top-0 right-0 left-0 z-20 border-b bg-background/95 backdrop-blur">
                <DiagramCategoryTrigger
                  row={activeCategory.row}
                  onToggle={toggleCategory}
                  sticky
                />
              </div>
            )}

            <ScrollList
              key={scrollListKey}
              items={virtualRows}
              getItemKey={(row) => row.key}
              getItemHeight={(row) => row.height}
              gap={ROW_GAP}
              overscan={VIRTUAL_ROW_OVERSCAN}
              paddingBottom={20}
              onRangeChange={(range) => {
                setScrollRange((currentRange) =>
                  currentRange.scrollTop === range.scrollTop &&
                  currentRange.viewportHeight === range.viewportHeight
                    ? currentRange
                    : range,
                );
              }}
              renderItem={renderDiagramRow}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            No diagrams match your search.
          </div>
        )}
      </div>
    </div>
  );
}

function DiagramCategoryTrigger({
  onToggle,
  row,
  sticky = false,
}: {
  onToggle: (categoryKey: string) => void;
  row: VirtualHeaderRow;
  sticky?: boolean;
}) {
  return (
    <button
      type="button"
      aria-expanded={!row.collapsed}
      onClick={() => onToggle(row.categoryKey)}
      className={cn(
        "flex h-full w-full items-center justify-between gap-3 border-b bg-background/95 px-4 text-left transition-colors hover:bg-muted/35 focus-visible:bg-muted/50 focus-visible:outline-none",
        sticky && "h-9 border-b-0",
      )}
    >
      <span className="min-w-0 text-xs font-semibold text-muted-foreground">
        {row.categoryName}{" "}
        <span className="font-normal opacity-70">({row.count})</span>
      </span>
      <ChevronDown
        className={cn(
          "size-4 shrink-0 text-muted-foreground transition-transform",
          row.collapsed && "-rotate-90",
        )}
      />
    </button>
  );
}

function DiagramCard({
  item,
  previewMarkup,
  hasPreviewError,
  refCallback,
  isSelected,
  tabIndex,
  onClick,
  onFocus,
  onKeyDown,
}: {
  item: DiagramItem;
  previewMarkup: string | undefined;
  hasPreviewError: boolean;
  refCallback: (node: HTMLButtonElement | null) => void;
  isSelected: boolean;
  tabIndex: number;
  onClick: () => void;
  onFocus: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: DRAG_ITEM_BLOCK,
    item: {
      id: `external-${item.key}`,
      element: item.node,
      itemKey: item.key,
      sourcePanel: "diagrams" as const,
    },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  return (
    <button
      type="button"
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
        "group h-full cursor-grab rounded-md border p-2 transition hover:border-primary hover:shadow focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:cursor-grabbing",
        isSelected && "border-primary ring-1 ring-primary",
        isDragging && "opacity-50",
      )}
    >
      <DiagramPreview
        previewMarkup={previewMarkup}
        hasPreviewError={hasPreviewError}
      />
      <div className="mt-1.5 flex items-start gap-1 px-0.5">
        <GripVertical className="mt-0.5 size-3 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
        <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
          {item.label}
        </span>
      </div>
    </button>
  );
}

function DiagramPreview({
  previewMarkup,
  hasPreviewError,
}: {
  previewMarkup: string | undefined;
  hasPreviewError: boolean;
}) {
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = previewRef.current;
    if (!container) return;

    container.replaceChildren();
    if (!previewMarkup) return;

    const template = document.createElement("template");
    template.innerHTML = previewMarkup;
    container.replaceChildren(template.content.cloneNode(true));
  }, [previewMarkup]);

  return (
    <div className="pointer-events-none relative aspect-video w-full overflow-hidden rounded-sm border bg-card select-none">
      {hasPreviewError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/10 p-2 text-center text-xs text-muted-foreground">
          Preview unavailable
        </div>
      )}
      <div
        ref={previewRef}
        className="h-full w-full p-1.5 [&_svg]:h-full [&_svg]:w-full"
      />
    </div>
  );
}
