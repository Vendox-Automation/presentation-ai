"use client";

import { Copy, Shapes, StepBack, StepForward, Trash2 } from "lucide-react";
import { KEYS, nanoid, NodeApi, PathApi, type TElement } from "platejs";

import { updateSiblingsForcefully } from "@/components/notebook/presentation/editor/dnd/utils/updateSiblingsForcefully";
import {
  ARROW_LIST_ITEM,
  BOX_ITEM,
  BULLET_ITEM,
  CYCLE_ITEM,
  ICON_ELEMENT,
  ICON_LIST_ITEM,
  PYRAMID_ITEM,
  STAIR_ITEM,
  TIMELINE_ITEM,
} from "@/components/notebook/presentation/editor/lib";
import { ToolbarButton, ToolbarGroup } from "@/components/plate/ui/toolbar";
import { IconPicker } from "@/components/ui/icon-picker";
import { cn } from "@/lib/utils";
import { useToolbarContext } from "./ToolbarContext";

const ICON_EDITABLE_ITEM_TYPES = new Set<string>([
  ARROW_LIST_ITEM,
  BOX_ITEM,
  BULLET_ITEM,
  CYCLE_ITEM,
  ICON_ELEMENT,
  ICON_LIST_ITEM,
  PYRAMID_ITEM,
  STAIR_ITEM,
  TIMELINE_ITEM,
]);

function isElementNode(node: unknown): node is TElement {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    "children" in node
  );
}

function createBlankItemFrom(item: TElement): TElement {
  const itemRecord = item as TElement & Record<string, unknown>;
  const alignment =
    typeof itemRecord.alignment === "string"
      ? { alignment: itemRecord.alignment }
      : {};

  return {
    ...alignment,
    id: nanoid(),
    type: item.type,
    children: [
      {
        id: nanoid(),
        type: KEYS.p,
        children: [{ text: "" }],
      },
    ],
  };
}

function cloneWithNewIds(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(cloneWithNewIds);
  }
  if (node !== null && typeof node === "object") {
    const clone = { ...node } as Record<string, unknown>;
    if ("id" in clone) {
      clone.id = nanoid();
    }
    for (const key in clone) {
      clone[key] = cloneWithNewIds(clone[key]);
    }
    return clone;
  }
  return node;
}

export function CustomItemControls() {
  const {
    editor,
    element,
    elementType,
    handleNodePropertyUpdate,
    isLayoutChildElement,
  } = useToolbarContext();

  if (!isLayoutChildElement || !element || !isElementNode(element)) {
    return null;
  }

  const itemPath = editor.api.findPath(element);
  const parentPath = itemPath ? PathApi.parent(itemPath) : undefined;
  const currentIcon =
    typeof (element as { icon?: unknown }).icon === "string"
      ? (element as TElement & { icon: string }).icon
      : undefined;
  const supportsIcon = ICON_EDITABLE_ITEM_TYPES.has(elementType);

  const forceUpdateSiblings = () => {
    if (!parentPath) return;
    const currentParent = NodeApi.get(editor, parentPath) as
      | TElement
      | undefined;
    if (currentParent && Array.isArray(currentParent.children)) {
      updateSiblingsForcefully(editor, currentParent, parentPath);
    }
  };

  const insertItem = (placement: "before" | "after") => {
    if (!itemPath) return;

    editor.tf.withoutNormalizing(() => {
      const insertionPath =
        placement === "before" ? itemPath : PathApi.next(itemPath);

      editor.tf.insertNodes(createBlankItemFrom(element), {
        at: insertionPath,
        select: true,
      });
      forceUpdateSiblings();
    });
  };

  const duplicateItem = () => {
    if (!itemPath) return;

    editor.tf.withoutNormalizing(() => {
      const clonedNode = cloneWithNewIds(element) as TElement;
      editor.tf.insertNodes(clonedNode, {
        at: PathApi.next(itemPath),
        select: true,
      });
      forceUpdateSiblings();
    });
  };

  return (
    <>
      <ToolbarGroup>
        <ToolbarButton
          onClick={() => insertItem("before")}
          size="sm"
          tooltip="Add Previous Item"
        >
          <StepBack className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => insertItem("after")}
          size="sm"
          tooltip="Add Next Item"
        >
          <StepForward className="size-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={duplicateItem}
          size="sm"
          tooltip="Duplicate Item"
        >
          <Copy className="size-4" />
        </ToolbarButton>
      </ToolbarGroup>

      {supportsIcon && (
        <ToolbarGroup>
          <IconPicker
            defaultIcon={currentIcon}
            placeholder={<Shapes className="size-4" />}
            size="sm"
            variant="ghost"
            className={cn("border-0 shadow-none")}
            title="Change icon"
            onIconSelect={(iconName) =>
              handleNodePropertyUpdate("icon", iconName)
            }
            onIconRemove={() => handleNodePropertyUpdate("icon", undefined)}
          />
        </ToolbarGroup>
      )}
    </>
  );
}

export function CustomItemDeleteButton() {
  const { editor, element, isLayoutChildElement } = useToolbarContext();

  if (!isLayoutChildElement || !element || !isElementNode(element)) {
    return null;
  }

  const itemPath = editor.api.findPath(element);
  const parentPath = itemPath ? PathApi.parent(itemPath) : undefined;
  const parent = parentPath ? NodeApi.get(editor, parentPath) : undefined;
  const canDelete =
    isElementNode(parent) && Array.isArray(parent.children)
      ? parent.children.length > 1
      : true;

  const forceUpdateSiblings = () => {
    if (!parentPath) return;
    const currentParent = NodeApi.get(editor, parentPath) as
      | TElement
      | undefined;
    if (currentParent && Array.isArray(currentParent.children)) {
      updateSiblingsForcefully(editor, currentParent, parentPath);
    }
  };

  const deleteItem = () => {
    if (!itemPath || !canDelete) return;

    editor.tf.withoutNormalizing(() => {
      editor.tf.removeNodes({ at: itemPath });
      forceUpdateSiblings();
    });
  };

  return (
    <ToolbarButton
      disabled={!canDelete}
      onClick={deleteItem}
      size="sm"
      tooltip={canDelete ? "Delete Item" : "Keep at least one item"}
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="size-4" />
    </ToolbarButton>
  );
}
