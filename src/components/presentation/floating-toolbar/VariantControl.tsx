"use client";

import { LayoutTemplate } from "lucide-react";
import * as React from "react";

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
import { useToolbarContext } from "./ToolbarContext";

export function VariantControl() {
  const [open, setOpen] = React.useState(false);
  const {
    supportsVariantControl,
    currentVariant,
    variantOptions,
    handleNodePropertyUpdate,
  } = useToolbarContext();

  if (!supportsVariantControl || variantOptions.length === 0) {
    return null;
  }

  return (
    <ToolbarGroup>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            className="min-w-25"
            pressed={open}
            tooltip="Change Variant"
            isDropdown
          >
            <LayoutTemplate className="size-4" />
            <span className="capitalize">
              {currentVariant === "inside" ? "Inside Text" : currentVariant}
            </span>
          </ToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="ignore-click-outside/toolbar min-w-0"
          align="start"
        >
          <ToolbarMenuGroup
            value={currentVariant}
            onValueChange={(variant) => {
              handleNodePropertyUpdate("variant", variant);
            }}
            label="Variant"
          >
            {variantOptions.map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
                <span className="capitalize">
                  {option === "inside" ? "Inside Text" : option}
                </span>
              </DropdownMenuRadioItem>
            ))}
          </ToolbarMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ToolbarGroup>
  );
}
