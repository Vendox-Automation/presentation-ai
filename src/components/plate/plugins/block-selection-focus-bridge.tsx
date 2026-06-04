"use client";

import { BlockSelectionPlugin } from "@platejs/selection/react";
import { useEditorRef, usePluginOption } from "platejs/react";
import * as React from "react";

export function BlockSelectionFocusBridge() {
  const editor = useEditorRef();
  const selectedIds = usePluginOption(BlockSelectionPlugin, "selectedIds");
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    "isSelectionAreaVisible",
  );

  React.useEffect(() => {
    if (!selectedIds || selectedIds.size === 0 || isSelectionAreaVisible) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      editor.getApi(BlockSelectionPlugin).blockSelection.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [editor, isSelectionAreaVisible, selectedIds]);

  return null;
}
