"use client";

import { Search, X } from "lucide-react";
import * as React from "react";

import {
  CATEGORY_ICONS,
  ELEMENT_CATEGORIES,
  ICON_LIST,
} from "@/components/notebook/presentation/editor/lib";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/plate/ui/dropdown-menu";
import { ToolbarButton, ToolbarGroup } from "@/components/plate/ui/toolbar";
import { FLOATING_TOOLBAR_IGNORE_CLASS } from "./toolbar-interaction";
import { useToolbarContext } from "./ToolbarContext";

type LayoutOption = ReturnType<
  typeof useToolbarContext
>["availableOptionsGrouped"][string][number];

function getOptionProperty(
  option: LayoutOption,
  element: Record<string, unknown> | undefined,
) {
  return option.key ? element?.[option.key] : undefined;
}

function optionMatchesElement(
  option: LayoutOption,
  elementType: string,
  element: Record<string, unknown> | undefined,
) {
  if (option.type !== elementType) return false;
  if (!option.variant) return true;

  if (option.key === "isFunnel") {
    const currentVariant = element?.isFunnel ? "funnel" : "pyramid";
    return currentVariant === option.variant;
  }

  const elementValue = getOptionProperty(option, element);
  return (
    elementValue === option.variant ||
    (!elementValue && option.type === ICON_LIST && option.variant === "icon") ||
    (!elementValue && option.variant === "default")
  );
}

function getOptionLayoutChangeData(option: LayoutOption) {
  const data: Record<string, unknown> = {};

  if (option.supportsOrientation) {
    data.orientation = "vertical";
  }

  if (option.variant && option.key) {
    data[option.key] = option.variant;
  }

  return Object.keys(data).length > 0 ? data : undefined;
}

export function ElementTypeSelector() {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const {
    element,
    elementType,
    availableOptionsGrouped,
    selectedOption,
    isCurrentElementChart,
    handleLayoutChange,
  } = useToolbarContext();

  const applyOption = React.useCallback(
    (option: LayoutOption) => {
      handleLayoutChange(option.type, getOptionLayoutChangeData(option));
      setOpen(false);
    },
    [handleLayoutChange],
  );

  const filteredOptionsGrouped = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return availableOptionsGrouped;
    }

    const nextOptionsGrouped: Record<string, readonly LayoutOption[]> = {};

    for (const [category, options] of Object.entries(availableOptionsGrouped)) {
      const categoryMatches = category.toLowerCase().includes(normalizedQuery);
      const filteredOptions = categoryMatches
        ? options
        : options.filter((option) =>
            [option.name, option.type, option.variant, option.key].some(
              (value) =>
                String(value ?? "")
                  .toLowerCase()
                  .includes(normalizedQuery),
            ),
          );

      if (filteredOptions.length > 0) {
        nextOptionsGrouped[category] = filteredOptions;
      }
    }

    return nextOptionsGrouped;
  }, [availableOptionsGrouped, searchQuery]);

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setSearchQuery("");
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;

    const animationFrameId = window.requestAnimationFrame(() => {
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [open]);

  const keepSearchFocusInsideMenu = React.useCallback(
    (event: React.SyntheticEvent) => {
      event.stopPropagation();
    },
    [],
  );

  const filteredChartOptions =
    filteredOptionsGrouped[ELEMENT_CATEGORIES.CHARTS] ?? [];
  const hasFilteredOptions = isCurrentElementChart
    ? filteredChartOptions.length > 0
    : Object.keys(filteredOptionsGrouped).length > 0;

  return (
    <ToolbarGroup>
      <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false}>
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            className="min-w-31.25"
            pressed={open}
            tooltip="Change Element Type"
            isDropdown
          >
            {selectedOption}
          </ToolbarButton>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className={`${FLOATING_TOOLBAR_IGNORE_CLASS} w-80 min-w-0`}
          align="start"
        >
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchInputRef}
                aria-label="Search element type"
                className="h-9 w-full rounded-md border border-input bg-background pr-9 pl-9 text-sm outline-hidden transition-[border-color,box-shadow] placeholder:text-muted-foreground focus:border-ring focus:ring-3 focus:ring-ring/50"
                placeholder="Search element type"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onClick={keepSearchFocusInsideMenu}
                onKeyDown={(event) => {
                  if (event.key !== "Escape") {
                    event.stopPropagation();
                  }
                }}
                onMouseDown={keepSearchFocusInsideMenu}
                onPointerDown={keepSearchFocusInsideMenu}
              />
              {searchQuery ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  onMouseDown={keepSearchFocusInsideMenu}
                  onPointerDown={keepSearchFocusInsideMenu}
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="scrollbar-thin max-h-96 overflow-y-auto p-2 scrollbar-thumb-primary scrollbar-track-primary/20">
            <div className="space-y-1">
              {/* For charts: show compatible charts directly without submenu */}
              {!hasFilteredOptions ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No layouts found
                </div>
              ) : isCurrentElementChart ? (
                <div className="grid grid-cols-2 gap-1">
                  {filteredChartOptions.map((block) => {
                    const isSelected = block.type === elementType;
                    const IconComponent = block.icon;
                    return (
                      <DropdownMenuItem
                        key={block.type}
                        onClick={() => applyOption(block)}
                        className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        {IconComponent}
                        <span className="flex-1 text-left">{block.name}</span>
                        {isSelected && (
                          <span className="text-xs font-bold">✓</span>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              ) : (
                /* For non-charts: use categories with submenus */
                Object.entries(filteredOptionsGrouped).map(
                  ([category, elements]) => {
                    const isCategoryActive = elements.some((block) =>
                      optionMatchesElement(block, elementType, element),
                    );

                    return (
                      <DropdownMenuSub key={category}>
                        <DropdownMenuSubTrigger
                          className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                            isCategoryActive
                              ? "bg-primary text-primary-foreground data-[state=open]:bg-primary data-[state=open]:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
                              : "hover:bg-accent hover:text-accent-foreground"
                          }`}
                        >
                          {CATEGORY_ICONS[category]}
                          <span className="flex-1 text-left">{category}</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent
                          className={`${FLOATING_TOOLBAR_IGNORE_CLASS} w-56`}
                        >
                          <div className="space-y-1 p-1">
                            {elements.map((block) => {
                              const isSelected = optionMatchesElement(
                                block,
                                elementType,
                                element,
                              );
                              const IconComponent = block.icon;

                              return (
                                <DropdownMenuItem
                                  key={`${block.type}-${block.key ?? "type"}-${block.variant || "default"}`}
                                  onClick={() => applyOption(block)}
                                  className={`flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                                    isSelected
                                      ? "bg-primary text-primary-foreground"
                                      : "hover:bg-accent hover:text-accent-foreground"
                                  }`}
                                >
                                  {IconComponent}
                                  <span className="flex-1 text-left">
                                    {block.name}
                                  </span>
                                  {isSelected && (
                                    <span className="text-xs font-bold">✓</span>
                                  )}
                                </DropdownMenuItem>
                              );
                            })}
                          </div>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    );
                  },
                )
              )}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </ToolbarGroup>
  );
}
