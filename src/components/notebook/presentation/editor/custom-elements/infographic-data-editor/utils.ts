"use client";

import { type InfographicOptions } from "@antv/infographic";

import {
  buildInfographicDataFromParsed,
  parseDataBlock,
  syncInfographicSyntaxWithData,
  type DataFieldType,
  type DataItem,
  type InfographicRelationEdge,
  type ParsedDataBlock,
} from "@/components/notebook/presentation/editor/utils/infographic-utils";
import {
  type EditableInfographicData,
  type EditableInfographicItem,
  type InfographicDataMode,
} from "./types";

const DEFAULT_ITEMS: DataItem[] = [
  { label: "Discovery", desc: "Understand the need", value: 28 },
  { label: "Design", desc: "Shape the solution", value: 44 },
  { label: "Delivery", desc: "Ship and measure", value: 72 },
];

type DataRecord = Record<string, unknown>;

let generatedId = 0;

export function createEditorId(): string {
  generatedId += 1;
  return `infographic-item-${Date.now()}-${generatedId}`;
}

function withEditorIds(items: DataItem[]): EditableInfographicItem[] {
  return items.map((item) => ({
    ...item,
    editorId: createEditorId(),
    children: item.children ? withEditorIds(item.children) : undefined,
  }));
}

function getStableItemKey(item: DataItem, index: number): string {
  if (item.id) return `id:${item.id}`;
  if (item.label) return `label:${item.label}`;
  return `index:${index}`;
}

function reuseEditorIds(
  nextItems: DataItem[],
  previousItems: EditableInfographicItem[],
): EditableInfographicItem[] {
  const previousByKey = new Map<string, EditableInfographicItem>();

  previousItems.forEach((item, index) => {
    previousByKey.set(getStableItemKey(item, index), item);
  });

  return nextItems.map((item, index) => {
    const previous = previousByKey.get(getStableItemKey(item, index));

    return {
      ...item,
      editorId: previous?.editorId ?? createEditorId(),
      children: item.children
        ? reuseEditorIds(item.children, previous?.children ?? [])
        : undefined,
    };
  });
}

function withoutEditorIds(items: EditableInfographicItem[]): DataItem[] {
  return items.map(({ editorId: _editorId, children, ...item }) => ({
    ...item,
    children: children ? withoutEditorIds(children) : undefined,
  }));
}

function getFallbackMode(
  options?: Partial<InfographicOptions>,
): InfographicDataMode {
  const data = options?.data;
  if (!data) return "items";
  if ("root" in data && data.root) return "root";
  if ("nodes" in data && Array.isArray(data.nodes)) return "nodes";
  if ("compares" in data && Array.isArray(data.compares)) return "compares";
  if ("lists" in data && Array.isArray(data.lists)) return "lists";
  if ("sequences" in data && Array.isArray(data.sequences)) return "sequences";
  if ("values" in data && Array.isArray(data.values)) return "values";
  return "items";
}

