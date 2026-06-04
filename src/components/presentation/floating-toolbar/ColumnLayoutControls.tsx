"use client";

import { setColumns } from "@platejs/layout";
import {
  Columns2,
  Columns3,
  PanelLeft,
  PanelRight,
  SquareSplitVertical,
} from "lucide-react";
import { type TElement } from "platejs";

import { COLUMN_GROUP } from "@/components/notebook/presentation/editor/lib";
import { ToolbarButton, ToolbarGroup } from "@/components/plate/ui/toolbar";
import { useToolbarContext } from "./ToolbarContext";

const COLUMN_LAYOUT_PRESETS = [
  {
    icon: Columns2,
    tooltip: "Equal columns",
    widths: ["50%", "50%"],
  },
  {
    icon: Columns3,
    tooltip: "Three equal columns",
    widths: ["33.33%", "33.33%", "33.34%"],
  },
  {
    icon: PanelRight,
    tooltip: "Wide left column",
    widths: ["70%", "30%"],
  },
  {
    icon: PanelLeft,
    tooltip: "Wide right column",
    widths: ["30%", "70%"],
  },
  {
    icon: SquareSplitVertical,
    tooltip: "Wide center column",
    widths: ["25%", "50%", "25%"],
  },
] as const;

export function ColumnLayoutControls() {
  const { editor, element, elementType } = useToolbarContext();

  if (elementType !== COLUMN_GROUP || !element) {
    return null;
  }

  return (
    <ToolbarGroup>
      {COLUMN_LAYOUT_PRESETS.map(({ icon: Icon, tooltip, widths }) => (
        <ToolbarButton
          key={tooltip}
          onClick={() => {
            const elementPath = editor.api.findPath(element as TElement);
            if (!elementPath) return;

            setColumns(editor, {
              at: elementPath,
              widths: [...widths],
            });
          }}
          tooltip={tooltip}
        >
          <Icon className="size-4" />
        </ToolbarButton>
      ))}
    </ToolbarGroup>
  );
}
