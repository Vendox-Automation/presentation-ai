"use client";

import { Infographic } from "@antv/infographic";
import { SlateElement, type SlateElementProps } from "platejs/static";
import { useEffect, useRef, useState } from "react";

import { SparklesCore } from "@/components/ui/sparkles";
import { useAntvInfographicTheme } from "@/hooks/presentation/infographic/useAntvInfographicTheme";
import { cn } from "@/lib/utils";
import { type TAntvInfographicElement } from "../../plugins/antv-infographic-plugin";
import {
  enforceInfographicCardBackground,
  useInfographicCardBackground,
} from "../../utils/infographic-card-background";
import {
  applyInitialInfographicTitleLayout,
  hasInfographicTitleLayoutAttributes,
} from "../../utils/infographic-title-layout";
import { applyThemeToData } from "../../utils/infographic-utils";

const alignmentClasses = {
  center: "mx-auto",
  left: "mr-auto",
  right: "ml-auto",
} as const;

/**
 *
 * Static (read-only) AntV Infographic component for preview/display
 * This component re-renders when element.data changes (unlike the editable version)
 */
export default function AntvInfographicStatic(
  props: SlateElementProps<TAntvInfographicElement>,
) {
  const { element, children } = props;
  const align = element.align ?? "center";

  const containerStyles: React.CSSProperties = {
    width:
      typeof element.width === "string" || typeof element.width === "number"
        ? element.width
        : "100%",
  };

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const infographicRef = useRef<Infographic | null>(null);

  // State
  const [hasError, setHasError] = useState(false);

  // Theme
  const { isDark, themedSyntax, themeColors } = useAntvInfographicTheme(
    element.syntax,
  );
  const cardBackgroundRefreshKey = `${isDark}:${themeColors?.cardBackground ?? ""}`;

  // ============================================================================
  // INFOGRAPHIC INSTANCE LIFECYCLE
  // ============================================================================

  // Create infographic instance once (container is always mounted)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const instance = new Infographic({
      container,
      width: "100%",
      height: "100%",
      editable: false,
    });

    infographicRef.current = instance;

    return () => {
      try {
        instance.destroy();
      } catch {
        // Ignore destruction errors
      }
      infographicRef.current = null;
    };
  }, []);

  // Render content when data/syntax/theme changes
  useEffect(() => {
    const instance = infographicRef.current;
    if (!instance || element.isLoading) {
      return;
    }
    let frameId: number | null = null;

    // Prefer data over syntax
    const savedData = element.data;
    const hasSavedData = Boolean(
      savedData && Object.keys(savedData).length > 0,
    );
    const payload =
      hasSavedData && savedData
        ? applyThemeToData(savedData, isDark, themeColors)
        : themedSyntax;

    if (!payload || (typeof payload === "string" && !payload.trim())) return;

    try {
      instance.render(payload);
      frameId = window.requestAnimationFrame(() => {
        const container = containerRef.current;
        if (container) {
          if (!hasInfographicTitleLayoutAttributes(savedData)) {
            applyInitialInfographicTitleLayout(container, instance);
          }
          enforceInfographicCardBackground(container);
        }
      });
      setHasError(false);
    } catch (err) {
      console.error("Failed to render infographic:", err);
      setHasError(true);
    }

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [themedSyntax, element.isLoading, element.data, isDark, themeColors]);
  useInfographicCardBackground(containerRef, cardBackgroundRefreshKey);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SlateElement {...props}>
      <div
        className={cn(
          "relative my-4 min-h-75 overflow-hidden rounded-lg",
          alignmentClasses[align],
        )}
        style={{
          ...containerStyles,
          backgroundColor: "var(--presentation-background)",
        }}
        data-slate-void="true"
        data-ppt-ignore="true"
        contentEditable={false}
      >
        {/* Container is always mounted so instance can be created */}
        <div
          ref={containerRef}
          className="min-h-75 w-full overflow-hidden"
          style={{
            minHeight: "300px",
            display: element.isLoading || hasError ? "none" : "block",
          }}
        />

        {/* Loading state */}
        {element.isLoading && (
          <div className="relative flex h-75 w-full items-center justify-center">
            <SparklesCore
              background="transparent"
              minSize={1}
              maxSize={2}
              particleDensity={150}
              particleColor={isDark ? "#22d3ee" : "#0ea5e9"}
              className="absolute inset-0"
            />
          </div>
        )}

        {/* Error state */}
        {hasError && !element.isLoading && (
          <div className="flex h-50 w-full flex-col items-center justify-center rounded-lg bg-red-50 text-red-500 dark:bg-red-950">
            <p className="font-medium">Failed to render diagram</p>
            <p className="mt-1 text-sm text-red-400">
              Please try again with different content
            </p>
          </div>
        )}
      </div>
      {children}
    </SlateElement>
  );
}
