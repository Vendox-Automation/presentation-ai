import {
  KEYS,
  nanoid,
  NodeApi,
  PathApi,
  type NodeEntry,
  type TElement,
} from "platejs";
import { createTPlatePlugin, type PlateEditor } from "platejs/react";

import { BULLET_ITEM, COLUMN_GROUP, PARENT_CHILD_RELATIONSHIP } from "../lib";

const CUSTOM_ITEM_TYPES = new Set<string>(
  Object.entries(PARENT_CHILD_RELATIONSHIP).flatMap(
    ([parentType, { child }]) =>
      parentType === COLUMN_GROUP ? [] : Array.isArray(child) ? child : [child],
  ),
);

function isElementNode(node: unknown): node is TElement {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    "children" in node
  );
}

function isCustomItemElement(node: unknown): node is TElement {
  return isElementNode(node) && CUSTOM_ITEM_TYPES.has(node.type);
}

function isParentForItem(parent: TElement, itemType: string): boolean {
  const relationship =
    PARENT_CHILD_RELATIONSHIP[
      parent.type as keyof typeof PARENT_CHILD_RELATIONSHIP
    ];

  if (!relationship || parent.type === COLUMN_GROUP) return false;

  return Array.isArray(relationship.child)
    ? relationship.child.includes(itemType as never)
    : relationship.child === itemType;
}

function getActiveCustomItemEntry(
  editor: PlateEditor,
): NodeEntry<TElement> | null {
  const blockEntry = editor.api.block();
  if (!blockEntry) return null;

  const [block, blockPath] = blockEntry;

  if (isCustomItemElement(block)) {
    return [block, blockPath];
  }

  const itemEntry = editor.api.above({
    at: blockPath,
    match: (node) => isCustomItemElement(node),
  }) as NodeEntry<TElement> | undefined;

  return itemEntry ?? null;
}

function createBlankItemFrom(item: TElement): TElement {
  const itemRecord = item as TElement & Record<string, unknown>;
  const alignment =
    typeof itemRecord.alignment === "string"
      ? { alignment: itemRecord.alignment }
      : {};

  if (item.type === BULLET_ITEM) {
    return {
      ...alignment,
      forceFullWidth: true,
      id: nanoid(),
      type: item.type,
      children: [{ text: "" }],
    };
  }

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

function insertCustomItemOrExit(editor: PlateEditor, reverse = false): void {
  const itemEntry = getActiveCustomItemEntry(editor);

  if (!itemEntry) {
    editor.tf.insertExitBreak({ reverse });
    return;
  }

  const [item, itemPath] = itemEntry;
  const parentPath = PathApi.parent(itemPath);
  const parent = NodeApi.get(editor, parentPath);

  if (!isElementNode(parent) || !isParentForItem(parent, item.type)) {
    editor.tf.insertExitBreak({ reverse });
    return;
  }

  const insertionPath = reverse ? itemPath : PathApi.next(itemPath);
  editor.tf.insertNodes(createBlankItemFrom(item), {
    at: insertionPath,
    select: true,
  });
}

export const CustomItemBreakPlugin = createTPlatePlugin({
  key: "presentation-custom-item-break",
  shortcuts: {
    insert: {
      keys: "mod+shift+enter",
      handler: ({ editor }) => {
        insertCustomItemOrExit(editor);
      },
    },
  },
  handlers: {
    onKeyDown: ({ editor, event }) => {
      if (
        event.defaultPrevented ||
        event.key !== "Enter" ||
        event.altKey ||
        !event.shiftKey ||
        (!event.ctrlKey && !event.metaKey)
      ) {
        return;
      }

      const itemEntry = getActiveCustomItemEntry(editor);
      if (!itemEntry) return;

      const [item, itemPath] = itemEntry;
      const parentPath = PathApi.parent(itemPath);
      const parent = NodeApi.get(editor, parentPath);

      if (!isElementNode(parent) || !isParentForItem(parent, item.type)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      insertCustomItemOrExit(editor);

      return true;
    },
  },
});
