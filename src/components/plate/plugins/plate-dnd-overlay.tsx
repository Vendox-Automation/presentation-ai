"use client";

import { DndPlugin, DndScroller } from "@platejs/dnd";
import { useEditorRef, usePluginOption } from "platejs/react";
import { useEffect, useRef, type ReactNode } from "react";

const SCROLL_CLASS_NAMES = [
  "overflow-auto",
  "overflow-scroll",
  "overflow-y-auto",
  "overflow-y-scroll",
] as const;

const SCROLL_OVERFLOW_VALUES = new Set(["auto", "overlay", "scroll"]);

function hasScrollableClassName(element: HTMLElement): boolean {
  const className =
    typeof element.className === "string"
      ? element.className
      : (element.getAttribute("class") ?? "");

  return SCROLL_CLASS_NAMES.some((name) => className.includes(name));
}

function isScrollableAncestor(element: HTMLElement): boolean {
  const styles = window.getComputedStyle(element);
  const overflowY = styles.overflowY.toLowerCase();
  const overflow = styles.overflow.toLowerCase();
  const allowsScroll =
    hasScrollableClassName(element) ||
    SCROLL_OVERFLOW_VALUES.has(overflowY) ||
    SCROLL_OVERFLOW_VALUES.has(overflow);

  return allowsScroll && element.scrollHeight > element.clientHeight + 1;
}

function findScrollableAncestor(
  startElement: HTMLElement | null,
): HTMLElement | null {
  let current = startElement;

  while (current) {
    if (
      current !== document.body &&
      current !== document.documentElement &&
      isScrollableAncestor(current)
    ) {
      return current;
    }

    current = current.parentElement;
  }

  const rootScroller = document.scrollingElement;

  return rootScroller instanceof HTMLElement ? rootScroller : null;
}

export function PlateDndOverlay({ children }: { children: ReactNode }) {
  const editor = useEditorRef();
  const isDragging = Boolean(usePluginOption(DndPlugin, "isDragging"));
  const containerRef = useRef<HTMLElement | null>(null);
  const editorElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isDragging) {
      return;
    }

    try {
      const editorElement = editor.api.toDOMNode(editor);

      if (!(editorElement instanceof HTMLElement)) {
        containerRef.current = null;
        editorElementRef.current = null;
        return;
      }

      if (
        editorElementRef.current === editorElement &&
        containerRef.current?.isConnected
      ) {
        return;
      }

      if (
        containerRef.current?.isConnected &&
        containerRef.current.contains(editorElement)
      ) {
        editorElementRef.current = editorElement;
        return;
      }

      containerRef.current = findScrollableAncestor(editorElement);
      editorElementRef.current = editorElement;
    } catch {
      containerRef.current = null;
      editorElementRef.current = null;
    }
  }, [editor, isDragging]);

  return (
    <>
      {children}
      <DndScroller
        containerRef={containerRef}
        height={32}
        minStrength={0.05}
        strengthMultiplier={16}
      />
    </>
  );
}
