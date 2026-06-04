"use client";

import { ImageIcon } from "lucide-react";

import { ICON_LIST } from "@/components/notebook/presentation/editor/lib";
import {
  getIconListMediaSize,
  ICON_LIST_MEDIA_SIZE_BOUNDS,
} from "@/components/notebook/presentation/editor/utils";
import { ToolbarGroup } from "@/components/plate/ui/toolbar";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToolbarContext } from "./ToolbarContext";

export function IconListMediaSizeSlider() {
  const { element, elementType, handleNodePropertyUpdate } =
    useToolbarContext();

  if (elementType !== ICON_LIST) {
    return null;
  }

  const currentSize = getIconListMediaSize(element?.mediaSize);

  return (
    <ToolbarGroup className="flex">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-2">
            <ImageIcon className="size-4 text-muted-foreground" />
            <Slider
              value={[currentSize]}
              onValueChange={(values) => {
                const value = values[0];
                if (typeof value === "number") {
                  handleNodePropertyUpdate("mediaSize", value);
                }
              }}
              min={ICON_LIST_MEDIA_SIZE_BOUNDS.min}
              max={ICON_LIST_MEDIA_SIZE_BOUNDS.max}
              step={4}
              className="w-24 [data-slider-thumb]:size-3!"
            />
          </div>
        </TooltipTrigger>

        <TooltipContent>
          <p>Icon/Image Size ({Math.round(currentSize)}px)</p>
        </TooltipContent>
      </Tooltip>
    </ToolbarGroup>
  );
}
