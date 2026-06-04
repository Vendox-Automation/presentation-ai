"use client";

import { Loader2, SlidersHorizontal, Type, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { useThemePanelState } from "@/components/presentation/edit-panel/sections/theme/theme-panel-state";
import { extractThemeFromPptx } from "@/lib/presentation/pptx-theme-extractor";
import { cn } from "@/lib/utils";
import { openThemeCustomizer } from "./customize-theme";

function handleCustomizeClick() {
  openThemeCustomizer();
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function ThemeFilter() {
  const {
    setShowFont,
    showFont,
    setOpenCreateThemeModal,
    setImportedThemeData,
  } = useThemePanelState();
  const [isImporting, setIsImporting] = useState(false);

  function handleFontClick() {
    setShowFont(!useThemePanelState.getState().showFont);
  }

  function handleImportClick() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pptx";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        toast.error("File is too large", {
          description: "Maximum file size is 50MB.",
        });
        return;
      }

      try {
        setIsImporting(true);
        const themeData = await extractThemeFromPptx(file);
        setImportedThemeData(themeData);
        setOpenCreateThemeModal(true);
      } catch {
        try {
          toast.error("Failed to extract theme", {
            description:
              "The file could not be read. Please ensure it is a valid .pptx file.",
          });
        } catch (reactDoctorCatchError) {
          setIsImporting(false);
          throw reactDoctorCatchError;
        }
      }
      setIsImporting(false);
    };
    input.click();
  }

  return (
    <div className="relative flex flex-wrap gap-2 px-4">
      {/* Customize Button */}
      <button
        onClick={handleCustomizeClick}
        className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm whitespace-nowrap transition-colors hover:bg-muted"
        type="button"
      >
        <SlidersHorizontal className="size-4 shrink-0 text-foreground" />
        <span className="text-foreground">Customize</span>
      </button>

      {/* Font Button */}
      <button
        onClick={handleFontClick}
        className={cn(
          "flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm whitespace-nowrap transition-colors hover:bg-muted",
          showFont && "bg-muted",
        )}
        type="button"
      >
        <Type className="size-4 shrink-0 text-foreground" />
        <span className="text-foreground">Font</span>
      </button>

      {/* Import Button */}
      <button
        onClick={handleImportClick}
        disabled={isImporting}
        className={cn(
          "flex shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm whitespace-nowrap transition-colors hover:bg-muted",
          isImporting && "cursor-not-allowed opacity-60",
        )}
        title="Import Theme from PPTX"
        type="button"
      >
        {isImporting ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-foreground" />
        ) : (
          <Upload className="size-4 shrink-0 text-foreground" />
        )}
        <span className="text-foreground">
          {isImporting ? "Importing..." : "Import"}
        </span>
      </button>
    </div>
  );
}
