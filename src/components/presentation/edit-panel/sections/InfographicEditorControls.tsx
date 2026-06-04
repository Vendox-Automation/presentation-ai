"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  applyThemeToSyntax,
  changeInfographicTemplate,
  convertInfographicData,
  parseInfographicTemplate,
  type InfographicPaletteThemeColors,
} from "@/components/notebook/presentation/editor/utils/infographic-utils";
import { PALETTE_DROP_MUTABLE_KEY } from "@/components/notebook/presentation/editor/utils/paletteDrop";
import { ScrollList, type ScrollListRange } from "@/components/ui/scroll-list";
import { INFOGRAPHIC_CATEGORIES } from "@/constants/antv-templates";
import { renderInfographicPreviewHtml } from "@/hooks/presentation/infographic/infographic-preview-renderer";
import { resolvePresentationThemeData } from "@/lib/presentation/theme-resolution";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { usePresentationTheme } from "../../providers/PresentationThemeProvider";
import { PanelSearchFilter } from "./PanelSearchFilter";
import { matchesPanelSearch } from "./PanelSearchFilter";

const VIRTUAL_ROW_OVERSCAN = 1_200;
const PREVIEW_LOOKAHEAD_PX = 3_600;
const PREVIEW_LOOKBEHIND_PX = 1_000;
const HEADER_ROW_HEIGHT = 37;
const CARD_ROW_HEIGHT = 159;
const ROW_GAP = 0;

type InfographicPreviewCache = {
  failedKeys: Set<string>;
  markupByKey: Map<string, string>;
};

type InfographicPreviewRequest = {
  currentSyntax: string;
  currentTemplate: string | null;
  isDark: boolean;
  templates: string[];
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
  key: string;
  templates: string[];
  type: "cards";
};

type VirtualTemplateRow = VirtualHeaderRow | VirtualCardRow;
type TemplateCategory = (typeof INFOGRAPHIC_CATEGORIES)[number];

const infographicPreviewMarkupCache = new Map<string, string>();
const infographicPreviewFailureCache = new Set<string>();
const infographicPreviewPromiseCache = new Map<string, Promise<void>>();

