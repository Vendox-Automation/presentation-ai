"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function normalizePanelSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[-_/&]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesPanelSearch(
  query: string,
  values: Array<string | null | undefined>,
): boolean {
  const normalizedQuery = normalizePanelSearchText(query);
  if (!normalizedQuery) return true;

  return values.some((value) =>
    normalizePanelSearchText(value ?? "").includes(normalizedQuery),
  );
}

export function PanelSearchFilter({
  className,
  onQueryChange,
  placeholder,
  query,
}: {
  className?: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  query: string;
}) {
  return (
    <div className={cn("shrink-0 border-b bg-background px-4 py-3", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
          className="h-9 rounded-md pr-9 pl-9 text-sm"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear search"
            onClick={() => onQueryChange("")}
            className="absolute top-1/2 right-1 size-7 -translate-y-1/2 rounded-full"
          >
            <X className="size-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
