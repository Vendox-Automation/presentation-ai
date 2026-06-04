"use client";

import {
  BrushSelect,
  ClickSelect,
  DblClickEditText,
  DragCanvas,
  DragElement,
  HotkeyHistory,
  Infographic,
  ResetViewBox,
  ResizeElement,
  SelectHighlight,
  ZoomWheel,
  type IInteraction,
  type IPlugin,
} from "@antv/infographic";
import { useEffect, useRef, type RefObject } from "react";

import { registerLucideIconLoader } from "./infographic-icon-loader";
import {
  InfographicSelectionPlugin,
  type InfographicSelectionPayload,
} from "./InfographicSelectionPlugin";

registerLucideIconLoader();

type InfographicEditorInstance = {
  editor?: {
    interaction?: {
      clearSelection?: () => void;
    };
  };
};

type InfographicInstanceParams = {
  containerRef: RefObject<HTMLDivElement | null>;
  editable?: boolean;
  onSelectionChange?: (payload: InfographicSelectionPayload) => void;
};

const INLINE_TEXT_EDITOR_CLASS = "infographic-inline-text-editor";
const INLINE_TEXT_SHORTCUT_KEYS = new Set(["a", "c", "v", "x"]);

const isNativeInlineTextShortcut = (event: KeyboardEvent) =>
  (event.ctrlKey || event.metaKey) &&
  !event.altKey &&
  !event.shiftKey &&
  INLINE_TEXT_SHORTCUT_KEYS.has(event.key.toLowerCase());

const getEventElement = (target: EventTarget | null) => {
  if (target instanceof Element) return target;
  if (target instanceof Node) return target.parentElement;
  return null;
};

const getInfographicInlineTextEditor = (
  target: EventTarget | null,
  container: HTMLElement,
) => {
  const element = getEventElement(target);
  const inlineTextEditor = element?.closest<HTMLElement>(
    `.${INLINE_TEXT_EDITOR_CLASS}`,
  );
  if (!inlineTextEditor) return null;
  if (!inlineTextEditor.isContentEditable) return null;
  if (!container.contains(inlineTextEditor)) return null;

  return inlineTextEditor;
};

export function useAntvInfographicInstance({
  containerRef,
  editable = true,
  onSelectionChange,
}: InfographicInstanceParams) {
  const infographicRef = useRef<Infographic | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const plugins: IPlugin[] = editable
      ? [new ResizeElement(), new ResetViewBox()]
      : [];

    if (editable && onSelectionChange) {
      plugins.unshift(new InfographicSelectionPlugin(onSelectionChange));
    }

    const instance = new Infographic({
      container,
      width: "100%",
      height: "100%",
      editable,
      plugins,
      interactions: editable
        ? ([
            new DragCanvas({ trigger: ["Space"] }),
            new DblClickEditText(),
            new BrushSelect(),
            new ClickSelect(),
            new DragElement(),
            new HotkeyHistory(),
            new ZoomWheel(),
            new SelectHighlight(),
          ] satisfies IInteraction[])
        : [],
    });

    infographicRef.current = instance;

    const getSvg = () => container.querySelector("svg");

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const svg = getSvg();
      if (!svg) return;

      const inInfographicContainer = container.contains(target);
      const inToolbarOrPanel =
        target instanceof Element &&
        (!!target.closest(".antv-infographic-toolbar-floating") ||
          !!target.closest(".antv-infographic-template-panel") ||
          !!target.closest(".icon-picker-panel") ||
          !!target.closest(".presentation-right-panel") ||
          // Radix UI portals for dropdowns, popovers, color pickers
          !!target.closest("[data-radix-popper-content-wrapper]") ||
          !!target.closest("[role='dialog']") ||
          !!target.closest("[data-slot='tooltip-content']"));

      if (!inInfographicContainer && !inToolbarOrPanel) {
        (
          instance as unknown as InfographicEditorInstance
        ).editor?.interaction?.clearSelection?.();
      }
    };

    // Use bubble phase so toolbar's stopPropagation can prevent this
    document.addEventListener("click", handleDocumentClick);

    const handleInlineTextEditorShortcut = (event: KeyboardEvent) => {
      if (!isNativeInlineTextShortcut(event)) return;

      const inlineTextEditor = getInfographicInlineTextEditor(
        event.target,
        container,
      );
      if (!inlineTextEditor) return;

      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    const handleInlineTextEditorClipboard = (event: ClipboardEvent) => {
      const inlineTextEditor = getInfographicInlineTextEditor(
        event.target,
        container,
      );
      if (!inlineTextEditor) return;

      event.stopPropagation();
      event.stopImmediatePropagation();
    };

    container.addEventListener("keydown", handleInlineTextEditorShortcut);
    container.addEventListener("copy", handleInlineTextEditorClipboard);
    container.addEventListener("cut", handleInlineTextEditorClipboard);
    container.addEventListener("paste", handleInlineTextEditorClipboard);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      container.removeEventListener("keydown", handleInlineTextEditorShortcut);
      container.removeEventListener("copy", handleInlineTextEditorClipboard);
      container.removeEventListener("cut", handleInlineTextEditorClipboard);
      container.removeEventListener("paste", handleInlineTextEditorClipboard);

      try {
        instance.destroy();
      } catch {
        // Ignore destruction errors
      }
      infographicRef.current = null;
    };
  }, [containerRef, onSelectionChange, editable]);

  return infographicRef;
}
