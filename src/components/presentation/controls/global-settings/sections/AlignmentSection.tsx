"use client";

import { AlignCenter, ArrowUpFromLine, FoldVertical } from "lucide-react";

import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { useCommonValues } from "../hooks/useCommonValues";
import { useUpdateAllSlides } from "../hooks/useUpdateAllSlides";

export function AlignmentSection() {
  const { currentAlignment } = useCommonValues();
  const updateAllSlides = useUpdateAllSlides();

  return (
    <div className="space-y-2">
      <Label
        htmlFor="content-alignment"
        className="flex items-center gap-2 text-sm font-semibold text-foreground"
      >
        <AlignCenter className="size-4 text-muted-foreground" />
        Content Alignment
      </Label>
      <ToggleGroup
        id="content-alignment"
        type="single"
        value={currentAlignment}
        onValueChange={(val) =>
          val &&
          updateAllSlides({ alignment: val as "start" | "center" | "end" })
        }
        className="w-full gap-2 rounded-full"
      >
        <ToggleGroupItem
          value="start"
          variant="outline"
          size="sm"
          className={cn(
            "flex-1 border-border transition-all",
            currentAlignment === "start" &&
              "border-primary bg-primary text-primary-foreground",
          )}
          title="Align start"
        >
          <ArrowUpFromLine className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="center"
          variant="outline"
          size="sm"
          className={cn(
            "flex-1 border-border transition-all",
            currentAlignment === "center" &&
              "border-primary bg-primary text-primary-foreground",
          )}
          title="Align center"
        >
          <FoldVertical className="size-4" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="end"
          variant="outline"
          size="sm"
          className={cn(
            "flex-1 border-border transition-all",
            currentAlignment === "end" &&
              "border-primary bg-primary text-primary-foreground",
          )}
          title="Align end"
        >
          <ArrowUpFromLine className="size-4 rotate-180" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
