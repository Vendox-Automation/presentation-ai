import { type DragItemNode, type DropDirection } from "@platejs/dnd";
import {
  NodeApi,
  PathApi,
  type NodeEntry,
  type Path,
  type TElement,
} from "platejs";
import { type PlateEditor } from "platejs/react";
import { type DropTargetMonitor } from "react-dnd";

import {
  canLayoutChildTypeBePlacedInParent,
  CIRCULAR_GRID_GROUP,
  CIRCULAR_GRID_ITEM,
  CIRCULAR_GRID_MAX_ITEMS,
  COLUMN_GROUP,
  COLUMN_ITEM,
  getLayoutParentTypes,
  isLayoutChildType,
  isLayoutParentType,
} from "../../lib";
import { type UseDropNodeOptions } from "../hooks";
import { getHoverDirection } from "./getHoverDirection";

type ResolvedDropDirection = Exclude<DropDirection, undefined>;

export type DropPathResult = {
  createColumns: boolean;
  direction: ResolvedDropDirection;
  dragPath: Path | undefined;
  hoveredPath: Path;
  isExternalNode: boolean;
  isNoop?: boolean;
  to: Path;
};

/**
 * Get the drop path for a drag and drop operation.
 *
 * @param canCreateColumns - If true, left/right returns path for column creation.
 *                           If false, left/right is treated as reorder (like top/bottom).
 */
export const getDropPath = (
  editor: PlateEditor,
  {
    canDropNode,
    canCreateColumns = false,
    dragItem,
    element,
    monitor,
    nodeRef,
  }: {
    dragItem: DragItemNode;
    monitor: DropTargetMonitor;
    canCreateColumns?: boolean;
  } & Pick<UseDropNodeOptions, "canDropNode" | "element" | "nodeRef">,
) => {
  const direction = getHoverDirection({
    dragItem,
    element,
    monitor,
    nodeRef,
  });

  if (!direction) return;

  return getDropPathFromDirection(editor, {
    canDropNode,
    canCreateColumns,
    direction,
    dragItem,
    element,
  });
};

