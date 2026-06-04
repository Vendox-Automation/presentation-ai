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
import { GripVertical, ListTree, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  type EditableInfographicItem,
  type InfographicItemPatch,
} from "./types";
import { createEditorId, normalizeEditableValue } from "./utils";

interface InfographicTreeEditorProps {
  items: EditableInfographicItem[];
  variant?: TreeEditorVariant;
  onChange: (items: EditableInfographicItem[]) => void;
}

interface TreeLevelProps {
  items: EditableInfographicItem[];
  level: number;
  variant: TreeEditorVariant;
  onChange: (items: EditableInfographicItem[]) => void;
}

interface TreeNodeRowProps {
  item: EditableInfographicItem;
  level: number;
  variant: TreeEditorVariant;
  onAddChild: () => void;
  onChildrenChange: (children: EditableInfographicItem[]) => void;
  onInsertAfter: () => void;
  onRemove: () => void;
  onUpdate: (patch: InfographicItemPatch) => void;
}

type TreeEditorVariant = "compare" | "hierarchy";

function createTreeItem(label = "New item"): EditableInfographicItem {
  return {
    editorId: createEditorId(),
    label,
    desc: "",
    value: undefined,
  };
}

function SortableTreeNode({
  item,
  level,
  variant,
  onAddChild,
  onChildrenChange,
  onInsertAfter,
  onRemove,
  onUpdate,
}: TreeNodeRowProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.editorId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const children = item.children ?? [];
  const isCompareGroup = variant === "compare" && level === 0;
  const childCountLabel = `${children.length} item${children.length === 1 ? "" : "s"}`;

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      <div
        className={cn(
          "group relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3 rounded-xl border border-border/50 bg-background p-3 transition-colors hover:bg-muted/30",
          isDragging && "z-20 opacity-80 shadow-xl ring-1 ring-ring",
        )}
      >
        <button
          type="button"
          className="mt-1 flex size-7 cursor-grab items-center justify-center rounded-md text-muted-foreground opacity-50 transition-all hover:bg-muted hover:opacity-100 active:cursor-grabbing group-hover:opacity-100"
          aria-label="Reorder hierarchy item"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <div className="min-w-0 space-y-3">
          {isCompareGroup ? (
            <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-2.5 transition-colors group-hover:bg-muted/40">
              <p className="text-sm font-semibold tracking-tight text-foreground">
                {item.label ?? "Group"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {childCountLabel}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <Input
                  value={item.label ?? ""}
                  onChange={(event) => onUpdate({ label: event.target.value })}
                  placeholder={level === 0 ? "Root title" : "Item title"}
                  className="bg-transparent font-medium shadow-none focus-visible:bg-background"
                />
                <Input
                  value={item.value ?? ""}
                  onChange={(event) =>
                    onUpdate({
                      value: normalizeEditableValue(event.target.value),
                    })
                  }
                  placeholder="Value"
                  className="bg-transparent shadow-none focus-visible:bg-background"
                />
              </div>
              <Textarea
                value={item.desc ?? ""}
                onChange={(event) => onUpdate({ desc: event.target.value })}
                placeholder="Description"
                className="min-h-16 resize-none bg-transparent shadow-none focus-visible:bg-background leading-relaxed"
              />
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 opacity-60 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 gap-1.5 px-2.5 text-xs"
              onClick={onAddChild}
            >
              <Plus className="size-3.5" />
              {isCompareGroup ? "Add Group Item" : "Add Child"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={onInsertAfter}
            >
              <Plus className="size-3.5" />
              {isCompareGroup ? "Insert Group Below" : "Insert Sibling Below"}
            </Button>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-1 size-8 text-muted-foreground opacity-50 transition-opacity hover:text-destructive group-hover:opacity-100"
          onClick={onRemove}
          aria-label="Remove hierarchy item"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      {children.length > 0 ? (
        <div className="ml-5 mt-2 border-l-2 border-border/40 pl-4 transition-colors hover:border-border/80">
          <TreeLevel
            items={children}
            level={level + 1}
            variant={variant}
            onChange={onChildrenChange}
          />
        </div>
      ) : null}
    </div>
  );
}

function TreeLevel({ items, level, variant, onChange }: TreeLevelProps) {
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

  const updateChildren = (
    editorId: string,
    children: EditableInfographicItem[],
  ) => {
    onChange(
      items.map((item) =>
        item.editorId === editorId
          ? {
              ...item,
              children,
              value:
                variant === "compare" && level === 0
                  ? children.length
                  : item.value,
            }
          : item,
      ),
    );
  };

  const addChild = (editorId: string) => {
    onChange(
      items.map((item) =>
        item.editorId === editorId
          ? {
              ...item,
              children: [
                ...(item.children ?? []),
                createTreeItem(
                  variant === "compare" ? "New item" : "New child",
                ),
              ],
              value:
                variant === "compare"
                  ? (item.children?.length ?? 0) + 1
                  : item.value,
            }
          : item,
      ),
    );
  };

  const removeItem = (editorId: string) => {
    onChange(items.filter((item) => item.editorId !== editorId));
  };

  const insertItem = (index: number) => {
    const nextItems = [...items];
    nextItems.splice(
      index,
      0,
      createTreeItem(
        variant === "compare" && level === 0
          ? "New group"
          : index === 0
            ? "New item"
            : "New sibling",
      ),
    );
    onChange(nextItems);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.editorId)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2">
          {items.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 w-full border-dashed text-xs"
              onClick={() => insertItem(0)}
            >
              <Plus className="size-3.5" />
              Insert item at start
            </Button>
          ) : null}
          {items.map((item, index) => (
            <SortableTreeNode
              key={item.editorId}
              item={item}
              level={level}
              variant={variant}
              onAddChild={() => addChild(item.editorId)}
              onChildrenChange={(children) =>
                updateChildren(item.editorId, children)
              }
              onInsertAfter={() => insertItem(index + 1)}
              onRemove={() => removeItem(item.editorId)}
              onUpdate={(patch) => updateItem(item.editorId, patch)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function InfographicTreeEditor({
  items,
  variant = "hierarchy",
  onChange,
}: InfographicTreeEditorProps) {
  const addRoot = () => {
    onChange([
      ...items,
      createTreeItem(
        variant === "compare"
          ? `Group ${String.fromCharCode(65 + items.length)}`
          : items.length === 0
            ? "Root"
            : "New root",
      ),
    ]);
  };
  const isCompare = variant === "compare";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
            <ListTree className="size-4" />
            {isCompare ? "Compare Groups" : "Hierarchy"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isCompare
              ? "Edit each compare side and the items shown inside it."
              : "Nest items to shape tree, mind-map, and hierarchy infographics."}
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={addRoot}
        >
          <Plus className="size-3.5" />
          {isCompare ? "Add Group" : "Add Root"}
        </Button>
      </div>

      <TreeLevel
        items={items}
        level={0}
        variant={variant}
        onChange={onChange}
      />

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-8 text-center">
          <p className="text-sm font-medium text-foreground">
            {isCompare ? "No compare groups yet" : "No hierarchy yet"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isCompare
              ? "Add a compare group, then add the items inside it."
              : "Add a root item, then add children below it."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
