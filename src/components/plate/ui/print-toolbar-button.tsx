"use client";

import { PrinterIcon } from "lucide-react";
import { useEditorRef } from "platejs/react";

import { printEditorElement } from "@/lib/print-editor";
import { ToolbarButton } from "./toolbar";

export function PrintToolbarButton() {
  const editor = useEditorRef();

  return (
    <ToolbarButton
      tooltip="Print"
      onClick={() => {
        const editorNode = editor.api.toDOMNode(editor);
        const printTarget =
          editorNode?.closest<HTMLElement>(
            "[data-print-editor-surface='true']",
          ) ?? editorNode;

        if (!printTarget) {
          return;
        }

        printEditorElement(printTarget);
      }}
    >
      <PrinterIcon className="size-4" />
    </ToolbarButton>
  );
}