export const getDropPathFromDirection = (
  editor: PlateEditor,
  {
    canDropNode,
    canCreateColumns = false,
    direction,
    dragItem,
    element,
  }: {
    direction: ResolvedDropDirection;
    dragItem: DragItemNode;
    canCreateColumns?: boolean;
  } & Pick<UseDropNodeOptions, "canDropNode" | "element">,
): DropPathResult | undefined => {
  let dragEntry: NodeEntry<TElement> | undefined;
  let dropEntry: NodeEntry<TElement> | undefined;

  if ("element" in dragItem) {
    const dragPath = editor.api.findPath(dragItem.element);
    const hoveredPath = editor.api.findPath(element);

    if (!hoveredPath) return;

    // If dragPath is found, we're moving an existing node
    // If not, we're inserting a new node (e.g., from external source)
    if (dragPath) {
      dragEntry = [dragItem.element, dragPath];
    }

    dropEntry = [element, hoveredPath];
  } else {
    dropEntry = editor.api.node({
      id: element.id as string,
      at: [],
    }) as NodeEntry<TElement> | undefined;
  }

  if (!dropEntry) return;

  // Only check canDropNode if we have a dragEntry (for existing nodes)
  if (
    canDropNode &&
    dragEntry &&
    !canDropNode({ dragEntry, dragItem, dropEntry, editor })
  ) {
    return;
  }

  const dragPath = dragEntry?.[1];
  const hoveredPath = dropEntry[1];

  if (dragPath && PathApi.equals(dragPath, hoveredPath)) {
    return {
      createColumns: false,
      direction,
      dragPath,
      hoveredPath,
      isExternalNode: false,
      isNoop: true,
      to: dragPath,
    };
  }

  const insideContainerPath = getInsideContainerPath({
    dragPath,
    dragType: getDraggedElementTypes(editor, dragItem)[0],
    dropElement: dropEntry[0],
    hoveredPath,
  });

  if (insideContainerPath) {
    const insideResult = {
      createColumns: false,
      direction,
      dragPath,
      hoveredPath,
      isExternalNode: !dragPath,
      to: insideContainerPath,
    };

    if (!canDropAtPath(editor, dragItem, insideResult)) return;

    return insideResult;
  }

  // Relationship-backed layout parents only accept their configured child
  // element types. This blocks drops onto an existing child from sneaking
  // unrelated blocks into the parent as siblings.
  const returnIfValid = (result: DropPathResult): DropPathResult | undefined =>
    canDropAtPath(editor, dragItem, result) ? result : undefined;

  // Handle left/right directions
  if (direction === "left" || direction === "right") {
    const draggedTypes = getDraggedElementTypes(editor, dragItem);
    const canCreateColumnSibling =
      draggedTypes.length > 0 &&
      draggedTypes.every(
        (dragType) =>
          !isLayoutChildType(dragType) && !isLayoutParentType(dragType),
      );
    const containingColumnItemPath = getContainingColumnItemPath(
      editor,
      hoveredPath,
    );

    if (containingColumnItemPath && canCreateColumnSibling) {
      return returnIfValid({
        direction,
        dragPath,
        hoveredPath,
        to: containingColumnItemPath,
        isExternalNode: !dragPath,
        createColumns: true,
      });
    }

    // If canCreateColumns is true, return for column creation (handled by onDropNode)
    if (canCreateColumns) {
      return returnIfValid({
        direction,
        dragPath,
        hoveredPath,
        to: hoveredPath,
        isExternalNode: !dragPath,
        createColumns: true,
      });
    }

    // Otherwise, treat left/right like top/bottom (reorder)
    // Left = before (like top), Right = after (like bottom)
    let dropPath: Path | undefined;

    if (direction === "right") {
      // Insert after hovered node (like bottom)
      dropPath = hoveredPath;
      if (dragPath && PathApi.equals(dragPath, PathApi.next(dropPath))) {
        return {
          createColumns: false,
          direction,
          dragPath,
          hoveredPath,
          isExternalNode: false,
          isNoop: true,
          to: dragPath,
        };
      }
    }

    if (direction === "left") {
      // Insert before hovered node (like top)
      dropPath = [...hoveredPath.slice(0, -1), hoveredPath.at(-1)! - 1];
      if (dragPath && PathApi.equals(dragPath, dropPath)) {
        return {
          createColumns: false,
          direction,
          dragPath,
          hoveredPath,
          isExternalNode: false,
          isNoop: true,
          to: dragPath,
        };
      }
    }

    if (!dropPath) return;

    const before =
      dragPath &&
      PathApi.isBefore(dragPath, dropPath) &&
      PathApi.isSibling(dragPath, dropPath);
    const to = before ? dropPath : PathApi.next(dropPath);

    return returnIfValid({
      createColumns: false,
      direction,
      dragPath,
      hoveredPath,
      isExternalNode: !dragPath,
      to,
    });
  }

  // Handle top/bottom drops for vertical reordering
  let dropPath: Path | undefined;

  if (direction === "bottom") {
    // Insert after hovered node
    dropPath = hoveredPath;

    // If the dragged node is already right after hovered node, no change
    if (dragPath && PathApi.equals(dragPath, PathApi.next(dropPath))) {
      return {
        createColumns: false,
        direction,
        dragPath,
        hoveredPath,
        isExternalNode: false,
        isNoop: true,
        to: dragPath,
      };
    }
  }

  if (direction === "top") {
    // Insert before hovered node
    dropPath = [...hoveredPath.slice(0, -1), hoveredPath.at(-1)! - 1];

    // If the dragged node is already right before hovered node, no change
    if (dragPath && PathApi.equals(dragPath, dropPath)) {
      return {
        createColumns: false,
        direction,
        dragPath,
        hoveredPath,
        isExternalNode: false,
        isNoop: true,
        to: dragPath,
      };
    }
  }

  if (!dropPath) return;

  const before =
    dragPath &&
    PathApi.isBefore(dragPath, dropPath) &&
    PathApi.isSibling(dragPath, dropPath);
  const to = before ? dropPath : PathApi.next(dropPath);

  return returnIfValid({
    createColumns: false,
    direction,
    dragPath,
    hoveredPath,
    isExternalNode: !dragPath,
    to,
  });
};

export function canDropAtPath(
  editor: PlateEditor,
  dragItem: DragItemNode,
  result: Pick<DropPathResult, "createColumns" | "dragPath" | "to">,
): boolean {
  if (!("element" in dragItem)) return true;

  const draggedTypes = getDraggedElementTypes(editor, dragItem);

  if (draggedTypes.length === 0) return false;

  if (result.createColumns) {
    return draggedTypes.every((dragType) => !isLayoutChildType(dragType));
  }

  const parentType = getParentTypeAtPath(editor, result.to);

  if (
    parentType === CIRCULAR_GRID_GROUP &&
    !canDropIntoCircularGrid(editor, dragItem, result.to)
  ) {
    return false;
  }

  if (parentType && isLayoutParentType(parentType)) {
    return draggedTypes.every((dragType) =>
      canLayoutChildTypeBePlacedInParent(dragType, parentType),
    );
  }

  return draggedTypes.every((dragType) => {
    if (!isLayoutChildType(dragType)) return true;

    return Boolean(
      parentType && getLayoutParentTypes(dragType).includes(parentType),
    );
  });
}

