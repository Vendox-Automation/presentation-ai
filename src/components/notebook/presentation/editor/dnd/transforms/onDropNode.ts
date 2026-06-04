import { type ElementDragItemNode } from "@platejs/dnd";
import { insertColumnGroup } from "@platejs/layout";
import { NodeApi, PathApi, type Path, type TElement } from "platejs";
import { type PlateEditor } from "platejs/react";
import { type DropTargetMonitor } from "react-dnd";

import { usePresentationState } from "@/states/presentation-state";
import { COLUMN_GROUP, COLUMN_ITEM } from "../../lib";
import {
  clonePaletteDropElements,
  getElementId,
  getPaletteDragItemKey,
  getPaletteDragSource,
  getPaletteMutableSignature,
} from "../../utils/paletteDrop";
import { type UseDropNodeOptions } from "../hooks";
import {
  getActiveFreeformDropTarget,
  syncFreeformDropTargetFromClientOffset,
} from "../utils/freeformDrop";
import {
  canDropAtPath,
  getDropPath,
  type DropPathResult,
} from "../utils/getDropPath";
import { getHoverDirection } from "../utils/getHoverDirection";
import {
  updateDroppedElementAfterDrop,
  updateSiblingsAfterDropById,
} from "../utils/updateSiblingsForcefully";

/**
 * Handle the drop of a node.
 *
 * @param canCreateColumns - If true and direction is left/right, create column layout.
 *                           If false, left/right drops just reorder.
 */
export const onDropNode = (
  editor: PlateEditor,
  {
    canDropNode,
    canCreateColumns = false,
    dragItem,
    element,
    monitor,
    nodeRef,
  }: {
    dragItem: ElementDragItemNode;
    monitor: DropTargetMonitor;
    canCreateColumns?: boolean;
  } & Pick<UseDropNodeOptions, "canDropNode" | "element" | "nodeRef">,
) => {
  const freeformTarget = syncFreeformDropTargetFromClientOffset(
    editor,
    dragItem,
    monitor.getClientOffset(),
  );
  let result =
    freeformTarget?.dropPath ??
    getDropPath(editor, {
      canDropNode,
      canCreateColumns,
      dragItem,
      element,
      monitor,
      nodeRef,
    });

  // If getDropPath returns null, try bubble-up for root elements over nested content
  if (!result) {
    const direction = getHoverDirection({
      dragItem,
      element,
      monitor,
      nodeRef,
    });

    // Only handle left/right for root element drops
    if (direction === "left" || direction === "right") {
      const dragPath = dragItem.element
        ? editor.api.findPath(dragItem.element)
        : undefined;

      // If dragging a root-level element
      if (dragPath && dragPath.length === 1) {
        const hoveredPath = editor.api.findPath(element);

        // If hovering over a nested element
        if (hoveredPath && hoveredPath.length > 1) {
          // Find the root-level parent element
          const rootPath: Path = [hoveredPath[0] as number];
          const rootElement = NodeApi.get(editor, rootPath) as
            | TElement
            | undefined;

          if (
            rootElement &&
            rootElement.id !== (dragItem.element?.id as string)
          ) {
            // Re-call getDropPath with the root element
            result = getDropPath(editor, {
              canDropNode: undefined, // Skip canDropNode check for bubbled drops
              canCreateColumns: true, // Root elements can create columns
              dragItem,
              element: rootElement,
              monitor,
              nodeRef: { current: editor.api.toDOMNode(rootElement) },
            });

            // If still no result, create a synthetic result for column creation
            if (!result) {
              result = {
                direction,
                dragPath,
                hoveredPath: rootPath,
                to: rootPath,
                isExternalNode: false,
                createColumns: true,
              };
            }
          }
        }
      }
    }

    if (!result) return;
  }

  applyDropPathResult(editor, { dragItem, result });
};

export const dropNodeAtFreeformTarget = (
  editor: PlateEditor,
  dragItem: ElementDragItemNode,
): boolean => {
  const target = getActiveFreeformDropTarget(editor);

  if (!target) return false;

  applyDropPathResult(editor, {
    dragItem,
    result: target.dropPath,
  });

  return true;
};

