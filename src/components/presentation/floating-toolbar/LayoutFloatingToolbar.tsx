"use client";

import { flip, offset, type FloatingToolbarState } from "@platejs/floating";
import { BlockSelectionPlugin } from "@platejs/selection/react";
import { TablePlugin } from "@platejs/table/react";
import { ElementApi, KEYS, type NodeEntry, type TElement } from "platejs";
import {
  useComposedRef,
  useEditorId,
  useEditorRef,
  useEditorSelector,
  useEventEditorValue,
  usePluginOption,
} from "platejs/react";
import * as React from "react";

import { getDirectLayoutToolbarTargetEntry } from "@/components/notebook/presentation/editor/lib";
import { type MyEditor } from "@/components/plate/editor-kit";
import {
  useFloatingToolbar,
  useFloatingToolbarState,
} from "@/components/plate/hooks/use-floating-toolbar";
import { Toolbar } from "@/components/plate/ui/toolbar";
import { cn } from "@/lib/utils";
import { FLOATING_TOOLBAR_IGNORE_CLASS } from "./toolbar-interaction";

export function LayoutFloatingToolbar({
  children,
  className,
  state,
  ...props
}: React.ComponentProps<typeof Toolbar> & {
  state?: FloatingToolbarState;
}) {
  const editorId = useEditorId();
  const editor = useEditorRef<MyEditor>();
  const focusedEditorId = useEventEditorValue("focus");

  // Check if floating UI elements are open
  const isFloatingLinkOpen = !!usePluginOption({ key: KEYS.link }, "mode");
  const isAIChatOpen = usePluginOption({ key: KEYS.aiChat }, "open");

  // Get current selection
  const selectedIds = usePluginOption(BlockSelectionPlugin, "selectedIds");
  const hasBlockSelection = selectedIds && selectedIds.size > 0;
  const selectedCells = usePluginOption(TablePlugin, "selectedCells");
  const hasSelectedTableCells = (selectedCells?.length ?? 0) > 0;
  const isSelectionInTable = useEditorSelector(
    (currentEditor) => currentEditor.api.some({ match: { type: KEYS.table } }),
    [],
  );
  const selectedTableOrRowEntry = React.useMemo(() => {
    if (!selectedIds) return undefined;

    for (const blockId of selectedIds) {
      const entry = editor.api.node({
        at: [],
        id: String(blockId),
      }) as NodeEntry<TElement> | undefined;
      const [element] = entry ?? [];

      if (element?.type === KEYS.table || element?.type === KEYS.tr) {
        return entry;
      }
    }

    return undefined;
  }, [editor, selectedIds]);

  // Check if selected blocks are presentation blocks with dedicated controls.
  const isLayoutBlockSelected = React.useMemo(() => {
    if (!hasBlockSelection || !selectedIds) return false;

    for (const blockId of selectedIds) {
      if (getDirectLayoutToolbarTargetEntry(editor, String(blockId))) {
        return true;
      }
    }

    return false;
  }, [hasBlockSelection, selectedIds, editor]);
  const isTableSelectionActive =
    isSelectionInTable ||
    hasSelectedTableCells ||
    Boolean(selectedTableOrRowEntry);

  const getTableSelectionRect = React.useCallback(() => {
    const [selectedElement, selectedPath] = selectedTableOrRowEntry ?? [];

    if (selectedElement?.type === KEYS.table) {
      const domElement = editor.api.toDOMNode(selectedElement);
      return domElement?.getBoundingClientRect() ?? null;
    }

    if (selectedElement?.type === KEYS.tr && selectedPath) {
      const tablePath = selectedPath.slice(0, -1);
      const tableElement = editor.api.node({ at: tablePath })?.[0];

      if (tableElement && ElementApi.isElement(tableElement)) {
        const domElement = editor.api.toDOMNode(tableElement);
        return domElement?.getBoundingClientRect() ?? null;
      }
    }

    const tableEntry = editor.api.above({
      match: { type: KEYS.table },
    }) as NodeEntry<TElement> | undefined;
    const [tableElement] = tableEntry ?? [];

    if (!tableElement) return null;

    const domElement = editor.api.toDOMNode(tableElement);
    return domElement?.getBoundingClientRect() ?? null;
  }, [editor, selectedTableOrRowEntry]);

  // Configure floating toolbar state
  const floatingToolbarState = useFloatingToolbarState({
    customSelection: {
      active: isTableSelectionActive,
      getBoundingClientRect: getTableSelectionRect,
      updateKey: selectedCells ?? selectedTableOrRowEntry?.[1],
    },
    editorId,
    focusedEditorId,
    hideToolbar:
      (!isLayoutBlockSelected && !isTableSelectionActive) ||
      isFloatingLinkOpen ||
      isAIChatOpen,
    enableBlockSelection: true,
    ...state,
    floatingOptions: {
      middleware: [
        offset(12),
        flip({
          fallbackPlacements: [
            "top-start",
            "top-end",
            "bottom-start",
            "bottom-end",
          ],
          padding: 12,
        }),
      ],
      placement: "top",
      strategy: "fixed",
      ...state?.floatingOptions,
    },
  });

  // Get floating toolbar props
  const {
    clickOutsideRef,
    hidden,
    props: rootProps,
    ref: floatingRef,
  } = useFloatingToolbar(floatingToolbarState);

  const ref = useComposedRef<HTMLDivElement>(props.ref, floatingRef);

  // Keep the wrapper mounted only while this toolbar owns the active selection.
  if (hidden && !isLayoutBlockSelected && !isTableSelectionActive) return null;

  const toolbar = (
    <div
      ref={clickOutsideRef}
      className={FLOATING_TOOLBAR_IGNORE_CLASS}
      onMouseDown={(e) => {
        // Prevent the browser from moving focus away from the editor when
        // clicking any button inside the toolbar. Without this, the editor
        // detects a focus loss, deselects the block selection, and the
        // toolbar closes unexpectedly.
        e.preventDefault();
      }}
    >
      <Toolbar
        {...props}
        {...rootProps}
        ref={ref}
        className={cn(
          FLOATING_TOOLBAR_IGNORE_CLASS,
          "z-999999 scrollbar-hide overflow-x-auto rounded-md border bg-popover p-1 whitespace-nowrap opacity-100 shadow-md print:hidden",
          "max-w-[80vw]",
          className,
        )}
      >
        {children}
      </Toolbar>
    </div>
  );

  return toolbar;
}
