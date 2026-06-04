"use client";

import { ResizableProvider, ResizeHandle } from "@platejs/resizable";
import { BlockSelectionPlugin } from "@platejs/selection/react";
import {
  PlateElement,
  useReadOnly,
  withHOC,
  type PlateElementProps,
} from "platejs/react";
import { memo, useCallback, useRef, useState, type MouseEvent } from "react";

import { InfographicFloatingToolbar } from "@/components/notebook/presentation/editor/custom-elements/infographic/InfographicFloatingToolbar";
import {
  mediaResizeHandleVariants,
  Resizable,
} from "@/components/plate/ui/resize-handle";
import { SparklesCore } from "@/components/ui/sparkles";
import { type InfographicSelectionPayload } from "@/hooks/presentation/infographic/InfographicSelectionPlugin";
import { useAntvInfographicActions } from "@/hooks/presentation/infographic/useAntvInfographicActions";
import { useAntvInfographicGeneration } from "@/hooks/presentation/infographic/useAntvInfographicGeneration";
import { useAntvInfographicInstance } from "@/hooks/presentation/infographic/useAntvInfographicInstance";
import { useAntvInfographicMutationSync } from "@/hooks/presentation/infographic/useAntvInfographicMutationSync";
import { useAntvInfographicRendering } from "@/hooks/presentation/infographic/useAntvInfographicRendering";
import { useAntvInfographicTheme } from "@/hooks/presentation/infographic/useAntvInfographicTheme";
import { useSyncedAntvElementRef } from "@/hooks/presentation/infographic/useSyncedAntvElementRef";
import { cn } from "@/lib/utils";
import { type TAntvInfographicElement } from "../plugins/antv-infographic-plugin";
import { useInfographicCardBackground } from "../utils/infographic-card-background";
import { EventBoundary } from "./event-boundary";

/**
 * Editable AntV Infographic component for the Plate editor
 */
const AntvInfographicBase = memo(function AntvInfographic(
  props: PlateElementProps<TAntvInfographicElement>,
) {
  const { element, editor } = props;
  const readOnly = useReadOnly();
  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextRenderRef = useRef(false);
  const [hasError, setHasError] = useState(false);
  const [selectionPayload, setSelectionPayload] =
    useState<InfographicSelectionPayload | null>(null);
  const elementRef = useSyncedAntvElementRef(element);
  const infographicRef = useAntvInfographicInstance({
    containerRef,
    editable: !readOnly,
    onSelectionChange: setSelectionPayload,
  });
  const { isDark, themedSyntax, themeColors } = useAntvInfographicTheme(
    element.syntax,
  );
  const cardBackgroundRefreshKey = `${isDark}:${themeColors?.cardBackground ?? ""}`;
  const align = element.align ?? "center";

  const { syntax } = useAntvInfographicGeneration({
    editor,
    element,
    setHasError,
    canResumeLoadingGeneration: true,
  });

  useAntvInfographicRendering({
    infographicRef,
    containerRef,
    element,
    elementRef,
    themedSyntax,
    isDark,
    themeColors,
    syntax,
    skipNextRenderRef,
    setHasError,
  });
  useInfographicCardBackground(containerRef, cardBackgroundRefreshKey);

  useAntvInfographicMutationSync({
    infographicRef,
    editor,
    elementRef,
    skipNextRenderRef,
    syntax: element.syntax,
  });

  const { handleDelete } = useAntvInfographicActions({ editor, elementRef });

  const selectInfographicBlock = useCallback(() => {
    const elementId = element.id;
    if (typeof elementId !== "string" || !elementId) return;

    editor.getApi(BlockSelectionPlugin).blockSelection.set([elementId]);
    editor.getApi(BlockSelectionPlugin).blockSelection.focus();
  }, [editor, element.id]);

  const shouldSkipBlockSelect = (target: EventTarget | null) => {
    const targetElement =
      target instanceof Element
        ? target
        : target instanceof Node
          ? target.parentElement
          : null;
    if (!targetElement) return false;

    return Boolean(
      targetElement.closest(
        [
          "[data-infographic-canvas]",
          "button",
          "input",
          "textarea",
          "select",
          "[contenteditable='true']",
        ].join(", "),
      ),
    );
  };

  const handleMouseDownCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (shouldSkipBlockSelect(event.target)) return;

    selectInfographicBlock();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PlateElement
      {...props}
      className="slate-editable-void slate-selectable relative my-4 w-full"
    >
      <EventBoundary
        style={{ backgroundColor: "var(--presentation-background)" }}
        data-slate-void="true"
        // data-ppt-ignore="true"
        contentEditable={false}
        onMouseDownCapture={handleMouseDownCapture}
      >
        <Resizable
          align={align}
          options={{
            align,
            readOnly,
          }}
          className={cn("flex", !element.width && "w-full")}
        >
          <ResizeHandle
            className={mediaResizeHandleVariants({ direction: "left" })}
            options={{ direction: "left" }}
            data-infographic-resize-handle="true"
          />

          <div className="relative min-h-75 w-full overflow-hidden rounded-lg">
            {hasError ? (
              <div className="flex h-50 w-full flex-col items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-950">
                <p className="font-medium">Failed to generate diagram</p>
                <p className="mt-1 text-sm text-red-400">
                  Please try again with different text
                </p>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                {/* Container is always mounted for stable instance */}
                <div
                  ref={containerRef}
                  data-infographic-canvas="true"
                  className="min-h-75 w-full overflow-hidden"
                  style={{
                    minHeight: "300px",
                    opacity: element.isLoading ? 0.35 : 1,
                  }}
                />

                {element.isLoading && (
                  <SparklesCore
                    background="transparent"
                    minSize={1}
                    maxSize={2}
                    particleDensity={150}
                    particleColor={isDark ? "#22d3ee" : "#0ea5e9"}
                    className="pointer-events-none absolute inset-0 z-10"
                  />
                )}
                {selectionPayload && !readOnly && (
                  <InfographicFloatingToolbar payload={selectionPayload} />
                )}
              </>
            )}
          </div>

          <ResizeHandle
            className={mediaResizeHandleVariants({ direction: "right" })}
            options={{ direction: "right" }}
            data-infographic-resize-handle="true"
          />
        </Resizable>
      </EventBoundary>

      {props.children}
    </PlateElement>
  );
}, areEqualInfographicProps);

export const AntvInfographic = withHOC(ResizableProvider, AntvInfographicBase);

/**
 * Custom equality check - ignores data changes to prevent re-renders while editing
 */
function areEqualInfographicProps(
  prev: PlateElementProps<TAntvInfographicElement>,
  next: PlateElementProps<TAntvInfographicElement>,
): boolean {
  if (prev.editor !== next.editor) return false;
  if (prev.attributes !== next.attributes) return false;

  return (
    prev.element.id === next.element.id &&
    prev.element.syntax === next.element.syntax &&
    prev.element.isLoading === next.element.isLoading &&
    prev.element.sourceText === next.element.sourceText &&
    prev.element.generationPrompt === next.element.generationPrompt &&
    prev.element.slideLayoutType === next.element.slideLayoutType &&
    prev.element.align === next.element.align &&
    prev.element.width === next.element.width &&
    prev.element.data === next.element.data
  );
}
