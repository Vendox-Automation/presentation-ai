"use client";

import { UpdateElementCommand } from "@antv/infographic";
import {
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from "@floating-ui/react-dom";
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ChevronDownIcon,
  ReplaceIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import * as React from "react";
import { createPortal } from "react-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/plate/ui/dropdown-menu";
import {
  Toolbar,
  ToolbarButton,
  ToolbarGroup,
} from "@/components/plate/ui/toolbar";
import ColorPicker from "@/components/ui/color-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { type InfographicSelectionPayload } from "@/hooks/presentation/infographic/InfographicSelectionPlugin";
import { usePresentationState } from "@/states/presentation-state";

interface Props {
  onDataMutation?: () => void;
  payload: InfographicSelectionPayload;
  portalContainer?: HTMLElement | null;
}

type ElementUpdate = Partial<ElementProps> & {
  style?: Record<string, unknown>;
};
type UpdateElementTarget = ConstructorParameters<
  typeof UpdateElementCommand
>[0];
type ElementProps = ConstructorParameters<typeof UpdateElementCommand>[1];

type TextAlignValue = "start" | "middle" | "end";
type TextFormatting = {
  fontColor: string;
  fontFamily: string;
  fontSize: string;
  textAlign: TextAlignValue;
};

const FONT_SIZES = ["12", "14", "16", "20", "24", "32", "48"] as const;
const DEFAULT_TEXT_FILL = "#1f1f1f";
const DEFAULT_TEXT_SIZE = "14";
const DEFAULT_TEXT_ALIGN: TextAlignValue = "start";
const DEFAULT_FONT_FAMILY = "Open Sans";
const TOOLBAR_PORTAL_Z_INDEX = 1000002;

const FontPicker = dynamic(
  () => import("@/components/ui/font-picker").then((mod) => mod.FontPicker),
  {
    loading: () => <Skeleton className="h-8 w-37.5" />,
    ssr: false,
  },
);

export function InfographicFloatingToolbar({
  onDataMutation,
  payload,
  portalContainer,
}: Props) {
  const {
    type,
    boundingRect,
    commander,
    textElements,
    iconElements,
    geometryElements,
    iconIndexes,
    state,
    fontFamily = DEFAULT_FONT_FAMILY,
  } = payload;

  const hasElements =
    textElements.length > 0 ||
    iconElements.length > 0 ||
    geometryElements.length > 0;

  const allElements = React.useMemo(
    () => [...textElements, ...iconElements, ...geometryElements],
    [textElements, iconElements, geometryElements],
  );
  const selectedTextKey = React.useMemo(
    () => textElements.map(getElementSelectionKey).join("|"),
    [textElements],
  );
  const [textFormatting, setTextFormatting] = React.useState<TextFormatting>(
    () => getTextFormatting(textElements, fontFamily),
  );
  const [currentIconFill, setCurrentIconFill] = React.useState(() =>
    getIconFill(iconElements),
  );

  const { refs, floatingStyles } = useFloating({
    placement: "top",
    strategy: "fixed",
    middleware: [
      offset(12),
      flip({
        fallbackPlacements: ["bottom", "top-start", "top-end"],
        padding: 12,
      }),
      shift({ padding: 12 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  React.useEffect(() => {
    if (allElements.length > 0) {
      refs.setReference({
        getBoundingClientRect: () => getCombinedElementRect(allElements),
        contextElement: allElements[0],
      });
    } else if (boundingRect) {
      refs.setReference({
        getBoundingClientRect: () => boundingRect,
      });
    }
  }, [allElements, boundingRect, refs]);

  React.useEffect(() => {
    setTextFormatting(getTextFormatting(textElements, fontFamily));
  }, [selectedTextKey, textElements, fontFamily]);

  React.useEffect(() => {
    setCurrentIconFill(getIconFill(iconElements));
  }, [iconElements]);

  const openIconPicker = usePresentationState((s) => s.openIconPicker);

  const applyElementAttributes = React.useCallback(
    (
      elements: SVGElement[],
      attrs: Record<string, unknown>,
      styleAttrs: Record<string, unknown> = attrs,
    ) => {
      if (!commander || elements.length === 0) return;

      const update: ElementUpdate = {
        attributes: attrs,
        style: styleAttrs,
      };

      void commander.executeBatch(
        elements.map(
          (element) =>
            new UpdateElementCommand(element as UpdateElementTarget, update),
        ),
      );
    },
    [commander],
  );

  const handleChangeIcon = React.useCallback(() => {
    if (iconIndexes.length === 0 || !state) return;
    const indexes = iconIndexes[0];
    if (!indexes) return;

    openIconPicker("", (newIconName) => {
      state.updateItemDatum(indexes, { icon: newIconName });
      onDataMutation?.();
    });
  }, [iconIndexes, onDataMutation, state, openIconPicker]);

  if (type === "none" || !hasElements) return null;

  const portalContent = (
    <div
      ref={refs.setFloating}
      className="antv-infographic-toolbar-floating ignore-click-outside/toolbar pointer-events-auto"
      style={{
        ...floatingStyles,
        zIndex: TOOLBAR_PORTAL_Z_INDEX,
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Toolbar className="scrollbar-hide max-w-[88vw] gap-1 overflow-x-auto rounded-lg border border-white/12 bg-neutral-950/96 p-1.5 whitespace-nowrap text-white opacity-100 shadow-[0_16px_40px_rgba(0,0,0,0.35)] backdrop-blur-md print:hidden">
        {(type === "text" || type === "mixed") && (
          <ToolbarGroup className="[&_>div]:gap-1 **:data-[orientation='vertical']:bg-white/15">
            <div className="relative h-8 w-48">
              <FontPicker
                value={(font) => {
                  setTextFormatting((current) => ({
                    ...current,
                    fontFamily: font,
                  }));
                  applyElementAttributes(
                    textElements,
                    { "font-family": font },
                    { fontFamily: font },
                  );
                }}
                defaultValue={textFormatting.fontFamily}
                autoLoad={true}
                selectClassName="h-8! w-full border-0 bg-transparent shadow-none hover:bg-white/10 focus-visible:ring-white/20 [&>div]:opacity-0 [&>svg]:opacity-0"
              />
              <div className="pointer-events-none absolute inset-0 flex items-center gap-2 px-2 text-sm">
                <span
                  className="min-w-0 flex-1 truncate text-left font-medium text-white"
                  title={textFormatting.fontFamily}
                >
                  {formatFontFamily(textFormatting.fontFamily)}
                </span>
                <ChevronDownIcon className="size-3.5 shrink-0 text-white/55" />
              </div>
            </div>

            <ColorPicker
              value={textFormatting.fontColor}
              onChange={(color) => {
                setTextFormatting((current) => ({
                  ...current,
                  fontColor: color,
                }));
                applyElementAttributes(
                  textElements,
                  { fill: color },
                  { color },
                );
              }}
            >
              <ToolbarButton
                tooltip="Font color"
                className="h-8 min-w-10 rounded-md px-2 text-white hover:bg-white/10 hover:text-white"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="size-4 rounded-sm border border-white/25 shadow-inner"
                    style={{ backgroundColor: textFormatting.fontColor }}
                  />
                  <span className="text-[13px] leading-none font-semibold">
                    A
                  </span>
                </div>
              </ToolbarButton>
            </ColorPicker>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <ToolbarButton
                  tooltip="Font size"
                  className="h-8 min-w-13 rounded-md px-2 text-white hover:bg-white/10 hover:text-white"
                >
                  <span className="tabular-nums">
                    {textFormatting.fontSize}
                  </span>
                  <ChevronDownIcon className="size-3 text-white/55" />
                </ToolbarButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="ignore-click-outside/toolbar z-1000001 min-w-18 border-white/10 bg-neutral-950 text-white shadow-xl"
                align="start"
                sideOffset={8}
              >
                <DropdownMenuRadioGroup
                  value={textFormatting.fontSize}
                  onValueChange={(val) => {
                    setTextFormatting((current) => ({
                      ...current,
                      fontSize: val,
                    }));
                    applyElementAttributes(
                      textElements,
                      { "font-size": Number(val) },
                      { fontSize: `${val}px` },
                    );
                  }}
                >
                  {FONT_SIZES.map((size) => (
                    <DropdownMenuRadioItem
                      key={size}
                      value={size}
                      className="pl-8 focus:bg-white/10 focus:text-white"
                    >
                      {size}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <ToolbarButton
                  tooltip="Alignment"
                  className="h-8 min-w-20 rounded-md px-2 text-white hover:bg-white/10 hover:text-white"
                >
                  <TextAlignIcon value={textFormatting.textAlign} />
                  <span className="text-xs font-medium">
                    {getTextAlignLabel(textFormatting.textAlign)}
                  </span>
                  <ChevronDownIcon className="size-3 text-white/55" />
                </ToolbarButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="ignore-click-outside/toolbar z-1000001 min-w-34 border-white/10 bg-neutral-950 text-white shadow-xl"
                align="start"
                sideOffset={8}
              >
                <DropdownMenuRadioGroup
                  value={textFormatting.textAlign}
                  onValueChange={(val) => {
                    const textAlign = normalizeTextAlign(val);
                    const align = getTextAlignAttributes(textAlign);

                    setTextFormatting((current) => ({
                      ...current,
                      textAlign,
                    }));

                    applyElementAttributes(
                      textElements,
                      {
                        "data-horizontal-align": align.antvAlign,
                        "data-vertical-align": "TOP",
                      },
                      {
                        textAlign: align.cssAlign,
                      },
                    );
                  }}
                >
                  <DropdownMenuRadioItem
                    value="start"
                    className="pl-8 focus:bg-white/10 focus:text-white"
                  >
                    <AlignLeftIcon />
                    Left
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="middle"
                    className="pl-8 focus:bg-white/10 focus:text-white"
                  >
                    <AlignCenterIcon />
                    Center
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem
                    value="end"
                    className="pl-8 focus:bg-white/10 focus:text-white"
                  >
                    <AlignRightIcon />
                    Right
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </ToolbarGroup>
        )}

        {(type === "icon" || type === "mixed") && (
          <ToolbarGroup className="[&_>div]:gap-1 **:data-[orientation='vertical']:bg-white/15">
            <ColorPicker
              value={currentIconFill}
              onChange={(color) => {
                setCurrentIconFill(color);
                applyElementAttributes(
                  iconElements,
                  { fill: color, stroke: color },
                  { color },
                );
              }}
            >
              <ToolbarButton
                tooltip="Icon color"
                className="h-8 min-w-10 rounded-md px-2 text-white hover:bg-white/10 hover:text-white"
              >
                <div
                  className="size-4 rounded-sm border border-white/25 shadow-inner"
                  style={{ backgroundColor: currentIconFill }}
                />
              </ToolbarButton>
            </ColorPicker>

            <ToolbarButton
              tooltip="Change icon"
              onClick={handleChangeIcon}
              className="h-8 rounded-md text-white hover:bg-white/10 hover:text-white"
            >
              <ReplaceIcon />
            </ToolbarButton>
          </ToolbarGroup>
        )}
      </Toolbar>
    </div>
  );

  if (typeof window === "undefined") return null;
  return createPortal(portalContent, portalContainer ?? document.body);
}

function getElementSelectionKey(element: SVGElement): string {
  return (
    element.id ||
    element.getAttribute("data-element-id") ||
    element.getAttribute("data-indexes") ||
    `${element.tagName}:${element.getBoundingClientRect().toJSON?.() ?? ""}`
  );
}

function getCombinedElementRect(elements: SVGElement[]): DOMRect {
  const rects = elements
    .filter((element) => element.isConnected)
    .map((element) => element.getBoundingClientRect());

  if (rects.length === 0) return new DOMRect(0, 0, 0, 0);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const rect of rects) {
    minX = Math.min(minX, rect.left);
    minY = Math.min(minY, rect.top);
    maxX = Math.max(maxX, rect.right);
    maxY = Math.max(maxY, rect.bottom);
  }

  return new DOMRect(minX, minY, maxX - minX, maxY - minY);
}

function getTextFormatting(
  textElements: SVGElement[],
  fallbackFontFamily: string,
): TextFormatting {
  return {
    fontColor: getElementValue(
      textElements,
      "fill",
      "color",
      DEFAULT_TEXT_FILL,
    ),
    fontFamily: formatFontFamily(
      getElementValue(
        textElements,
        "font-family",
        "fontFamily",
        fallbackFontFamily,
      ),
    ),
    fontSize: getElementValue(
      textElements,
      "font-size",
      "fontSize",
      DEFAULT_TEXT_SIZE,
    ).replace("px", ""),
    textAlign: normalizeTextAlign(
      getElementValue(
        textElements,
        "data-horizontal-align",
        "textAlign",
        DEFAULT_TEXT_ALIGN,
      ),
    ),
  };
}

function getElementValue(
  elements: SVGElement[],
  attribute: string,
  styleProperty: keyof CSSStyleDeclaration,
  fallback: string,
): string {
  const [element] = elements;
  if (!element) return fallback;

  const styledElement = findStyledElement(element, styleProperty);
  const styleValue = styledElement?.style[styleProperty];
  if (typeof styleValue === "string" && styleValue) return styleValue;

  return (
    element.getAttribute(attribute) ||
    styledElement?.getAttribute(attribute) ||
    fallback
  );
}

function findStyledElement(
  element: SVGElement,
  styleProperty: keyof CSSStyleDeclaration,
): HTMLElement | SVGElement {
  if (element.style[styleProperty]) return element;

  const descendants = element.querySelectorAll<HTMLElement | SVGElement>("*");
  for (const descendant of descendants) {
    if (descendant.style[styleProperty]) return descendant;
  }

  return element;
}

function getIconFill(elements: SVGElement[]): string {
  const [element] = elements;
  const iconElement = element?.querySelector("use") ?? element;

  return iconElement?.getAttribute("fill") || DEFAULT_TEXT_FILL;
}

function normalizeTextAlign(value: string): TextAlignValue {
  if (value === "middle" || value === "CENTER" || value === "center") {
    return "middle";
  }
  if (value === "end" || value === "RIGHT" || value === "right") {
    return "end";
  }
  return "start";
}

function formatFontFamily(value: string): string {
  const [primaryFamily] = value.split(",");
  return (primaryFamily || DEFAULT_FONT_FAMILY)
    .trim()
    .replace(/^["']|["']$/g, "");
}

function getTextAlignLabel(value: TextAlignValue): string {
  if (value === "middle") return "Center";
  if (value === "end") return "Right";

  return "Left";
}

function getTextAlignAttributes(value: TextAlignValue): {
  antvAlign: "LEFT" | "CENTER" | "RIGHT";
  cssAlign: "left" | "center" | "right";
} {
  if (value === "middle") {
    return { antvAlign: "CENTER", cssAlign: "center" };
  }
  if (value === "end") {
    return { antvAlign: "RIGHT", cssAlign: "right" };
  }

  return { antvAlign: "LEFT", cssAlign: "left" };
}

function TextAlignIcon({ value }: { value: TextAlignValue }) {
  if (value === "middle") return <AlignCenterIcon />;
  if (value === "end") return <AlignRightIcon />;

  return <AlignLeftIcon />;
}