function canDropIntoCircularGrid(
  editor: PlateEditor,
  dragItem: DragItemNode,
  dropPath: Path,
): boolean {
  const parentPath = PathApi.parent(dropPath);
  const parent = NodeApi.get(editor, parentPath);

  if (!isElementNode(parent) || parent.type !== CIRCULAR_GRID_GROUP) {
    return true;
  }

  const draggedEntries = getDraggedElementEntries(editor, dragItem);
  const circularGridItemsToAdd = draggedEntries.filter(
    ([node]) => node.type === CIRCULAR_GRID_ITEM,
  );

  if (circularGridItemsToAdd.length === 0) return true;

  const isSameParentReorder = circularGridItemsToAdd.every(([, path]) =>
    path ? PathApi.equals(PathApi.parent(path), parentPath) : false,
  );

  if (isSameParentReorder) return true;

  const currentCircularGridItems = parent.children.filter(
    (child): child is TElement =>
      isElementNode(child) && child.type === CIRCULAR_GRID_ITEM,
  ).length;

  return (
    currentCircularGridItems + circularGridItemsToAdd.length <=
    CIRCULAR_GRID_MAX_ITEMS
  );
}

function getDraggedElementEntries(
  editor: PlateEditor,
  dragItem: DragItemNode,
): Array<[TElement, Path | undefined]> {
  if (!("element" in dragItem)) return [];

  const draggedIds = getDraggedIds(dragItem);
  const entriesFromIds = draggedIds
    .map(
      (id) =>
        editor.api.node({ id, at: [] }) as NodeEntry<TElement> | undefined,
    )
    .filter((entry): entry is NodeEntry<TElement> =>
      Boolean(entry && isElementNode(entry[0])),
    )
    .map(([node, path]) => [node, path] as [TElement, Path | undefined]);

  if (entriesFromIds.length > 0) return entriesFromIds;

  return getElementEntries(dragItem.element);
}

function getElementEntries(value: unknown): Array<[TElement, undefined]> {
  if (Array.isArray(value)) {
    return value.flatMap(getElementEntries);
  }

  if (!isElementNode(value)) return [];

  return [[value, undefined]];
}

function getDraggedElementTypes(
  editor: PlateEditor,
  dragItem: DragItemNode,
): string[] {
  if (!("element" in dragItem)) return [];

  const draggedIds = getDraggedIds(dragItem);
  const typesFromIds = draggedIds
    .map((id) => editor.api.node({ id, at: [] })?.[0])
    .filter(isElementNode)
    .map((node) => node.type)
    .filter((type): type is string => typeof type === "string");

  if (typesFromIds.length > 0) return typesFromIds;

  return getElementTypes(dragItem.element);
}

function getDraggedIds(dragItem: DragItemNode): string[] {
  if (!("id" in dragItem)) return [];

  return Array.isArray(dragItem.id) ? dragItem.id : [dragItem.id];
}

function getElementTypes(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(getElementTypes);
  }

  if (!isElementNode(value) || typeof value.type !== "string") return [];

  return [value.type];
}

function getParentTypeAtPath(
  editor: PlateEditor,
  path: Path,
): string | undefined {
  if (path.length < 2) return undefined;

  const parent = NodeApi.get(editor, PathApi.parent(path));

  return isElementNode(parent) && typeof parent.type === "string"
    ? parent.type
    : undefined;
}

function getContainingColumnItemPath(
  editor: PlateEditor,
  path: Path,
): Path | undefined {
  let currentPath = path;

  while (currentPath.length > 0) {
    const node = NodeApi.get(editor, currentPath);

    if (isElementNode(node) && node.type === COLUMN_ITEM) {
      const parentPath = PathApi.parent(currentPath);
      const parent = NodeApi.get(editor, parentPath);

      if (isElementNode(parent) && parent.type === COLUMN_GROUP) {
        return currentPath;
      }
    }

    currentPath = PathApi.parent(currentPath);
  }

  return undefined;
}

function getInsideContainerPath({
  dragPath,
  dragType,
  dropElement,
  hoveredPath,
}: {
  dragPath: Path | undefined;
  dragType: string | undefined;
  dropElement: TElement;
  hoveredPath: Path;
}): Path | undefined {
  if (!dragType) return undefined;

  const requiredParentTypes = getRequiredParentTypes(dragType);

  if (
    requiredParentTypes.length === 0 ||
    !requiredParentTypes.includes(dropElement.type)
  ) {
    return undefined;
  }

  const childCount = Array.isArray(dropElement.children)
    ? dropElement.children.length
    : 0;

  if (dragPath && PathApi.equals(PathApi.parent(dragPath), hoveredPath)) {
    return undefined;
  }

  return [...hoveredPath, childCount];
}

function getRequiredParentTypes(childType: string): string[] {
  return [...getLayoutParentTypes(childType)];
}

function isElementNode(node: unknown): node is TElement {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    "children" in node
  );
}
