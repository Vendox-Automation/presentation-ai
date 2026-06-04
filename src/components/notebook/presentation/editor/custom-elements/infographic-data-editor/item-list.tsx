"use client";

import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  type EditableInfographicItem,
  type InfographicDataMode,
  type InfographicItemPatch,
} from "./types";
import { createBlankInfographicItem, normalizeEditableValue } from "./utils";

interface InfographicItemListProps {
  items: EditableInfographicItem[];
  mode: InfographicDataMode;
  onChange: (items: EditableInfographicItem[]) => void;
}

interface SortableItemRowProps {
  item: EditableInfographicItem;
  mode: InfographicDataMode;
  onInsertAfter: () => void;
  onRemove: () => void;
  onUpdate: (patch: InfographicItemPatch) => void;
}

function SortableItemRow({
  item,
  mode,
  onInsertAfter,
  onRemove,
  onUpdate,
}: SortableItemRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.editorId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const showValue = mode === "values" || item.value !== undefined;
  const showId = mode === "nodes";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-border/50 bg-background p-3 transition-colors hover:bg-muted/30",
        isDragging && "z-20 opacity-80 shadow-xl ring-1 ring-ring",
      )}
    >
      <button
        type="button"
        className="mt-1 flex size-7 cursor-grab items-center justify-center rounded-md text-muted-foreground opacity-50 transition-all hover:bg-muted hover:opacity-100 active:cursor-grabbing group-hover:opacity-100"
        aria-label="Reorder item"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      <div className="min-w-0 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={item.label ?? ""}
            onChange={(event) => onUpdate({ label: event.target.value })}
            placeholder={mode === "values" ? "Word or label" : "Title"}
            className="bg-transparent font-medium shadow-none focus-visible:bg-background"
          />
          {showValue ? (
            <Input
              value={item.value ?? ""}
              onChange={(event) =>
                onUpdate({ value: normalizeEditableValue(event.target.value) })
              }
              placeholder="Value"
              className="bg-transparent shadow-none focus-visible:bg-background"
            />
          ) : null}
        </div>

        {showId ? (
          <div className="grid gap-2">
            <Input
              value={item.id ?? ""}
              onChange={(event) => onUpdate({ id: event.target.value })}
              placeholder="Node id"
              className="bg-transparent shadow-none focus-visible:bg-background font-mono text-sm"
            />
          </div>
        ) : null}

        {mode !== "values" ? (
          <Textarea
            value={item.desc ?? ""}
            onChange={(event) => onUpdate({ desc: event.target.value })}
            placeholder="Description"
            className="min-h-18 resize-none bg-transparent shadow-none focus-visible:bg-background leading-relaxed"
          />
        ) : null}

        <div className="pt-1 opacity-60 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={onInsertAfter}
          >
            <Plus className="size-3.5" />
            Insert item below
          </Button>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="mt-1 size-8 text-muted-foreground opacity-50 transition-opacity hover:text-destructive group-hover:opacity-100"
        onClick={onRemove}
        aria-label="Remove item"
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export function InfographicItemList({
  items,
  mode,
  onChange,
}: InfographicItemListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.editorId === active.id);
    const newIndex = items.findIndex((item) => item.editorId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onChange(arrayMove(items, oldIndex, newIndex));
  };

  const updateItem = (editorId: string, patch: InfographicItemPatch) => {
    onChange(
      items.map((item) =>
        item.editorId === editorId ? { ...item, ...patch } : item,
      ),
    );
  };

  const removeItem = (editorId: string) => {
    onChange(items.filter((item) => item.editorId !== editorId));
  };

  const insertItem = (index: number) => {
    const nextItems = [...items];
    nextItems.splice(index, 0, createBlankInfographicItem(mode));
    onChange(nextItems);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div>
          <p className="text-sm font-semibold tracking-tight text-foreground">
            Items
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {items.length} item{items.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={() => insertItem(items.length)}
        >
          <Plus className="size-3.5" />
          Add Item
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.editorId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {items.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full border-dashed text-xs text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                onClick={() => insertItem(0)}
              >
                <Plus className="size-3.5 mr-1.5" />
                Insert item at start
              </Button>
            ) : null}
            {items.map((item, index) => (
              <SortableItemRow
                key={item.editorId}
                item={item}
                mode={mode}
                onInsertAfter={() => insertItem(index + 1)}
                onRemove={() => removeItem(item.editorId)}
                onUpdate={(patch) => updateItem(item.editorId, patch)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-8 text-center">
          <p className="text-sm font-medium text-foreground">No items yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Add an item to populate the infographic.
          </p>
        </div>
      ) : null}
    </div>
  );
}