function isDataRecord(value: unknown): value is DataRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cloneDataRecord(value: unknown): Record<string, unknown> | undefined {
  if (!isDataRecord(value)) return undefined;

  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

function cloneDataItem(value: unknown): DataItem | null {
  if (!isDataRecord(value)) return null;

  const item = JSON.parse(JSON.stringify(value)) as DataItem;
  return item;
}

function getArrayDataItems(data: DataRecord, field: DataFieldType): DataItem[] {
  const value = data[field];
  if (!Array.isArray(value)) return [];

  return value
    .map(cloneDataItem)
    .filter((item): item is DataItem => Boolean(item));
}

function getItemsFromOptionsData(
  data: DataRecord,
  field: DataFieldType,
): DataItem[] {
  if (field === "root") {
    const root = cloneDataItem(data.root);
    if (root) return [root];

    const items = getArrayDataItems(data, "items");
    return items.length > 0 ? [items[0]!] : [];
  }

  const items = getArrayDataItems(data, field);
  if (items.length > 0) return items;

  return getArrayDataItems(data, "items");
}

function relationEdgeToSyntax(edge: InfographicRelationEdge): string | null {
  const from = edge.from?.trim();
  const to = edge.to?.trim();
  if (!from || !to) return null;

  let connector = "->";
  if (edge.direction === "both") {
    connector = "<->";
  } else if (edge.direction === "none") {
    connector = "--";
  }

  if (edge.label?.trim()) {
    return `${from} - ${edge.label.trim()} ${connector} ${to}`;
  }

  return `${from} ${connector} ${to}`;
}

function getRelationsFromOptionsData(data: DataRecord): string[] {
  const relations = data.relations;
  if (!Array.isArray(relations)) return [];

  return relations
    .map((relation) => {
      if (typeof relation === "string") return relation;
      if (!isDataRecord(relation)) return null;

      return relationEdgeToSyntax(relation as InfographicRelationEdge);
    })
    .filter((relation): relation is string => Boolean(relation));
}

function createParsedDataFromOptions(
  options?: Partial<InfographicOptions>,
): ParsedDataBlock | null {
  if (!isDataRecord(options?.data)) return null;

  const data = options.data;
  const sourceField = getFallbackMode(options);
  const title = typeof data.title === "string" ? data.title : undefined;
  const desc = typeof data.desc === "string" ? data.desc : undefined;
  const order = typeof data.order === "string" ? data.order : undefined;
  const attributes = cloneDataRecord(data.attributes);
  const items = getItemsFromOptionsData(data, sourceField);
  const relations = getRelationsFromOptionsData(data);

  return {
    ...(title ? { title } : {}),
    ...(desc ? { desc } : {}),
    ...(order ? { order } : {}),
    ...(attributes ? { attributes } : {}),
    items,
    relations,
    sourceField,
  };
}

function getLiveTextMetadata(options?: Partial<InfographicOptions>): {
  desc?: string;
  title?: string;
} {
  const data = options?.data;
  if (!data || typeof data !== "object") return {};

  return {
    desc:
      "desc" in data && typeof data.desc === "string" ? data.desc : undefined,
    title:
      "title" in data && typeof data.title === "string"
        ? data.title
        : undefined,
  };
}

export function createEditableInfographicData({
  options,
  previousData,
  syntax,
}: {
  options?: Partial<InfographicOptions>;
  previousData?: EditableInfographicData;
  syntax: string;
}): EditableInfographicData {
  const parsedFromOptions = createParsedDataFromOptions(options);
  const syntaxWithLiveData = options?.data
    ? syncInfographicSyntaxWithData(syntax, options)
    : syntax;
  const parsed = parsedFromOptions ?? parseDataBlock(syntaxWithLiveData);
  const fallbackMode = getFallbackMode(options);
  const liveTextMetadata = getLiveTextMetadata(options);

  if (!parsed) {
    const items = previousData
      ? reuseEditorIds(DEFAULT_ITEMS, previousData.items)
      : withEditorIds(DEFAULT_ITEMS);

    return {
      ...liveTextMetadata,
      items,
      relations: [],
      sourceField: fallbackMode,
    };
  }

  const items = parsed.items.length > 0 ? parsed.items : DEFAULT_ITEMS;

  return {
    ...parsed,
    ...liveTextMetadata,
    items: previousData
      ? reuseEditorIds(items, previousData.items)
      : withEditorIds(items),
  };
}

export function createBlankInfographicItem(
  mode: InfographicDataMode,
): EditableInfographicItem {
  const isRelation = mode === "nodes";

  return {
    editorId: createEditorId(),
    label: isRelation ? "New node" : "New item",
    value: mode === "values" ? 10 : undefined,
    id: isRelation ? `node-${generatedId + 1}` : undefined,
    desc: mode === "values" ? undefined : "",
  };
}

export function toParsedInfographicData(
  data: EditableInfographicData,
): ParsedDataBlock {
  return {
    ...data,
    items: withoutEditorIds(data.items),
  };
}

export function toInfographicOptionsData(data: EditableInfographicData) {
  return buildInfographicDataFromParsed(toParsedInfographicData(data));
}

export function countNestedItems(items: EditableInfographicItem[]): number {
  let count = 0;
  for (const item of items) {
    count += 1;
    if (item.children) {
      count += countNestedItems(item.children);
    }
  }
  return count;
}

export function normalizeEditableValue(
  value: string,
): string | number | undefined {
  if (!value.trim()) return undefined;

  const numeric = Number(value);
  return Number.isNaN(numeric) ? value : numeric;
}
