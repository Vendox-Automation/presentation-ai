"use client";

import { flip, offset, type FloatingToolbarState } from "@platejs/floating";
import { BlockSelectionPlugin } from "@platejs/selection/react";
import { TablePlugin } from "@platejs/table/react";
import { KEYS } from "platejs";
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
import { cn } from "@/lib/utils";
import { type MyEditor } from "../editor-kit";
import {
  useFloatingToolbar,
  useFloatingToolbarState,
} from "../hooks/use-floating-toolbar";
import { Toolbar } from "./toolbar";

export function FloatingToolbar({
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
  const isFloatingLinkOpen = !!usePluginOption({ key: KEYS.link }, "mode");
  const isAIChatOpen = usePluginOption({ key: KEYS.aiChat }, "open");
  const selectedCells = usePluginOption(TablePlugin, "selectedCells");
  const hasSelectedTableCells = (selectedCells?.length ?? 0) > 0;
  const isSelectionInTable = useEditorSelector(
    (currentEditor) => currentEditor.api.some({ match: { type: KEYS.table } }),
    [],
  );

  // Check if any blocks are selected
  const selectedIds = usePluginOption(BlockSelectionPlugin, "selectedIds");
  const hasBlockSelection = selectedIds && selectedIds.size > 0;

  // Presentation layout blocks have their own toolbar. Native Plate blocks
  // should still use the basic floating toolbar on block selection.
  const isLayoutBlockSelected = React.useMemo(() => {
    if (!hasBlockSelection || !selectedIds) return false;

    for (const blockId of selectedIds) {
      if (getDirectLayoutToolbarTargetEntry(editor, String(blockId))) {
        return true;
      }
    }

    return false;
  }, [hasBlockSelection, selectedIds, editor]);
  const isTableSelectionActive = isSelectionInTable || hasSelectedTableCells;

  const floatingToolbarState = useFloatingToolbarState({
    editorId,
    focusedEditorId,
    hideToolbar:
      isLayoutBlockSelected ||
      isTableSelectionActive ||
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

  const {
    clickOutsideRef,
    hidden,
    props: rootProps,
    ref: floatingRef,
  } = useFloatingToolbar(floatingToolbarState);

  const ref = useComposedRef<HTMLDivElement>(props.ref, floatingRef);

  if (hidden) return null;

  return (
    <div ref={clickOutsideRef}>
      <Toolbar
        {...props}
        {...rootProps}
        ref={ref}
        className={cn(
          "z-999999 scrollbar-hide overflow-x-auto rounded-md border bg-popover p-1 whitespace-nowrap opacity-100 shadow-md print:hidden",
          "max-w-[80vw]",
          className,
        )}
      >
        {children}
      </Toolbar>
    </div>
  );
}
