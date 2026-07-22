"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UploadCloud } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { createThemeFromSkill } from "@/app/_actions/presentation/skill-theme-actions";
import { cn } from "@/lib/utils";

// Only text-bearing files carry a skill's design language; ignore binaries.
const TEXT_EXTENSIONS = [".md", ".markdown", ".txt", ".mdx"];
const MAX_COMBINED_CHARS = 60_000;

function isTextFileName(name: string): boolean {
  const lower = name.toLowerCase();
  return TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** Recursively read a dropped FileSystem entry (file or folder) into Files. */
async function readEntry(entry: FileSystemEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve) => {
      (entry as FileSystemFileEntry).file(
        (file) => resolve([file]),
        () => resolve([]),
      );
    });
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const readBatch = () =>
      new Promise<FileSystemEntry[]>((resolve) => {
        reader.readEntries(
          (entries) => resolve(entries),
          () => resolve([]),
        );
      });

    const collected: File[] = [];
    // readEntries yields in batches; keep calling until it returns nothing.
    let batch = await readBatch();
    while (batch.length > 0) {
      for (const child of batch) {
        collected.push(...(await readEntry(child)));
      }
      batch = await readBatch();
    }
    return collected;
  }
  return [];
}

/** Expand a drop's items — including whole folders — into a flat File list. */
async function filesFromDrop(dataTransfer: DataTransfer): Promise<File[]> {
  const items = Array.from(dataTransfer.items);
  const entries = items
    .map((item) => item.webkitGetAsEntry?.() ?? null)
    .filter((entry): entry is FileSystemEntry => entry !== null);

  if (entries.length === 0) {
    // Browser didn't expose the entry API; fall back to the flat file list.
    return Array.from(dataTransfer.files);
  }

  const nested = await Promise.all(entries.map(readEntry));
  return nested.flat();
}

/**
 * Pull readable skill text out of a set of files. Supports a single SKILL.md,
 * several markdown files (a whole skill folder), or a .zip bundle whose text
 * entries we unpack with jszip. SKILL.md is hoisted first so the model sees the
 * primary instructions before reference files.
 */
async function readSkillText(files: File[]): Promise<string> {
  const parts: { name: string; text: string }[] = [];

  for (const file of files) {
    if (file.name.toLowerCase().endsWith(".zip")) {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const zipEntries = Object.values(zip.files).filter(
        (entry) => !entry.dir && isTextFileName(entry.name),
      );
      for (const entry of zipEntries) {
        parts.push({ name: entry.name, text: await entry.async("string") });
      }
    } else if (isTextFileName(file.name)) {
      parts.push({
        name: (file as File & { webkitRelativePath?: string })
          .webkitRelativePath || file.name,
        text: await file.text(),
      });
    }
  }

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
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const importFromFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      setIsImporting(true);
      const pending = toast.loading("Reading skill and extracting a theme…");
      try {
        const skillText = await readSkillText(files);
        if (!skillText || skillText.trim().length < 40) {
          toast.error("No readable skill text found", {
            id: pending,
            description:
              "Drop a SKILL.md, a skill folder, or a skill .zip with real content.",
          });
          return;
        }

        const result = await createThemeFromSkill(skillText);
        if (result.success) {
          toast.success(result.message, {
            id: pending,
            description: "Find it below in My Themes.",
          });
          // Two call sites list user themes under different query keys.
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

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (isImporting) return;
      const files = await filesFromDrop(e.dataTransfer);
      void importFromFiles(files);
    },
    [importFromFiles, isImporting],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Import a theme from a skill: drop files or browse"
      onDragOver={(e) => {
        e.preventDefault();
        if (!isImporting) setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => void handleDrop(e)}
      onClick={() => !isImporting && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isImporting) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
        isDragging
          ? "border-primary bg-primary/10"
          : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
      )}
    >
      <div
        className={cn(
          "rounded-full p-2.5 transition-colors",
          isDragging ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary",
        )}
      >
        {isImporting ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <UploadCloud className="size-5" />
        )}
      </div>

      <div className="space-y-0.5">
        <p className="text-sm font-medium">
          {isImporting
            ? "Extracting a theme…"
            : isDragging
              ? "Drop to import"
              : "Import a theme from a skill"}
        </p>
        {!isImporting && (
          <p className="text-xs text-muted-foreground">
            Drag a skill here, or{" "}
            <span className="font-medium text-primary underline underline-offset-2">
              browse files
            </span>
          </p>
        )}
      </div>

      {!isImporting && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          Accepts a SKILL.md, a skill folder, or a .zip — AI extracts its palette
          and typography.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".md,.markdown,.mdx,.txt,.zip"
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => void importFromFiles(Array.from(e.target.files ?? []))}
      />
    </div>
  );
}
