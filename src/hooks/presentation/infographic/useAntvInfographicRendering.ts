"use client";

import { type Infographic, type InfographicOptions } from "@antv/infographic";
import {
  useEffect,
  type Dispatch,
  type MutableRefObject,
  type RefObject,
  type SetStateAction,
} from "react";

import { type TAntvInfographicElement } from "@/components/notebook/presentation/editor/plugins/antv-infographic-plugin";
import { enforceInfographicCardBackground } from "@/components/notebook/presentation/editor/utils/infographic-card-background";
import {
  applyInitialInfographicTitleLayout,
  hasInfographicTitleLayoutAttributes,
} from "@/components/notebook/presentation/editor/utils/infographic-title-layout";
import {
  applyColorModeToData,
  applyThemeToData,
  applyThemeToSyntax,
  type InfographicPaletteThemeColors,
} from "@/components/notebook/presentation/editor/utils/infographic-utils";
import { loadInfographicFonts } from "./infographic-font-loader";

type RenderingParams = {
  infographicRef: RefObject<Infographic | null>;
  containerRef: RefObject<HTMLDivElement | null>;
  element: TAntvInfographicElement;
  elementRef: RefObject<TAntvInfographicElement>;
  themedSyntax: string;
  isDark: boolean;
  themeColors?: InfographicPaletteThemeColors | null;
  renderThemeMode?: "presentation" | "app";
  skipNextRenderRef?: MutableRefObject<boolean>;
  syntax: string;
  setHasError: Dispatch<SetStateAction<boolean>>;
};

type RenderPayload = string | Partial<InfographicOptions>;

type RenderWithLayoutParams = {
  containerRef: RefObject<HTMLDivElement | null>;
  infographicRef: RefObject<Infographic | null>;
  instance: Infographic;
  isCancelled: () => boolean;
  shouldApplyInitialTitleLayout: boolean;
  payload: RenderPayload;
};

function refreshInfographicLayout({
  container,
  instance,
  shouldApplyInitialTitleLayout,
}: {
  container: HTMLDivElement | null;
  instance: Infographic;
  shouldApplyInitialTitleLayout: boolean;
}): void {
  if (!container) return;

  if (shouldApplyInitialTitleLayout) {
    applyInitialInfographicTitleLayout(container, instance);
  }
  enforceInfographicCardBackground(container);
}

function renderWithLayoutRefresh({
  containerRef,
  infographicRef,
  instance,
  isCancelled,
  shouldApplyInitialTitleLayout,
  payload,
}: RenderWithLayoutParams): number {
  const shouldRerenderAfterFontsLoad = loadInfographicFonts(payload);

  instance.render(payload);
  const frameId = window.requestAnimationFrame(() => {
    refreshInfographicLayout({
      container: containerRef.current,
      instance,
      shouldApplyInitialTitleLayout,
    });
  });

  if (shouldRerenderAfterFontsLoad) {
    void document.fonts.ready.then(() => {
      if (isCancelled() || infographicRef.current !== instance) return;

      instance.render(payload);
      refreshInfographicLayout({
        container: containerRef.current,
        instance,
        shouldApplyInitialTitleLayout,
      });
    });
  }

  return frameId;
}

function getSavedDataPayload({
  elementRef,
  isDark,
  renderThemeMode,
  themedSyntax,
  themeColors,
}: Pick<
  RenderingParams,
  "elementRef" | "isDark" | "renderThemeMode" | "themedSyntax" | "themeColors"
>): RenderPayload {
  const data = elementRef.current.data;
  if (!data || Object.keys(data).length === 0) return themedSyntax;

  if (renderThemeMode === "presentation") {
    return applyThemeToData(data, isDark, themeColors);
  }

  return applyColorModeToData(data, isDark);
}

export function useAntvInfographicRendering({
  infographicRef,
  containerRef,
  element,
  elementRef,
  themedSyntax,
  isDark,
  themeColors,
  renderThemeMode = "presentation",
  skipNextRenderRef,
  syntax,
  setHasError,
}: RenderingParams) {
  useEffect(() => {
    const instance = infographicRef.current;
    if (!instance || element.isLoading) return;

    if (skipNextRenderRef?.current) {
      skipNextRenderRef.current = false;
      return;
    }

    let cancelled = false;
    let frameId: number | null = null;

    const payload = getSavedDataPayload({
      elementRef,
      isDark,
      renderThemeMode,
      themedSyntax,
      themeColors,
    });
    const shouldApplyInitialTitleLayout = !hasInfographicTitleLayoutAttributes(
      elementRef.current.data,
    );

    if (!payload || (typeof payload === "string" && !payload.trim())) return;

    try {
      frameId = renderWithLayoutRefresh({
        containerRef,
        infographicRef,
        instance,
        isCancelled: () => cancelled,
        shouldApplyInitialTitleLayout,
        payload,
      });
      setHasError(false);
    } catch (err) {
      console.error("Failed to render infographic:", err);
      setHasError(true);
    }

    return () => {
      cancelled = true;
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [
    themedSyntax,
    element.isLoading,
    elementRef,
    infographicRef,
    containerRef,
    setHasError,
    isDark,
    themeColors,
    renderThemeMode,
    skipNextRenderRef,
  ]);

  // This hooks is for streaming rendering
  useEffect(() => {
    const instance = infographicRef.current;
    if (!instance || element.isLoading || element.data || !syntax) return;
    let cancelled = false;
    let frameId: number | null = null;

    try {
      const payload =
        renderThemeMode === "presentation"
          ? applyThemeToSyntax(syntax, isDark, themeColors)
          : themedSyntax;
      frameId = renderWithLayoutRefresh({
        containerRef,
        infographicRef,
        instance,
        isCancelled: () => cancelled,
        shouldApplyInitialTitleLayout: true,
        payload,
      });
    } catch {
      // Ignore parse errors during streaming
    }

    return () => {
      cancelled = true;
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [
    syntax,
    element.isLoading,
    element.data,
    isDark,
    themeColors,
    themedSyntax,
    renderThemeMode,
    infographicRef,
    containerRef,
  ]);
}