export const applyDropPathResult = (
  editor: PlateEditor,
  {
    dragItem,
    result,
  }: {
    dragItem: ElementDragItemNode;
    result: DropPathResult;
  },
): void => {
  const {
    direction,
    dragPath,
    to,
    hoveredPath,
    isExternalNode,
    createColumns,
    isNoop,
  } = result;

  if (isNoop) return;

  if (!canDropAtPath(editor, dragItem, result)) return;

  const draggedIds = Array.isArray(dragItem.id) ? dragItem.id : [dragItem.id];
  const draggedElementIds = draggedIds.filter(
    (id): id is string => typeof id === "string",
  );
  const trackPaletteDrop = (insertedElementId: string | null) => {
    const source = getPaletteDragSource(dragItem);

    if (!source || !insertedElementId) return;

    const insertedEntry = editor.api.node({ id: insertedElementId, at: [] });
    const [insertedElement] = insertedEntry ?? [];

    usePresentationState.getState().setPaletteDropTarget({
      editorId: editor.id,
      elementId: insertedElementId,
      itemKey: getPaletteDragItemKey(dragItem),
      source,
      mutableSignature: insertedElement
        ? getPaletteMutableSignature(insertedElement)
        : undefined,
    });
  };

  // Handle column creation (only when canCreateColumns=true AND direction is left/right)
  if (createColumns && (direction === "left" || direction === "right")) {
    if (!hoveredPath) return;

    const existingColumnItemPath = getContainingColumnItemPath(
      editor,
      hoveredPath,
    );

    if (existingColumnItemPath) {
      const columnGroupPath = PathApi.parent(existingColumnItemPath);
      const targetColumnIndex = existingColumnItemPath.at(-1);
      const columnGroup = NodeApi.get(editor, columnGroupPath) as
        | TElement
        | undefined;

      if (
        typeof targetColumnIndex !== "number" ||
        !isElementNode(columnGroup)
      ) {
        return;
      }

      const newColumnIndex =
        direction === "left" ? targetColumnIndex : targetColumnIndex + 1;
      const newColumnPath = [...columnGroupPath, newColumnIndex];
      const draggedElementIdSet = new Set(draggedElementIds);
      const currentWidths = getColumnWidths(columnGroup);
      const targetWidth =
        currentWidths[targetColumnIndex] ?? 100 / currentWidths.length;
      const newColumnWidth = roundWidth(targetWidth / 2);
      const targetColumnWidth = roundWidth(targetWidth - newColumnWidth);
      const finalWidths = [...currentWidths];

      finalWidths[targetColumnIndex] = targetColumnWidth;
      finalWidths.splice(newColumnIndex, 0, newColumnWidth);

      editor.tf.withoutNormalizing(() => {
        editor.tf.insertNodes(
          {
            type: COLUMN_ITEM,
            width: newColumnWidth,
            children: [],
          },
          { at: newColumnPath },
        );

        finalWidths.forEach((width, index) => {
          editor.tf.setNodes({ width }, { at: [...columnGroupPath, index] });
        });

        if (
          isExternalNode &&
          dragItem.element &&
          typeof dragItem.element === "object"
        ) {
          const elements = clonePaletteDropElements(dragItem.element);

          elements.forEach((elem, index) => {
            editor.tf.insertNodes(elem, {
              at: [...newColumnPath, index],
            });
          });
          trackPaletteDrop(getElementId(elements[0]));
        } else {
          editor.tf.moveNodes({
            at: [],
            to: [...newColumnPath, 0],
            match: (n) => draggedElementIdSet.has(n.id as string),
          });
        }

        draggedElementIdSet.forEach((id) => {
          updateSiblingsAfterDropById(editor, id);
        });
      });

      return;
    }

    const targetElementId = (
      NodeApi.get(editor, hoveredPath) as TElement | undefined
    )?.id as string | undefined;

    if (!targetElementId) return;

    const draggedElementIdSet = new Set(draggedElementIds);

    // Create a column group with 2 columns at the hovered position
    insertColumnGroup(editor, {
      columns: 2,
      at: hoveredPath,
    });

    const columnGroupPath = hoveredPath;
    const firstColumnPath = [...columnGroupPath, 0];
    const secondColumnPath = [...columnGroupPath, 1];

    // Determine which column gets which content based on direction
    const targetColumnPath =
      direction === "left" ? secondColumnPath : firstColumnPath;
    const draggedColumnPath =
      direction === "left" ? firstColumnPath : secondColumnPath;

    editor.tf.withoutNormalizing(() => {
      editor.tf.setNodes({ width: 50 }, { at: firstColumnPath });
      editor.tf.setNodes({ width: 50 }, { at: secondColumnPath });

      // Move the target element into its column
      editor.tf.moveNodes({
        at: [],
        to: [...targetColumnPath, 0],
        match: (n) => n.id === targetElementId,
      });

      if (
        isExternalNode &&
        dragItem.element &&
        typeof dragItem.element === "object"
      ) {
        const elements = clonePaletteDropElements(dragItem.element);

        elements.forEach((elem, index) => {
          editor.tf.insertNodes(elem, {
            at: [...draggedColumnPath, index],
          });
        });
        trackPaletteDrop(getElementId(elements[0]));
      } else {
        // Move all dragged nodes into the dragged column
        const nodesToMove: TElement[] = [];
        draggedElementIdSet.forEach((id) => {
          const entry = editor.api.node({ id, at: [] });
          if (entry) {
            nodesToMove.push(entry[0] as TElement);
          }
        });

        if (nodesToMove.length > 0) {
          editor.tf.moveNodes({
            at: [],
            to: [...draggedColumnPath, 0],
            match: (n) => draggedElementIdSet.has(n.id as string),
          });
        }
      }

      // Resolve by id after the move. Adjacent same-parent moves can make the
      // requested target path stale once Slate applies path transforms.
      draggedElementIdSet.forEach((id) => {
        updateSiblingsAfterDropById(editor, id);
      });
    });

    return;
  }

  // Handle reordering (all other cases: top/bottom or left/right without column creation)
  if (!to) return;

  if (draggedIds.length > 1) {
    // Handle multi-node drop
    const draggedElementIdSet = new Set(draggedElementIds);
    const draggedPathRefs = draggedElementIds.flatMap((id) => {
      const entry = editor.api.node({ id, at: [] });

      return entry ? [editor.api.pathRef(entry[1])] : [];
    });

    editor.tf.moveNodes({
      at: [],
      to,
      match: (n) => draggedElementIdSet.has(n.id as string),
    });

    draggedPathRefs.forEach((pathRef, index) => {
      const droppedPath = pathRef.unref();

      if (droppedPath) {
        updateDroppedElementAfterDrop(editor, droppedPath);
      }

      const droppedElementId = draggedElementIds[index];
      if (droppedElementId) {
        updateSiblingsAfterDropById(editor, droppedElementId);
      }
    });
  } else if (
    isExternalNode &&
    dragItem.element &&
    typeof dragItem.element === "object"
  ) {
    // External node - insert at position
    const elements = clonePaletteDropElements(dragItem.element);
    const firstElement = elements[0];

    if (!firstElement) return;

    editor.tf.insertNodes(elements.length === 1 ? firstElement : elements, {
      at: to,
    });
    trackPaletteDrop(getElementId(firstElement));

    const insertionIndex = to.at(-1);
    if (typeof insertionIndex === "number") {
      elements.forEach((_, index) => {
        updateDroppedElementAfterDrop(editor, [
          ...to.slice(0, -1),
          insertionIndex + index,
        ]);
      });
    }
  } else if (dragPath) {
    const droppedPathRef = editor.api.pathRef(dragPath);

    // Single node drop - standard move
    editor.tf.moveNodes({
      at: dragPath,
      to,
    });

    const droppedPath = droppedPathRef.unref();
    const droppedElementId = draggedElementIds[0];

    if (droppedPath) {
      updateDroppedElementAfterDrop(editor, droppedPath);
    }

    if (droppedElementId) {
      updateSiblingsAfterDropById(editor, droppedElementId);
    }
  }
};

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

function isElementNode(node: unknown): node is TElement {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    "children" in node
  );
}

function getColumnWidths(columnGroup: TElement): number[] {
  const columns = columnGroup.children.filter(
    (child): child is TElement =>
      isElementNode(child) && child.type === COLUMN_ITEM,
  );
  const fallbackWidth = 100 / Math.max(columns.length, 1);

  return columns.map(
    (column) => parseColumnWidth(column.width) ?? fallbackWidth,
  );
}

function parseColumnWidth(width: unknown): number | null {
  if (width === undefined || width === null) return null;

  const parsed = Number.parseFloat(String(width));

  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return parsed;
}

function roundWidth(width: number): number {
  return Math.round(width * 100) / 100;
}
