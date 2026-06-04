"use client";

import { Trash2 } from "lucide-react";

import { ToolbarButton } from "@/components/plate/ui/toolbar";
import { useToolbarContext } from "./ToolbarContext";

export function DeleteButton() {
  const { editor } = useToolbarContext();

  return (
    <ToolbarButton
      onClick={() => editor.tf.blockSelection.removeNodes()}
      tooltip="Delete Element"
      size="sm"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="size-4" />
    </ToolbarButton>
  );
}
