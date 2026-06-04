"use client";

import { MessageSquareWarning } from "lucide-react";
import { type TElement } from "platejs";
import * as React from "react";

import { PALETTE_DROP_MUTABLE_KEY } from "@/components/notebook/presentation/editor/utils/paletteDrop";
import {
  CALLOUT_VARIANTS,
  type CalloutVariant,
} from "@/components/plate/ui/callout-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/plate/ui/dropdown-menu";
import {
  ToolbarButton,
  ToolbarGroup,
  ToolbarMenuGroup,
} from "@/components/plate/ui/toolbar";
import { usePresentationState } from "@/states/presentation-state";
import { useToolbarContext } from "./ToolbarContext";

const CALLOUT_VARIANT_OPTIONS = Object.keys(
  CALLOUT_VARIANTS,
) as CalloutVariant[];

function getCalloutVariant(value: string): CalloutVariant {
  return CALLOUT_VARIANT_OPTIONS.includes(value as CalloutVariant)
    ? (value as CalloutVariant)
    : "note";
}

export function CalloutVariantControl() {
  const [open, setOpen] = React.useState(false);
  const { currentVariant, editor, element } = useToolbarContext();
  const setPaletteDropTarget = usePresentationState(
    (state) => state.setPaletteDropTarget,
  );
  const selectedVariant = getCalloutVariant(currentVariant);

  const updateVariant = (nextVariant: string) => {
    if (!element) return;

    const variant = getCalloutVariant(nextVariant);
    const variantConfig = CALLOUT_VARIANTS[variant];
    const path = editor.api.findPath(element as TElement);
    if (!path) return;

    setPaletteDropTarget(null);
    editor.tf.setNodes(
      {
        variant,
        backgroundColor: variantConfig.backgroundColor,
        icon: variantConfig.icon,
        [PALETTE_DROP_MUTABLE_KEY]: false,
      },
      { at: path },
    );
  };

  return (
    <ToolbarGroup>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            className="min-w-24"
            isDropdown
            pressed={open}
            tooltip="Callout variant"
          >
            <MessageSquareWarning className="size-4" />
            <span className="capitalize">{selectedVariant}</span>
          </ToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="ignore-click-outside/toolbar min-w-0"
        >
          <ToolbarMenuGroup
            label="Variant"
            onValueChange={updateVariant}
            value={selectedVariant}
          >
            {CALLOUT_VARIANT_OPTIONS.map((variant) => (
              <DropdownMenuRadioItem key={variant} value={variant}>
                <span className="capitalize">{variant}</span>
              </DropdownMenuRadioItem>
            ))}
          </ToolbarMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ToolbarGroup>
  );
}