function getTemplateLabel(templateId: string): string {
  return templateId
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInfographicPreviewCacheKey(
  templateId: string,
  currentSyntax: string,
  currentTemplate: string | null,
  isDark: boolean,
  themeColors: InfographicPaletteThemeColors | null,
): string {
  return [
    templateId,
    currentTemplate ?? "",
    currentSyntax,
    isDark ? "dark" : "light",
    themeColors?.primary ?? "",
    themeColors?.accent ?? "",
    themeColors?.smartLayout ?? "",
    themeColors?.text ?? "",
    themeColors?.heading ?? "",
    themeColors?.cardBackground ?? "",
  ].join("|");
}

async function renderInfographicPreviewMarkup({
  currentSyntax,
  currentTemplate,
  isDark,
  templateId,
  themeColors,
}: {
  currentSyntax: string;
  currentTemplate: string | null;
  isDark: boolean;
  templateId: string;
  themeColors: InfographicPaletteThemeColors | null;
}): Promise<string> {
  if (!currentSyntax || !currentTemplate) {
    throw new Error(
      "Infographic preview requires current syntax and template.",
    );
  }

  const converted = convertInfographicData(
    currentSyntax,
    currentTemplate,
    templateId,
  );

  return renderInfographicPreviewHtml(
    applyThemeToSyntax(converted, isDark, themeColors),
  );
}

async function ensureInfographicPreviewMarkup(
  templateId: string,
  currentSyntax: string,
  currentTemplate: string | null,
  isDark: boolean,
  themeColors: InfographicPaletteThemeColors | null,
): Promise<void> {
  const cacheKey = getInfographicPreviewCacheKey(
    templateId,
    currentSyntax,
    currentTemplate,
    isDark,
    themeColors,
  );

  if (
    infographicPreviewMarkupCache.has(cacheKey) ||
    infographicPreviewFailureCache.has(cacheKey)
  ) {
    return;
  }

  const existingPromise = infographicPreviewPromiseCache.get(cacheKey);
  if (existingPromise) {
    await existingPromise;
    return;
  }

  const previewPromise = renderInfographicPreviewMarkup({
    currentSyntax,
    currentTemplate,
    isDark,
    templateId,
    themeColors,
  })
    .then((markup) => {
      infographicPreviewMarkupCache.set(cacheKey, markup);
    })
    .catch((error: unknown) => {
      console.error("Failed to render infographic preview:", error);
      infographicPreviewFailureCache.add(cacheKey);
    })
    .finally(() => {
      infographicPreviewPromiseCache.delete(cacheKey);
    });

  infographicPreviewPromiseCache.set(cacheKey, previewPromise);
  await previewPromise;
}

function getPendingPreviewTemplate(
  templates: string[],
  currentSyntax: string,
  currentTemplate: string | null,
  isDark: boolean,
  themeColors: InfographicPaletteThemeColors | null,
): string | undefined {
  return templates.find((templateId) => {
    const cacheKey = getInfographicPreviewCacheKey(
      templateId,
      currentSyntax,
      currentTemplate,
      isDark,
      themeColors,
    );
    return (
      !infographicPreviewMarkupCache.has(cacheKey) &&
      !infographicPreviewFailureCache.has(cacheKey) &&
      !infographicPreviewPromiseCache.has(cacheKey)
    );
  });
}

function useInfographicPreviewCache(
  isDark: boolean,
  themeColors: InfographicPaletteThemeColors | null,
  requestedTemplates: string[],
  currentSyntax: string,
  currentTemplate: string | null,
): InfographicPreviewCache {
  const [, setCacheVersion] = useState(0);
  const isMountedRef = useRef(false);
  const isPreloadingRef = useRef(false);
  const latestRequestRef = useRef<InfographicPreviewRequest>({
    currentSyntax,
    currentTemplate,
    isDark,
    templates: requestedTemplates,
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
      currentSyntax,
      currentTemplate,
      isDark,
      templates: requestedTemplates,
      themeColors,
    };
    if (!currentSyntax || !currentTemplate) return;

    async function preloadRequestedPreviews() {
      if (isPreloadingRef.current) return;

      isPreloadingRef.current = true;

      try {
        const request = latestRequestRef.current;
        const templateId = getPendingPreviewTemplate(
          request.templates,
          request.currentSyntax,
          request.currentTemplate,
          request.isDark,
          request.themeColors,
        );

        if (templateId) {
          await ensureInfographicPreviewMarkup(
            templateId,
            request.currentSyntax,
            request.currentTemplate,
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
          getPendingPreviewTemplate(
            request.templates,
            request.currentSyntax,
            request.currentTemplate,
            request.isDark,
            request.themeColors,
          )
        ) {
          void preloadRequestedPreviews();
        }

        isPreloadingRef.current = false;
        const latestRequest = latestRequestRef.current;

        if (
          isMountedRef.current &&
          getPendingPreviewTemplate(
            latestRequest.templates,
            latestRequest.currentSyntax,
            latestRequest.currentTemplate,
            latestRequest.isDark,
            latestRequest.themeColors,
          )
        ) {
          void preloadRequestedPreviews();
        }
      }
    }

    void preloadRequestedPreviews();
  }, [currentSyntax, currentTemplate, isDark, requestedTemplates, themeColors]);

  const currentFailedKeys = new Set<string>();
  const markupByKey = new Map<string, string>();

  for (const category of INFOGRAPHIC_CATEGORIES) {
    for (const templateId of category.templates) {
      const cacheKey = getInfographicPreviewCacheKey(
        templateId,
        currentSyntax,
        currentTemplate,
        isDark,
        themeColors,
      );
      const markup = infographicPreviewMarkupCache.get(cacheKey);

      if (markup) {
        markupByKey.set(cacheKey, markup);
      }
      if (infographicPreviewFailureCache.has(cacheKey)) {
        currentFailedKeys.add(cacheKey);
      }
    }
  }

  return {
    failedKeys: currentFailedKeys,
    markupByKey,
  };
}

function buildVirtualRows(
  categories: TemplateCategory[],
  collapsedCategoryKeys: ReadonlySet<string>,
): VirtualTemplateRow[] {
  return categories.flatMap<VirtualTemplateRow>((category) => {
    const cardRows: VirtualCardRow[] = [];
    const collapsed = collapsedCategoryKeys.has(category.key);

    if (!collapsed) {
      for (let index = 0; index < category.templates.length; index += 2) {
        cardRows.push({
          type: "cards",
          key: `${category.key}-cards-${index}`,
          categoryKey: category.key,
          categoryName: category.name,
          templates: category.templates.slice(index, index + 2),
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
        count: category.templates.length,
        height: HEADER_ROW_HEIGHT,
      },
      ...cardRows,
    ];
  });
}

function getRequestedPreviewTemplates(
  rows: VirtualTemplateRow[],
  scrollTop: number,
  viewportHeight: number,
): string[] {
  const visibleStart = scrollTop;
  const visibleEnd = scrollTop + viewportHeight;
  const preloadStart = Math.max(0, scrollTop - PREVIEW_LOOKBEHIND_PX);
  const preloadEnd = visibleEnd + PREVIEW_LOOKAHEAD_PX;
  const visibleTemplates: string[] = [];
  const nearbyCandidates: PreviewCandidate<string>[] = [];
  let top = 0;

  for (const row of rows) {
    const rowHeight = row.height + ROW_GAP;
    const rowBottom = top + rowHeight;
    const isCardRow = row.type === "cards";
    const isVisible = rowBottom >= visibleStart && top <= visibleEnd;
    const isNearViewport = rowBottom >= preloadStart && top <= preloadEnd;

    if (isCardRow && isVisible) {
      visibleTemplates.push(...row.templates);
    } else if (isCardRow && isNearViewport) {
      const distance =
        rowBottom < visibleStart ? visibleStart - rowBottom : top - visibleEnd;

      for (const templateId of row.templates) {
        nearbyCandidates.push({ distance, item: templateId });
      }
    }

    top += rowHeight;
  }

  return [
    ...visibleTemplates,
    ...nearbyCandidates
      .sort((left, right) => left.distance - right.distance)
      .map((candidate) => candidate.item),
  ];
}

function getActiveCategory(
  rows: VirtualTemplateRow[],
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

export function InfographicEditorControls() {
  const { resolvedTheme } = usePresentationTheme();
  const isDark = resolvedTheme === "dark";
  const presentationTheme = usePresentationState((state) => state.theme);
  const customThemeData = usePresentationState(
    (state) => state.customThemeData,
  );
  const themeColors = useMemo<InfographicPaletteThemeColors | null>(() => {
    return (
      resolvePresentationThemeData({
        customThemeData,
        theme: presentationTheme,
      })?.colors ?? null
    );
  }, [customThemeData, presentationTheme]);

  const boundUpdateElement = usePresentationState((s) => s.boundUpdateElement);
  const setPaletteDropTarget = usePresentationState(
    (s) => s.setPaletteDropTarget,
  );

  const [isConverting, setIsConverting] = useState(false);
  const [scrollRange, setScrollRange] = useState<ScrollListRange>({
    scrollTop: 0,
    viewportHeight: 0,
  });
  const [collapsedCategoryKeys, setCollapsedCategoryKeys] = useState<
    Set<string>
  >(() => new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Track which template is currently applied (updates on each conversion)
  const [appliedTemplate, setAppliedTemplate] = useState<string | null>(null);

  // Committed syntax: captured once when the panel opens.
  // All previews and conversions derive from this base syntax,
  // so we never re-render previews after each conversion.
  const [committedSyntax, setCommittedSyntax] = useState<string>("");
  const committedTemplate = useMemo(
    () => parseInfographicTemplate(committedSyntax),
    [committedSyntax],
  );
  const hasCommitted = useRef(false);

  const currentSlideId = usePresentationState((s) => s.currentSlideId);
  const slides = usePresentationState((s) => s.slides);

  // Find and commit the syntax once when the panel first opens
  useEffect(() => {
    if (hasCommitted.current || !currentSlideId) return;

    const slide = slides.find((s) => s.id === currentSlideId);
    if (!slide?.content) return;

    const findInfographicSyntax = (nodes: unknown[]): string | null => {
      for (const node of nodes) {
        const n = node as Record<string, unknown>;
        if (n.type === "antv-infographic" && typeof n.syntax === "string") {
          return n.syntax;
        }
        if (Array.isArray(n.children)) {
          const found = findInfographicSyntax(n.children as unknown[]);
          if (found) return found;
        }
      }
      return null;
    };

    const syntax = findInfographicSyntax(slide.content as unknown[]);
    if (syntax) {
      setCommittedSyntax(syntax);
      const template = parseInfographicTemplate(syntax);
      setAppliedTemplate(template);
      hasCommitted.current = true;
    }
  }, [currentSlideId, slides]);

  const filteredCategories = useMemo(
    () =>
      INFOGRAPHIC_CATEGORIES.map((category) => ({
        ...category,
        templates: category.templates.filter((templateId) => {
          return matchesPanelSearch(searchQuery, [
            getTemplateLabel(templateId),
            templateId,
            category.name,
            category.key,
          ]);
        }),
      })).filter((category) => category.templates.length > 0),
    [searchQuery],
  );
  const visibleTemplateCount = useMemo(
    () =>
      filteredCategories.reduce(
        (total, category) => total + category.templates.length,
        0,
      ),
    [filteredCategories],
  );
  const virtualRows = useMemo(
    () => buildVirtualRows(filteredCategories, collapsedCategoryKeys),
    [collapsedCategoryKeys, filteredCategories],
  );
  const requestedTemplates = useMemo(
    () =>
      getRequestedPreviewTemplates(
        virtualRows,
        scrollRange.scrollTop,
        scrollRange.viewportHeight,
      ),
    [scrollRange.scrollTop, scrollRange.viewportHeight, virtualRows],
  );
  const previewCache = useInfographicPreviewCache(
    isDark,
    themeColors,
    requestedTemplates,
    committedSyntax,
    committedTemplate,
  );
  const activeCategory = getActiveCategory(virtualRows, scrollRange.scrollTop);
  const shouldShowStickyCategory =
    activeCategory != null && activeCategory.top < scrollRange.scrollTop;
  const scrollListKey = useMemo(
    () => [searchQuery, ...[...collapsedCategoryKeys].sort()].join("|"),
    [collapsedCategoryKeys, searchQuery],
  );

  const handleTemplateChange = useCallback(
    (newTemplateId: string) => {
      if (
        !committedSyntax ||
        !boundUpdateElement ||
        newTemplateId === appliedTemplate
      )
        return;

      setIsConverting(true);

      // Always convert from the committed (original) syntax
      const newSyntax = committedTemplate
        ? convertInfographicData(
            committedSyntax,
            committedTemplate,
            newTemplateId,
          )
        : changeInfographicTemplate(committedSyntax, newTemplateId);

      setPaletteDropTarget(null);
      boundUpdateElement({
        syntax: newSyntax,
        data: undefined,
        [PALETTE_DROP_MUTABLE_KEY]: false,
      });
      setAppliedTemplate(newTemplateId);

      setTimeout(() => {
        setIsConverting(false);
      }, 500);
    },
    [
      committedSyntax,
      committedTemplate,
      appliedTemplate,
      boundUpdateElement,
      setPaletteDropTarget,
    ],
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

  if (!boundUpdateElement) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Select an infographic element to edit it.
        </p>
      </div>
    );
  }

  const renderTemplateRow = ({ item: row }: { item: VirtualTemplateRow }) =>
    row.type === "header" ? (
      <InfographicCategoryTrigger row={row} onToggle={toggleCategory} />
    ) : (
      <div className="grid h-full grid-cols-2 gap-3 px-4 py-2">
        {row.templates.map((templateId) => {
          const cacheKey = getInfographicPreviewCacheKey(
            templateId,
            committedSyntax,
            committedTemplate,
            isDark,
            themeColors,
          );

          return (
            <InfographicCard
              key={templateId}
              templateId={templateId}
              isSelected={templateId === appliedTemplate}
              previewMarkup={previewCache.markupByKey.get(cacheKey)}
              hasPreviewError={previewCache.failedKeys.has(cacheKey)}
              onSelectTemplate={handleTemplateChange}
            />
          );
        })}
      </div>
    );

  return (
    <div className="relative flex h-full flex-col">
      <PanelSearchFilter
        onQueryChange={setSearchQuery}
        placeholder="Search templates..."
        query={searchQuery}
      />
      <div className="relative min-h-0 flex-1">
        {visibleTemplateCount > 0 ? (
          <>
            {isConverting ? (
              <div className="absolute top-0 right-0 left-0 z-30 flex h-9 items-center justify-center gap-2 border-b bg-background/95 text-sm text-muted-foreground backdrop-blur">
                <Loader2 className="size-4 animate-spin" />
                <span>Converting&hellip;</span>
              </div>
            ) : shouldShowStickyCategory ? (
              <div className="absolute top-0 right-0 left-0 z-20 border-b bg-background/95 backdrop-blur">
                <InfographicCategoryTrigger
                  row={activeCategory.row}
                  onToggle={toggleCategory}
                  sticky
                />
              </div>
            ) : null}

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
              renderItem={renderTemplateRow}
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
            No infographic templates match your search.
          </div>
        )}
      </div>
    </div>
  );
}

function InfographicCategoryTrigger({
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

function InfographicCard({
  templateId,
  isSelected,
  previewMarkup,
  hasPreviewError,
  onSelectTemplate,
}: {
  templateId: string;
  isSelected: boolean;
  previewMarkup: string | undefined;
  hasPreviewError: boolean;
  onSelectTemplate: (templateId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelectTemplate(templateId)}
      className={cn(
        "group relative h-full rounded-md border p-2 text-left transition hover:border-primary hover:shadow focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        isSelected && "border-primary ring-1 ring-primary",
      )}
    >
      <InfographicPreview
        previewMarkup={previewMarkup}
        hasPreviewError={hasPreviewError}
      />
      <div className="mt-1.5 flex items-start gap-1 px-0.5">
        <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
          {getTemplateLabel(templateId)}
        </span>
      </div>
      {isSelected && (
        <div className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
          <Check className="size-3" />
        </div>
      )}
    </button>
  );
}

function InfographicPreview({
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
      {!previewMarkup && !hasPreviewError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}
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
