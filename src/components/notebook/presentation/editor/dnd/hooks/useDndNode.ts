/** biome-ignore-all lint/suspicious/noExplicitAny: This use requires any */
import { DRAG_ITEM_BLOCK, type DragItemNode } from "@platejs/dnd";
import { useEditorRef, type PlateEditor } from "platejs/react";
import React, { type RefObject } from "react";
import { type ConnectDragSource, type DropTargetMonitor } from "react-dnd";
import { getEmptyImage, NativeTypes } from "react-dnd-html5-backend";

import {
  registerFreeformDropNode,
  type DropOrientation,
} from "../utils/freeformDrop";
import { useDragNode, type UseDragNodeOptions } from "./useDragNode";
import { useDropNode, type UseDropNodeOptions } from "./useDropNode";

export type UseDndNodeOptions = Pick<UseDropNodeOptions, "element"> &
  Partial<
    Pick<
      UseDropNodeOptions,
      "canDropNode" | "multiplePreviewRef" | "nodeRef" | "canCreateColumns"
    >
  > &
  Partial<Pick<UseDragNodeOptions, "type">> & {
    /** Options passed to the drag hook. */
    drag?: Partial<Omit<UseDragNodeOptions, "type">>;
    /** Options passed to the drop hook, excluding element, nodeRef. */
    drop?: Partial<
      Omit<UseDropNodeOptions, "canDropNode" | "element" | "nodeRef">
    >;
    preview?: {
      /** Whether to disable the preview. */
      disable?: boolean;
      /** The reference to the preview element. */
      ref?: any;
    };
    orientation?: DropOrientation;
    onDropHandler?: (
      editor: PlateEditor,
      props: {
        id: string;
        dragItem: DragItemNode;
        monitor: DropTargetMonitor<DragItemNode, unknown>;
        nodeRef: any;
      },
    ) => boolean | undefined;
  };

/**
 * {@link useDragNode} and {@link useDropNode} hooks to drag and drop a node from
 * the editor. A default preview is used to show the node being dragged, which
 * can be customized or removed.
 *
 * @param canCreateColumns - If true, left/right drops create columns. If false, they reorder.
 */
export const useDndNode = ({
  canDropNode,
  canCreateColumns = false,
  drag: dragOptions,
  drop: dropOptions,
  element,
  multiplePreviewRef,
  nodeRef,
  orientation = "vertical",
  preview: previewOptions = {},
  type = DRAG_ITEM_BLOCK,
  onDropHandler,
}: UseDndNodeOptions): {
  dragRef: ConnectDragSource;
  isAboutToDrag: boolean;
  isDragging: boolean;
  isOver: boolean;
} => {
  const editor = useEditorRef();

  const [{ isAboutToDrag, isDragging }, dragRef, preview] = useDragNode(
    editor,
    {
      element,
      type,
      ...dragOptions,
    },
  );

  const [{ isOver }, drop] = useDropNode(editor, {
    accept: [type, NativeTypes.FILE],
    canDropNode,
    canCreateColumns,
    element,
    multiplePreviewRef,
    nodeRef,
    onDropHandler,
    ...dropOptions,
  });

  // Always use nodeRef for the drop target (actual DOM element)
  drop(nodeRef);

  React.useEffect(() => {
    if (!nodeRef || !element.id) return;

    return registerFreeformDropNode(editor, {
      canCreateColumns,
      canDropNode,
      element,
      id: element.id as string,
      nodeRef: nodeRef as RefObject<HTMLElement | null>,
      orientation,
    });
  }, [canCreateColumns, canDropNode, editor, element, nodeRef, orientation]);

  // Handle preview based on options and whether we're dragging multiple nodes
  if (previewOptions.disable) {
    preview(getEmptyImage(), { captureDraggingState: true });
  } else if (previewOptions.ref) {
    preview(previewOptions.ref);
  } else {
    preview(multiplePreviewRef);
  }

  return {
    dragRef,
    isAboutToDrag,
    isDragging,
    isOver,
  };
};
