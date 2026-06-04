"use client";

import { FlipHorizontal } from "lucide-react";
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

export function SidednessControl() {
  const [open, setOpen] = React.useState(false);
  const {
    supportsSidednessControl,
    currentSidedness,
    sidednessOptions,
    handleNodePropertyUpdate,
  } = useToolbarContext();

  if (!supportsSidednessControl) {
    return null;
  }

  return (
    <ToolbarGroup>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            className="min-w-25"
            pressed={open}
            tooltip="Change Sidedness"
            isDropdown
          >
            <FlipHorizontal className="size-4" />
            <span className="capitalize">{currentSidedness}</span>
          </ToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="ignore-click-outside/toolbar min-w-0"
          align="start"
        >
          <ToolbarMenuGroup
            value={currentSidedness}
            onValueChange={(sidedness) => {
              handleNodePropertyUpdate("sidedness", sidedness);
            }}
            label="Sidedness"
          >
            {sidednessOptions.map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
                <span className="capitalize">{option}</span>
              </DropdownMenuRadioItem>
            ))}
          </ToolbarMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </ToolbarGroup>
  );
}
