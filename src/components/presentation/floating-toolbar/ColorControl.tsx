"use client";

import { Baseline, PaintBucket, RotateCcw } from "lucide-react";
import { KEYS } from "platejs";

import {
  BUTTON_ELEMENT,
  CONTRIBUTOR_ELEMENT,
  LABEL_ELEMENT,
  PRESENTATION_TITLE_ELEMENT,
} from "@/components/notebook/presentation/editor/lib";
import { ToolbarButton, ToolbarGroup } from "@/components/plate/ui/toolbar";
import ColorPicker from "@/components/ui/color-picker";
import { useToolbarContext } from "./ToolbarContext";

const BACKGROUND_COLOR_ELEMENT_TYPES = new Set<string>([
  BUTTON_ELEMENT,
  CONTRIBUTOR_ELEMENT,
  KEYS.callout,
  LABEL_ELEMENT,
  PRESENTATION_TITLE_ELEMENT,
]);
const DEFAULT_PICKER_COLOR = "#3b82f6";

function isHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

export function ColorControl() {
  const {
    element,
    elementType,
    currentBackgroundColor,
    currentColor,
    currentTextColor,
    handleNodePropertyUpdate,
  } = useToolbarContext();
  const shouldShowBackgroundColor =
    BACKGROUND_COLOR_ELEMENT_TYPES.has(elementType);
  const hasCustomBackgroundColor =
    (element as { backgroundColor?: string })?.backgroundColor !== undefined;
  const hasCustomTextColor =
    (element as { textColor?: string })?.textColor !== undefined;
  const hasCustomColor = (element as { color?: string })?.color !== undefined;
  const colorProperty = shouldShowBackgroundColor ? "textColor" : "color";
  const colorValue = shouldShowBackgroundColor
    ? currentTextColor
    : currentColor;
  const pickerColor = isHexColor(colorValue)
    ? colorValue
    : DEFAULT_PICKER_COLOR;
  const hasCustomEditableColor = shouldShowBackgroundColor
    ? hasCustomTextColor || hasCustomColor
    : hasCustomColor;

  return (
    <ToolbarGroup>
      {shouldShowBackgroundColor && (
        <ColorPicker
          value={currentBackgroundColor}
          onChange={(color) => {
            handleNodePropertyUpdate("backgroundColor", color);
          }}
        >
          <ToolbarButton tooltip="Choose Background Color" size="sm">
            <PaintBucket className="size-4" />
          </ToolbarButton>
        </ColorPicker>
      )}

      {shouldShowBackgroundColor && hasCustomBackgroundColor && (
        <ToolbarButton
          onClick={() => {
            handleNodePropertyUpdate("backgroundColor", undefined);
          }}
          tooltip="Reset Background Color"
          size="sm"
          className="gap-1"
        >
          <RotateCcw className="size-4" />
        </ToolbarButton>
      )}

      <ColorPicker
        value={pickerColor}
        onChange={(color) => {
          handleNodePropertyUpdate(colorProperty, color);
        }}
      >
        <ToolbarButton tooltip="Choose Color" size="sm">
          {shouldShowBackgroundColor ? (
            <Baseline className="size-4" />
          ) : (
            <span
              className="size-4 rounded-[3px] border border-border shadow-inner"
              style={{ backgroundColor: colorValue }}
            />
          )}
        </ToolbarButton>
      </ColorPicker>

      {hasCustomEditableColor && (
        <ToolbarButton
          onClick={() => {
            handleNodePropertyUpdate(colorProperty, undefined);
            if (shouldShowBackgroundColor) {
              handleNodePropertyUpdate("color", undefined);
            }
          }}
          tooltip="Reset Color"
          size="sm"
          className="gap-1"
        >
          <RotateCcw className="size-4" />
        </ToolbarButton>
      )}
    </ToolbarGroup>
  );
}
