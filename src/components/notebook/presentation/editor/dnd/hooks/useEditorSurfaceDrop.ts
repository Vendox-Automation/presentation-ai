import {
  DndPlugin,
  DRAG_ITEM_BLOCK,
  type DragItemNode,
  type DropLineDirection,
  type ElementDragItemNode,
} from "@platejs/dnd";
import { PathApi, type Path, type TElement } from "platejs";
import { type PlateEditor } from "platejs/react";
import React from "react";
import { useDrop, type DropTargetMonitor } from "react-dnd";

import { applyDropPathResult } from "../transforms/onDropNode";
import { canDropAtPath, type DropPathResult } from "../utils/getDropPath";

type EditorSurfacePlacement = "top" | "bottom";

type EditorElementDragItem = DragItemNode & {
  element: TElement;
  id: string | string[];
};

type EditorSurfaceDropResult = {
  droppedOnEditorSurface: true;
};

type SurfaceDropTarget = {
  id: string;
  line: DropLineDirection;
};

function isEditorElementDragItem(
  dragItem: DragItemNode | undefined,
): dragItem is EditorElementDragItem {
  return Boolean(
    dragItem &&
    "id" in dragItem &&
    "element" in dragItem &&
    typeof dragItem.element === "object" &&
    dragItem.element !== null,
  );
}

function getDragIds(dragItem: EditorElementDragItem): string[] {
  return Array.isArray(dragItem.id) ? dragItem.id : [dragItem.id];
}

function getPrimaryDragPath(
  editor: PlateEditor,
  dragItem: EditorElementDragItem,
): Path | undefined {
  const primaryDragId = getDragIds(dragItem).find(
    (id) => typeof id === "string",
  );

  if (!primaryDragId) return undefined;

  const entry = editor.api.node({ id: primaryDragId, at: [] });

  return entry?.[1];
}

function toElementDragItemNode(
  editor: PlateEditor,
  dragItem: EditorElementDragItem,
): ElementDragItemNode {
  return "editorId" in dragItem
    ? dragItem
    : {
        ...dragItem,
        editorId: editor.id,
      };
}

function getEditorSurfacePlacement(
  root: HTMLElement | null,
  monitor: DropTargetMonitor<DragItemNode, unknown>,
): EditorSurfacePlacement | undefined {
  const clientOffset = monitor.getClientOffset();

  if (!root || !clientOffset) return undefined;

  const rect = root.getBoundingClientRect();

  return clientOffset.y < rect.top + rect.height / 2 ? "top" : "bottom";
}

function getEditorEdgeDropPathResult(
  editor: PlateEditor,
  dragItem: EditorElementDragItem,
  placement: EditorSurfacePlacement,
): DropPathResult | undefined {
  const childCount = editor.children.length;
  const dragPath = getPrimaryDragPath(editor, dragItem);

  if (childCount === 0) {
    return {
      createColumns: false,
      direction: placement,
      dragPath,
      hoveredPath: [0],
      isExternalNode: !dragPath,
      to: [0],
    };
  }

  if (placement === "top") {
    const firstPath: Path = [0];

    if (dragPath && PathApi.equals(dragPath, firstPath)) return undefined;

    return {
      createColumns: false,
      direction: "top",
      dragPath,
      hoveredPath: firstPath,
      isExternalNode: !dragPath,
      to: firstPath,
    };
  }

  const lastPath: Path = [childCount - 1];

  if (dragPath && PathApi.equals(dragPath, lastPath)) return undefined;

  const to =
    dragPath &&
    PathApi.isBefore(dragPath, lastPath) &&
    PathApi.isSibling(dragPath, lastPath)
      ? lastPath
      : PathApi.next(lastPath);

  return {
    createColumns: false,
    direction: "bottom",
    dragPath,
    hoveredPath: lastPath,
    isExternalNode: !dragPath,
    to,
  };
}

function getSurfaceDropTarget(
  editor: PlateEditor,
  placement: EditorSurfacePlacement,
): SurfaceDropTarget | null {
  const childCount = editor.children.length;

  if (childCount === 0) return null;

  const targetPath: Path = placement === "top" ? [0] : [childCount - 1];
  const target = editor.api.node({ at: targetPath })?.[0];
  const targetId =
    typeof target === "object" &&
    target !== null &&
    "id" in target &&
    typeof target.id === "string"
      ? target.id
      : undefined;

  if (!targetId) return null;

  return {
    id: targetId,
    line: placement,
  };
}

