"use client";

import { type Value } from "platejs";
import { type PlateEditor } from "platejs/react";

import { usePlateEditor } from "@/components/plate/hooks/usePlateEditor";
import { normalizePresentationValue } from "../../utils/normalizePresentationSlate";
import { presentationPlugins } from "../plugins";

interface UsePresentationEditorInstanceArgs {
  initialValue: Value | undefined;
  onReady?: (args: { editor: PlateEditor }) => void;
  id?: string;
}

export function usePresentationEditorInstance({
  initialValue,
  onReady,
  id,
}: UsePresentationEditorInstanceArgs) {
  const normalizedInitialValue = normalizePresentationValue(initialValue);

  const editor = usePlateEditor({
    plugins: presentationPlugins,
    value: normalizedInitialValue,
    onReady,
    override: {
      enabled: {
        history: false,
      },
    },
    id,
  });

  return editor as PlateEditor;
}
