"use client";

import { type PlateEditor } from "platejs/react";
import { useCallback, type MutableRefObject } from "react";

import { type TAntvInfographicElement } from "@/components/notebook/presentation/editor/plugins/antv-infographic-plugin";
import { findInfographicEntryById } from "@/hooks/presentation/infographic/findInfographicNode";

type ActionParams = {
  editor: PlateEditor;
  elementRef: MutableRefObject<TAntvInfographicElement>;
};

export function useAntvInfographicActions({
  editor,
  elementRef,
}: ActionParams) {
  const handleDelete = useCallback(() => {
    const elementId =
      typeof elementRef.current.id === "string" ? elementRef.current.id : "";
    const path = findInfographicEntryById(editor, elementId)?.[1];
    if (path) {
      editor.tf.removeNodes({ at: path });
    }
  }, [editor, elementRef]);

  return { handleDelete };
}