function useSurfaceDropTargetState(editor: PlateEditor) {
  const activeSurfaceTargetRef = React.useRef<SurfaceDropTarget | null>(null);

  const clearSurfaceDropTarget = React.useCallback(() => {
    const activeTarget = activeSurfaceTargetRef.current;

    if (!activeTarget) return;

    const current = editor.getOptions(DndPlugin).dropTarget;

    if (
      current?.id === activeTarget.id &&
      current?.line === activeTarget.line
    ) {
      editor.setOption(DndPlugin, "dropTarget", { id: null, line: "" });
    }

    activeSurfaceTargetRef.current = null;
  }, [editor]);

  const setSurfaceDropTarget = React.useCallback(
    (target: SurfaceDropTarget | null) => {
      if (!target) {
        clearSurfaceDropTarget();
        return;
      }

      const current = editor.getOptions(DndPlugin).dropTarget;

      activeSurfaceTargetRef.current = target;

      if (current?.id === target.id && current?.line === target.line) {
        return;
      }

      editor.setOption(DndPlugin, "dropTarget", target);
    },
    [clearSurfaceDropTarget, editor],
  );

  return {
    clearSurfaceDropTarget,
    setSurfaceDropTarget,
  };
}

export function useEditorSurfaceDrop({
  disabled,
  editor,
}: {
  disabled: boolean;
  editor: PlateEditor;
}): {
  isEditorSurfaceDropActive: boolean;
  setEditorSurfaceDropRef: React.RefCallback<HTMLDivElement>;
} {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const { clearSurfaceDropTarget, setSurfaceDropTarget } =
    useSurfaceDropTargetState(editor);

  const [{ canDrop, isOver }, drop] = useDrop<
    DragItemNode,
    EditorSurfaceDropResult | undefined,
    { canDrop: boolean; isOver: boolean }
  >(
    () => ({
      accept: [DRAG_ITEM_BLOCK],
      canDrop: (dragItem) => !disabled && isEditorElementDragItem(dragItem),
      collect: (monitor) => ({
        canDrop: monitor.canDrop(),
        isOver: monitor.isOver({ shallow: true }),
      }),
      drop: (dragItem, monitor) => {
        if (
          monitor.didDrop() ||
          disabled ||
          !isEditorElementDragItem(dragItem)
        ) {
          return undefined;
        }

        const placement = getEditorSurfacePlacement(rootRef.current, monitor);

        if (!placement) return undefined;

        const result = getEditorEdgeDropPathResult(editor, dragItem, placement);

        if (!result || !canDropAtPath(editor, dragItem, result)) {
          return undefined;
        }

        applyDropPathResult(editor, {
          dragItem: toElementDragItemNode(editor, dragItem),
          result,
        });
        clearSurfaceDropTarget();

        return { droppedOnEditorSurface: true };
      },
      hover: (dragItem, monitor) => {
        if (
          disabled ||
          !monitor.isOver({ shallow: true }) ||
          !isEditorElementDragItem(dragItem)
        ) {
          return;
        }

        const placement = getEditorSurfacePlacement(rootRef.current, monitor);

        if (!placement) {
          clearSurfaceDropTarget();
          return;
        }

        setSurfaceDropTarget(getSurfaceDropTarget(editor, placement));
      },
    }),
    [clearSurfaceDropTarget, disabled, editor, setSurfaceDropTarget],
  );

  React.useEffect(() => {
    if (!isOver || !canDrop) {
      clearSurfaceDropTarget();
    }
  }, [canDrop, clearSurfaceDropTarget, isOver]);

  React.useEffect(() => clearSurfaceDropTarget, [clearSurfaceDropTarget]);

  const setEditorSurfaceDropRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      drop(node);
    },
    [drop],
  );

  return {
    isEditorSurfaceDropActive: isOver && canDrop,
    setEditorSurfaceDropRef,
  };
}
