"use client";

import {
  type DataFieldType,
  type DataItem,
  type ParsedDataBlock,
} from "@/components/notebook/presentation/editor/utils/infographic-utils";

export type EditableInfographicItem = DataItem & {
  editorId: string;
  children?: EditableInfographicItem[];
};

export type EditableInfographicData = Omit<ParsedDataBlock, "items"> & {
  items: EditableInfographicItem[];
};

export type InfographicItemPatch = Partial<
  Pick<
    EditableInfographicItem,
    "category" | "desc" | "group" | "id" | "label" | "value"
  >
>;

export type InfographicDataMode = DataFieldType;
