"use client";

import {
  AlignCenter,
  ArrowDown,
  ArrowUp,
  FoldVertical,
  ImageIcon,
  Maximize2,
  Palette,
} from "lucide-react";

import { PRESENTATION_PORTAL_CONTENT_CLASS } from "@/components/presentation/overlay-layers";
import { Button } from "@/components/ui/button";
import ColorPicker from "@/components/ui/color-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { themes } from "@/lib/presentation/themes";
import { capitalizeFirstLetter, cn } from "@/lib/utils";
import { useSlideEditorContext } from "./SlideEditorContext";
import { layoutMap } from "./types";

export function PaletteDropdown() {
  const {
    selectedLayout,
    currentSlide,
    currentTheme,
    currentThemeData,
    currentAlignment,
    currentWidth,
    hasRootImage,
    updateSlide,
    handleLayoutChange,
    handleImageEdit,
    setSelectedLayout,
  } = useSlideEditorContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8! gap-1 rounded-full border border-white/20 bg-background/50 shadow backdrop-blur-md transition-all hover:bg-background/80"
        >
          <Palette className="size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className={cn(PRESENTATION_PORTAL_CONTENT_CLASS, "w-90 p-4")}
      >
        {/* Layout options */}
        <div className="mb-4 flex gap-2 border-b border-border pb-4">
          {[0, 1, 2, 3, 4].map((idx) => (
            <button
              type="button"
              key={layoutMap[idx]}
              title={capitalizeFirstLetter(layoutMap[idx]!)}
              onClick={() => {
                if (!hasRootImage) {
                  setSelectedLayout(idx);
                  updateSlide({
                    layoutType: layoutMap[idx],
                    rootImage: { query: "", url: "" },
                  });
                } else {
                  handleLayoutChange(idx);
                }
              }}
              className={cn(
                "flex items-center justify-center rounded-lg px-3 py-2 transition-all",
                selectedLayout === idx
                  ? "border-2 border-primary bg-primary/20"
                  : "border border-border bg-secondary hover:border-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "grid h-5 w-8 rounded-sm",
                  selectedLayout === idx
                    ? "border-2 border-primary-foreground bg-primary-foreground"
                    : "border border-muted-foreground/50 bg-transparent",
                )}
              >
                {idx === 1 && (
                  <div
                    className={cn(
                      "h-2 w-full rounded-none",
                      selectedLayout === idx
                        ? "bg-muted"
                        : "bg-muted-foreground/50",
                    )}
                  />
                )}
                {idx === 2 && (
                  <div className="flex size-full gap-0.5 p-0.5">
                    <div
                      className={cn(
                        "flex-1 rounded-sm",
                        selectedLayout === idx
                          ? "bg-primary"
                          : "bg-muted-foreground/50",
                      )}
                    />
                    <div
                      className={cn(
                        "flex-1 rounded-sm",
                        selectedLayout === idx
                          ? "bg-primary-foreground"
                          : "bg-transparent",
                      )}
                    />
                  </div>
                )}
                {idx === 3 && (
                  <div className="flex size-full gap-0.5 p-0.5">
                    <div
                      className={cn(
                        "flex-1 rounded-sm",
                        selectedLayout === idx
                          ? "bg-primary-foreground"
                          : "bg-transparent",
                      )}
                    />
                    <div
                      className={cn(
                        "flex-1 rounded-sm",
                        selectedLayout === idx
                          ? "bg-muted"
                          : "bg-muted-foreground/50",
                      )}
                    />
                  </div>
                )}
                {idx === 4 && (
                  <div
                    className={cn(
                      "size-full rounded-sm",
                      selectedLayout === idx
                        ? "bg-muted"
                        : "bg-muted-foreground/50",
                    )}
                  />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Card color */}
        <div className="mb-4 border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Card color</span>
            </div>
            <ColorPicker
              value={
                currentSlide?.bgColor ??
                themes[currentTheme]?.colors?.background ??
                currentThemeData?.colors?.background
              }
              onChange={(color) => updateSlide({ bgColor: color })}
            />
          </div>
        </div>

        {/* Content alignment */}
        <div className="mb-4 border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlignCenter className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Content alignment</span>
            </div>
            <div className="flex gap-1">
              {[
                { value: "start" as const, icon: ArrowUp },
                { value: "center" as const, icon: FoldVertical },
                { value: "end" as const, icon: ArrowDown },
              ].map((item) => (
                <button
                  aria-label="palette dropdown control"
                  type="button"
                  key={item.value}
                  onClick={() => updateSlide({ alignment: item.value })}
                  className={cn(
                    "rounded p-2 transition-all",
                    currentAlignment === item.value
                      ? "border border-primary bg-primary/20"
                      : "border border-border hover:border-muted-foreground",
                  )}
                >
                  <item.icon className="size-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Card width */}
        <div className="mb-4 border-b border-border pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Maximize2 className="size-4 text-muted-foreground" />
              <span className="text-sm font-medium">Card width</span>
            </div>
            <div className="flex gap-1">
              {(["M", "L"] as const).map((size) => (
                <button
                  type="button"
                  key={size}
                  onClick={() => updateSlide({ width: size })}
                  className={cn(
                    "rounded px-3 py-1 text-sm font-medium transition",
                    currentWidth === size
                      ? "border border-primary bg-primary/20 text-primary"
                      : "border border-border text-muted-foreground hover:border-muted-foreground",
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ImageIcon className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium">Image</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-primary text-primary hover:bg-primary/10"
            onClick={handleImageEdit}
          >
            {hasRootImage ? "Edit" : "+ Add"}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
