import {
  DndPlugin,
  type DragItemNode,
  type ElementDragItemNode,
} from "@platejs/dnd";
import { type TElement } from "platejs";
import { type PlateEditor } from "platejs/react";
import React from "react";
import {
  useDrag,
  type ConnectDragPreview,
  type ConnectDragSource,
  type DragSourceHookSpec,
} from "react-dnd";

import { dropNodeAtFreeformTarget } from "../transforms/onDropNode";
import { startFreeformDrag, stopFreeformDrag } from "../utils/freeformDrop";

export interface UseDragNodeOptions extends DragSourceHookSpec<
  DragItemNode,
  unknown,
  { isDragging: boolean }
> {
  disableFreeformDrag?: boolean;
  element: TElement;
}

function isElementDragItem(
  dragItem: DragItemNode | undefined,
): dragItem is ElementDragItemNode {
  return Boolean(dragItem && "id" in dragItem && "element" in dragItem);
}

/**
 * `useDrag` hook to drag a node from the editor. `item` with `id` is required.
 *
 * On drag start:
 * - Set `isDragging` to true
 * - Add `dragging` class to `body`
 *
 * On drag end:
 * - Set `isDragging` to false
 * - Remove `dragging` class from `body`
 */
export const useDragNode = (
  editor: PlateEditor,
  {
    disableFreeformDrag = false,
    element: staleElement,
    item,
    ...options
  }: UseDragNodeOptions,
): [
  { isAboutToDrag: boolean; isDragging: boolean },
  ConnectDragSource,
  ConnectDragPreview,
] => {
  const elementId = staleElement.id as string;
  const [isAboutToDrag, setIsAboutToDrag] = React.useState(false);

  const [collected, dragRef, preview] = useDrag<
    DragItemNode,
    unknown,
    { isDragging: boolean }
  >(
    () => ({
      canDrag: () => {
        setIsAboutToDrag(true);
        return true;
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      end: (dragItem, monitor) => {
        if (
          !disableFreeformDrag &&
          !monitor.didDrop() &&
          isElementDragItem(dragItem)
        ) {
          dropNodeAtFreeformTarget(editor, dragItem);
        }

        stopFreeformDrag(editor);
        editor.setOption(DndPlugin, "isDragging", false);
        document.body.classList.remove("dragging");
        setIsAboutToDrag(false);
      },
      item(monitor) {
        editor.setOption(DndPlugin, "isDragging", true);
        editor.setOption(DndPlugin, "_isOver", true);
        document.body.classList.add("dragging");

        // Check if multiple nodes are selected
        const currentDraggingId = editor.getOption(DndPlugin, "draggingId");
        let id: string[] | string;

        if (
          Array.isArray(currentDraggingId) &&
          currentDraggingId.length > 1 &&
          currentDraggingId.includes(elementId)
        ) {
          // Multiple selection including current element
          id = Array.from(currentDraggingId);
        } else {
          // Single element drag
          id = elementId;
          editor.setOption(DndPlugin, "draggingId", elementId);
        }

        // Get the fresh element from the editor, or fall back to the stale element
        // This handles external/synthetic elements (like RootImage) that don't exist in the editor
        const nodeEntry = editor.api.node({ id: elementId, at: [] });
        const element =
          (nodeEntry?.[0] as TElement | undefined) ?? staleElement;

        const optionItem = typeof item === "function" ? item(monitor) : item;
        const extraItem =
          optionItem && typeof optionItem === "object" ? optionItem : {};
        const dragNodeItem: ElementDragItemNode = {
          ...extraItem,
          id,
          editorId: editor.id,
          element,
        };

        if (!disableFreeformDrag) {
          startFreeformDrag(editor, dragNodeItem);
        }

        return dragNodeItem;
      },
      ...options,
    }),
    [disableFreeformDrag, editor, elementId],
  );

  // Reset isAboutToDrag when drag is cancelled (e.g., ESC key)
  React.useEffect(() => {
    if (!collected.isDragging && isAboutToDrag) {
      setIsAboutToDrag(false);
    }
  }, [collected.isDragging, isAboutToDrag]);

  return [{ ...collected, isAboutToDrag }, dragRef, preview];
};
