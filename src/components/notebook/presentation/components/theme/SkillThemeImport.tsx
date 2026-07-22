"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { createThemeFromSkill } from "@/app/_actions/presentation/skill-theme-actions";
import { Button } from "@/components/ui/button";

// Only text-bearing files carry a skill's design language; ignore binaries.
const TEXT_EXTENSIONS = [".md", ".markdown", ".txt", ".mdx"];
const MAX_COMBINED_CHARS = 60_000;

function isTextFileName(name: string): boolean {
  const lower = name.toLowerCase();
  return TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Pull readable skill text out of the user's selection. Supports a single
 * SKILL.md, several markdown files (e.g. a whole skill folder via directory
 * pick), or a .zip bundle whose text entries we unpack with jszip. SKILL.md is
 * always hoisted first so the model sees the primary instructions before
 * reference files.
 */
async function readSkillText(files: File[]): Promise<string> {
  const parts: { name: string; text: string }[] = [];

  for (const file of files) {
    if (file.name.toLowerCase().endsWith(".zip")) {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const entries = Object.values(zip.files).filter(
        (entry) => !entry.dir && isTextFileName(entry.name),
      );
      for (const entry of entries) {
        parts.push({ name: entry.name, text: await entry.async("string") });
      }
    } else if (isTextFileName(file.name)) {
      parts.push({ name: file.name, text: await file.text() });
    }
  }

  // SKILL.md first, then everything else, each labeled with its path.
  parts.sort((a, b) => {
    const aSkill = a.name.toLowerCase().endsWith("skill.md") ? 0 : 1;
    const bSkill = b.name.toLowerCase().endsWith("skill.md") ? 0 : 1;
    return aSkill - bSkill;
  });

  return parts
    .map((p) => `### FILE: ${p.name}\n${p.text}`)
    .join("\n\n")
    .slice(0, MAX_COMBINED_CHARS);
}

export function SkillThemeImport() {
  const [isImporting, setIsImporting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);

      setIsImporting(true);
      const pending = toast.loading("Reading skill and extracting a theme…");
      try {
        const skillText = await readSkillText(files);
        if (!skillText || skillText.trim().length < 40) {
          toast.error("No readable skill text found", {
            id: pending,
            description:
              "Select a SKILL.md, a folder of markdown files, or a skill .zip.",
          });
          return;
        }

        const result = await createThemeFromSkill(skillText);
        if (result.success) {
          toast.success(result.message, {
            id: pending,
            description: "Find it below in My Themes.",
          });
          // Two different call sites list user themes under different keys.
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["userThemes"] }),
            queryClient.invalidateQueries({
              queryKey: ["presentation", "themes", "user"],
            }),
          ]);
        } else {
          toast.error("Couldn't import that skill", {
            id: pending,
            description: result.message,
          });
        }
      } catch {
        toast.error("Something went wrong reading that file", { id: pending });
      } finally {
        setIsImporting(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [queryClient],
  );

  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">
          <Sparkles className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Import a theme from a skill</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Upload a slide-design skill (SKILL.md, a skill folder, or a .zip) and
            AI will extract its palette and typography into a reusable theme.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            disabled={isImporting}
            onClick={() => inputRef.current?.click()}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Extracting…
              </>
            ) : (
              <>
                <Upload className="mr-1.5 size-3.5" />
                Upload skill
              </>
            )}
          </Button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".md,.markdown,.mdx,.txt,.zip"
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />
    </div>
  );
}
