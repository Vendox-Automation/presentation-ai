"use client";

import { BlockSelectionPlugin } from "@platejs/selection/react";
import { TablePlugin } from "@platejs/table/react";
import { type DropdownMenuProps } from "@radix-ui/react-dropdown-menu";
import { KEYS, type NodeEntry, type TElement } from "platejs";
import { useEditorSelector, usePluginOption } from "platejs/react";

import {
  BUTTON_ELEMENT,
  CONTRIBUTOR_ELEMENT,
  getLayoutChangeTargetEntry,
  LABEL_ELEMENT,
  PRESENTATION_TITLE_ELEMENT,
} from "@/components/notebook/presentation/editor/lib";
import { TooltipProvider } from "@/components/ui/tooltip";
// Sub-components
import { AlignmentControl } from "./AlignmentControl";
import { CalloutVariantControl } from "./CalloutVariantControl";
import { ChartControls } from "./ChartControls";
import { ColorControl } from "./ColorControl";
import { ColumnLayoutControls } from "./ColumnLayoutControls";
import { ColumnSizeSlider } from "./ColumnSizeSlider";
import {
  CustomItemControls,
  CustomItemDeleteButton,
} from "./CustomItemControls";
import { DeleteButton } from "./DeleteButton";
import { ElementTypeSelector } from "./ElementTypeSelector";
import { EmbedControls } from "./EmbedControls";
import { IconListMediaSizeSlider } from "./IconListMediaSizeSlider";
import { ImageControls } from "./ImageControls";
import { InfographicControls } from "./InfographicControls";
import { LayoutEditorButton } from "./LayoutPreviewSheet";
import { OrientationControl } from "./OrientationControl";
import { PresentationTableToolbarControls } from "./PresentationTableToolbarControls";
import { SidednessControl } from "./SidednessControl";
import { ToggleControls } from "./ToggleControls";
import { ToolbarProvider, useToolbarContext } from "./ToolbarContext";
import { VariantControl } from "./VariantControl";

const COMPACT_STANDALONE_ELEMENT_TYPES = new Set<string>([
  BUTTON_ELEMENT,
  CONTRIBUTOR_ELEMENT,
  KEYS.callout,
  LABEL_ELEMENT,
  PRESENTATION_TITLE_ELEMENT,
]);

function ToolbarContent() {
  const {
    editor,
    element,
    elementId,
    handleLayoutChange,
    isImageElement,
    isInfographicElement,
    isLayoutChildElement,
    isMediaEmbedElement,
    isCurrentElementChart,
  } = useToolbarContext();
  const isCompactStandaloneElement =
    typeof element?.type === "string" &&
    COMPACT_STANDALONE_ELEMENT_TYPES.has(element.type);
  const selectedCells = usePluginOption(TablePlugin, "selectedCells");
  const selectedIds = usePluginOption(BlockSelectionPlugin, "selectedIds");
  const isSelectionInTable = useEditorSelector(
    (currentEditor) => currentEditor.api.some({ match: { type: KEYS.table } }),
    [],
  );
  const hasSelectedTableOrRow = Array.from(selectedIds ?? []).some(
    (blockId) => {
      const entry = editor.api.node({
        at: [],
        id: String(blockId),
      }) as NodeEntry<TElement> | undefined;
      const [selectedElement] = entry ?? [];

      return (
        selectedElement?.type === KEYS.table ||
        selectedElement?.type === KEYS.tr
      );
    },
  );
  const isTableSelectionActive =
    element?.type === KEYS.table ||
    hasSelectedTableOrRow ||
    isSelectionInTable ||
    (selectedCells?.length ?? 0) > 0;
  const layoutTargetEntry = getLayoutChangeTargetEntry(editor, elementId);
  const [layoutTargetElement] = layoutTargetEntry ?? [];
  const layoutTargetElementId =
    typeof layoutTargetElement?.id === "string"
      ? layoutTargetElement.id
      : elementId;

  if (isTableSelectionActive) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <PresentationTableToolbarControls />
        </div>
      </TooltipProvider>
    );
  }

  // For image elements, only show ImageControls
  if (isImageElement) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <ImageControls />
        </div>
      </TooltipProvider>
    );
  }

  // For infographic elements, only show InfographicControls
  if (isInfographicElement) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <InfographicControls />
          <DeleteButton />
        </div>
      </TooltipProvider>
    );
  }

  if (isMediaEmbedElement) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <EmbedControls />
          <AlignmentControl />
        </div>
      </TooltipProvider>
    );
  }

  if (isCompactStandaloneElement) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          {element?.type === KEYS.callout ? (
            <CalloutVariantControl />
          ) : (
            <VariantControl />
          )}
          <ColorControl />
          <AlignmentControl />
          <DeleteButton />
        </div>
      </TooltipProvider>
    );
  }

  if (isLayoutChildElement) {
    return (
      <TooltipProvider>
        <div className="flex items-center gap-1">
          <CustomItemControls />
          <ColorControl />
          <AlignmentControl />
          <CustomItemDeleteButton />
        </div>
      </TooltipProvider>
    );
  }

  // For other elements, show the full toolbar
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <ElementTypeSelector />
        {!isCurrentElementChart && (
          <LayoutEditorButton
            editorId={editor.id}
            elementId={layoutTargetElementId}
            element={
              (layoutTargetElement as Record<string, unknown> | undefined) ??
              element
            }
            onApplyLayout={handleLayoutChange}
          />
        )}
        <OrientationControl />
        <SidednessControl />
        <VariantControl />
        <ToggleControls />
        <ColumnLayoutControls />
        <ColumnSizeSlider />
        <IconListMediaSizeSlider />
        <ChartControls />
        <ColorControl />
        <AlignmentControl />
        <DeleteButton />
      </div>
    </TooltipProvider>
  );
}

export function LayoutFloatingToolbarButtons(_props: DropdownMenuProps) {
  return (
    <ToolbarProvider>
      <ToolbarContent />
    </ToolbarProvider>
  );
}
