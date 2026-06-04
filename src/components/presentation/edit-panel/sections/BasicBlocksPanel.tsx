"use client";

import { basicBlockItems, type PaletteItem } from "./elements";
import { PaletteItemsPanel } from "./ElementsPanel";

function getBasicBlockFilterValue(item: PaletteItem): string {
  return item.category ?? "Basic blocks";
}

export function BasicBlocksPanel({ isLoaded }: { isLoaded: boolean }) {
  return (
    <PaletteItemsPanel
      emptyMessage="No basic blocks match your search."
      getFilterValue={getBasicBlockFilterValue}
      isLoaded={isLoaded}
      paletteItems={basicBlockItems}
      searchPlaceholder="Search basic blocks..."
      source="basicBlocks"
    />
  );
}
