"use client";

import { ArrowUpDown } from "lucide-react";
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

export function OrientationControl() {
  const [open, setOpen] = React.useState(false);
  const {
    supportsOrientationControl,
    currentOrientation,
    orientationOptions,
    handleNodePropertyUpdate,
  } = useToolbarContext();

  if (!supportsOrientationControl) {
    return null;
  }

  return (
    <ToolbarGroup>
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            className="min-w-25"
            pressed={open}
            tooltip="Change Orientation"
            isDropdown
          >
            <ArrowUpDown className="size-4" />
            <span className="capitalize">{currentOrientation}</span>
          </ToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="ignore-click-outside/toolbar min-w-0"
          align="start"
        >
          <ToolbarMenuGroup
            value={currentOrientation}
            onValueChange={(orientation) => {
              handleNodePropertyUpdate("orientation", orientation);
            }}
            label="Orientation"
          >
            {orientationOptions.map((option) => (
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
