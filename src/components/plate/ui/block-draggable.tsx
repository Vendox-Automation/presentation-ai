"use client";

import { DndPlugin } from "@platejs/dnd";
import { expandListItemsWithChildren } from "@platejs/list";
import { BlockSelectionPlugin } from "@platejs/selection/react";
import { GripHorizontal, GripVertical } from "lucide-react";
import { motion } from "motion/react";
import {
  getContainerTypes,
  isType,
  KEYS,
  nanoid,
  PathApi,
  type TElement,
} from "platejs";
import {
  MemoizedChildren,
  useEditorRef,
  useEditorSelector,
  useElement,
  useFocused,
  usePath,
  usePluginOption,
  useSelected,
  type PlateEditor,
  type PlateElementProps,
  type RenderNodeWrapper,
} from "platejs/react";
import * as React from "react";

import { useDraggable } from "@/components/notebook/presentation/editor/dnd/hooks/useDraggable";
import { useDropLine } from "@/components/notebook/presentation/editor/dnd/hooks/useDropLine";
import { type CanDropCallback } from "@/components/notebook/presentation/editor/dnd/hooks/useDropNode";
import {
  BLOCKS,
  BUTTON_ELEMENT,
  COLUMN_GROUP,
  getGridClassForElement,
  getGridStyleForElement,
  isLayoutChildType,
  LABEL_ELEMENT,
  QUOTE_ELEMENT,
} from "@/components/notebook/presentation/editor/lib";
import { useIsTouchDevice } from "@/components/plate/hooks/use-is-touch-device";
import { Button } from "@/components/plate/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/plate/ui/tooltip";
import { cn } from "@/lib/utils";

// Configuration constants
const UNDRAGGABLE_KEYS = [KEYS.tr, KEYS.td, KEYS.codeLine];

const NON_DRAGGABLE_DESCENDANT_CONTAINER_TYPES: readonly string[] = [
  KEYS.callout,
  KEYS.codeBlock,
  KEYS.blockquote,
  QUOTE_ELEMENT,
  BUTTON_ELEMENT,
  LABEL_ELEMENT,
];

// Elements that should have horizontal orientation

// Elements that can only drop within same parent (sibling-only drops)
const SIBLING_ONLY_DROP_ELEMENTS = ["column", "table-row", "list-item"];
const GUTTER_HIDE_DELAY_MS = 300;
const VERTICAL_GUTTER_SAFE_ZONE_PX = 40;
const HORIZONTAL_GUTTER_SAFE_ZONE_PX = 28;

type PointerCoordinates = {
  clientX: number;
  clientY: number;
};

type ElementWithRenderToken = TElement & {
  lastUpdate?: number | string;
};

// Helper function to determine element orientation

// Helper function to check if element requires sibling-only drops
const requiresSiblingOnlyDrop = (elementType: string): boolean => {
  return SIBLING_ONLY_DROP_ELEMENTS.includes(elementType);
};

function isElementWithStringType(
  node: unknown,
): node is TElement & { type: string } {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    typeof node.type === "string"
  );
}

function hasNonDraggableContainerAncestor(
  editor: PlateEditor,
  path: number[],
): boolean {
  let ancestorPath = PathApi.parent(path);

  while (ancestorPath.length > 0) {
    const ancestorEntry = editor.api.node({ at: ancestorPath });
    const ancestorNode = ancestorEntry?.[0];

    if (
      isElementWithStringType(ancestorNode) &&
      NON_DRAGGABLE_DESCENDANT_CONTAINER_TYPES.includes(ancestorNode.type)
    ) {
      return true;
    }

    ancestorPath = PathApi.parent(ancestorPath);
  }

  return false;
}

export const BlockDraggable: RenderNodeWrapper = (props) => {
  const { editor, element, path } = props;
  const enabled = React.useMemo(() => {
    if (!path) return false;

    if (
      !editor.api.isBlock(element) &&
      element.type !== BUTTON_ELEMENT &&
      element.type !== LABEL_ELEMENT
    ) {
      return false;
    }

    // Inline elements like links should never receive block drag wrappers.
    if (editor.api.isInline(element)) return false;

    // Check if element is undraggable
    if (isType(editor, element, UNDRAGGABLE_KEYS)) return false;

    if (hasNonDraggableContainerAncestor(editor, path)) return false;

    // Enable dragging for top-level blocks and explicit layout children.
    if (path.length === 1) return true;
    if (path.length === 2) return isLayoutChildType(element.type);

    if (path.length === 3) {
      const isInColumn = editor.api.some({
        at: path,
        match: { type: editor.getType(KEYS.column) },
      });
      return isInColumn;
    }

    if (path.length === 4) {
      const isInTable = editor.api.some({
        at: path,
        match: { type: editor.getType(KEYS.table) },
      });
      return isInTable;
    }

    return false;
  }, [editor, element, path]);

  return enabled
    ? (draggableProps) => <Draggable {...draggableProps} />
    : ({ children }) => <>{children}</>;
};

function Draggable(props: PlateElementProps) {
  const { children, editor, element, path } = props;
  const pathKey = path.join(".");

  React.useEffect(() => {
    if (typeof element.id === "string" && element.id) return;

    editor.tf.setNodes({ id: nanoid() }, { at: path });
  }, [editor, element.id, path, pathKey]);

  // Determine if this element can create columns when dropped on sides
  // Root level elements (path.length === 1) can create columns
  const canCreateColumns = path.length === 1;
  const isChildOfColumnItem = React.useMemo(() => {
    if (!path || path.length === 0) return false;
    try {
      const parentNode = editor.api.node({ at: PathApi.parent(path) });
      return parentNode?.[0]?.type === "column";
    } catch {
      return false;
    }
  }, [editor, path]);

  // Orientation is for UI styling and freeform drop-axis detection.
  // path.length === 2 means elements inside a layout block like bullet/cycle - show horizontal grip
  const orientation: "horizontal" | "vertical" =
    path.length === 2 && !isChildOfColumnItem ? "horizontal" : "vertical";
  const canDropNode = React.useCallback<CanDropCallback>(
    ({ dragEntry, dropEntry }) => {
      const dragElementType = dragEntry[0].type;

      // Check if this element requires sibling-only drops
      if (requiresSiblingOnlyDrop(dragElementType)) {
        const dragParentPath = PathApi.parent(dragEntry[1]);
        const dropParentPath = PathApi.parent(dropEntry[1]);

        // First check: Direct siblings (same parent)
        if (PathApi.equals(dragParentPath, dropParentPath)) {
          return true;
        }

        // Second check: Check if drop target is a child of a valid sibling
        // We need to traverse up the drop entry's ancestors to see if any of them
        // are siblings of the drag entry
        let currentDropPath = dropEntry[1];

        while (currentDropPath.length > 0) {
          const currentParentPath = PathApi.parent(currentDropPath);

          // If we found a path where the parent matches our drag element's parent,
          // then the drop target is within a valid sibling
          if (PathApi.equals(dragParentPath, currentParentPath)) {
            // Additional check: make sure the sibling element is the same type as drag element
            // This ensures we're dropping within a column if we're dragging a column, etc.
            const siblingPath = currentDropPath;
            const siblingEntry = editor.api.node({ at: siblingPath });

            if (siblingEntry && siblingEntry[0].type === dragElementType) {
              return true;
            }
          }

          // Move up one level
          currentDropPath = PathApi.parent(currentDropPath);
        }

        // If no valid sibling relationship found, disallow the drop
        return false;
      }

      // Default behavior: allow drops anywhere
      return true;
    },
    [editor],
  );
  const { isAboutToDrag, isDragging, nodeRef, previewRef, handleRef } =
    useDraggable({
      element,
      canCreateColumns,
      orientation,
      onDropHandler: () => {
        resetPreview();
        return undefined;
      },
      canDropNode,
    });

  const isInColumn = path.length === 3 || isChildOfColumnItem;
  const isInTable = path.length === 4;
  const isContentHeightElement =
    element.type === QUOTE_ELEMENT || element.type === COLUMN_GROUP;
  const elementRenderToken = (element as ElementWithRenderToken).lastUpdate;
  const childrenRenderKey = `${String(element.id ?? element.type)}:${path.join(
    ".",
  )}:${String(elementRenderToken ?? "")}`;
  const showHoverBorder = React.useMemo(
    () => BLOCKS.some((block) => block.type === element.type),
    [element.type],
  );

  const [previewTop, setPreviewTop] = React.useState(0);
  const [isGutterActive, setIsGutterActive] = React.useState(false);
  const gutterHideTimeoutRef = React.useRef<number | null>(null);
  const pointerTrackerCleanupRef = React.useRef<(() => void) | null>(null);
  const pointerTrackerStateRef = React.useRef<{
    isAboutToDrag: boolean;
    isDragging: boolean;
    isPointerInGutterSafeZone: (coordinates: PointerCoordinates) => boolean;
    keepGutterOpen: () => void;
    scheduleHideGutter: () => void;
  } | null>(null);

  const clearGutterHideTimeout = React.useCallback(() => {
    if (gutterHideTimeoutRef.current !== null) {
      window.clearTimeout(gutterHideTimeoutRef.current);
      gutterHideTimeoutRef.current = null;
    }
  }, []);

  const stopPointerTracking = React.useCallback(() => {
    pointerTrackerCleanupRef.current?.();
    pointerTrackerCleanupRef.current = null;
  }, []);

  const startPointerTracking = React.useCallback(() => {
    if (pointerTrackerCleanupRef.current !== null) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const trackerState = pointerTrackerStateRef.current;

      if (!trackerState) return;

      if (
        trackerState.isAboutToDrag ||
        trackerState.isDragging ||
        trackerState.isPointerInGutterSafeZone(event)
      ) {
        trackerState.keepGutterOpen();
        return;
      }

      trackerState.scheduleHideGutter();
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerMove);
    pointerTrackerCleanupRef.current = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerMove);
    };
  }, []);

  const keepGutterOpen = React.useCallback(() => {
    clearGutterHideTimeout();
    setIsGutterActive(true);
  }, [clearGutterHideTimeout]);

  const showGutter = React.useCallback(() => {
    keepGutterOpen();
    startPointerTracking();
  }, [keepGutterOpen, startPointerTracking]);

  const isPointerInGutterSafeZone = React.useCallback(
    ({ clientX, clientY }: PointerCoordinates) => {
      const wrapper = nodeRef.current;

      if (!wrapper) return false;

      const rect = wrapper.getBoundingClientRect();

      if (orientation === "horizontal") {
        return (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top - HORIZONTAL_GUTTER_SAFE_ZONE_PX &&
          clientY <= rect.bottom
        );
      }

      return (
        clientX >= rect.left - VERTICAL_GUTTER_SAFE_ZONE_PX &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      );
    },
    [nodeRef, orientation],
  );

  const scheduleHideGutter = React.useCallback(() => {
    clearGutterHideTimeout();
    gutterHideTimeoutRef.current = window.setTimeout(() => {
      setIsGutterActive(false);
      gutterHideTimeoutRef.current = null;
      stopPointerTracking();
    }, GUTTER_HIDE_DELAY_MS);
  }, [clearGutterHideTimeout, stopPointerTracking]);

  const hideGutter = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (isPointerInGutterSafeZone(event.nativeEvent)) {
        return;
      }

      scheduleHideGutter();
    },
    [isPointerInGutterSafeZone, scheduleHideGutter],
  );

  React.useEffect(() => {
    pointerTrackerStateRef.current = {
      isAboutToDrag,
      isDragging,
      isPointerInGutterSafeZone,
      keepGutterOpen,
      scheduleHideGutter,
    };
  }, [
    isAboutToDrag,
    isDragging,
    isPointerInGutterSafeZone,
    keepGutterOpen,
    scheduleHideGutter,
  ]);

  const resetPreview = () => {
    if (previewRef.current) {
      previewRef.current.replaceChildren();
      previewRef.current?.classList.add("hidden");
    }
  };

  // Clear up virtual multiple preview when drag ends
  React.useEffect(() => {
    if (!isDragging) {
      resetPreview();
    }
  }, [isDragging, previewRef]);

  React.useEffect(() => {
    if (isAboutToDrag) {
      previewRef.current?.classList.remove("opacity-0");
    }
  }, [isAboutToDrag, previewRef]);

  React.useEffect(() => {
    return () => {
      clearGutterHideTimeout();
      stopPointerTracking();
    };
  }, [clearGutterHideTimeout, stopPointerTracking]);

  return (
    <div
      data-dnd-wrapper="true"
      className={cn(
        path?.length === 1 && "px-4 md:px-8",
        // path?.length === 2 && "pl-8",
        getGridClassForElement(
          editor as unknown as PlateEditor,
          element as unknown as TElement,
        ),
      )}
      style={getGridStyleForElement(
        editor as unknown as PlateEditor,
        element as unknown as TElement,
      )}
      ref={nodeRef}
      onPointerEnter={showGutter}
      onPointerLeave={hideGutter}
    >
      <div
        className={cn(
          "relative overflow-visible",
          isContentHeightElement ? "h-fit" : "h-full",
          isDragging && "opacity-50",
          showHoverBorder &&
            "after:pointer-events-none after:absolute after:-inset-1",
          showHoverBorder &&
            (isGutterActive || isAboutToDrag || isDragging
              ? "after:border after:border-blue-400"
              : "hover:after:border hover:after:border-blue-400"),
          getContainerTypes(editor).includes(element.type)
            ? "group/container"
            : "group",
        )}
      >
        {!isInTable && !editor.dom.readOnly && (
          <Gutter
            active={isGutterActive || isAboutToDrag || isDragging}
            orientation={orientation}
            onPointerEnter={showGutter}
            onPointerLeave={hideGutter}
          >
            <div
              className={cn(
                "slate-blockToolbarWrapper",
                "pointer-events-auto flex",
                orientation === "horizontal"
                  ? "h-6 w-full justify-center"
                  : "h-[1.5em]",
                isType(editor, element, [
                  KEYS.h1,
                  KEYS.h2,
                  KEYS.h3,
                  KEYS.h4,
                  KEYS.h5,
                ]) &&
                  orientation === "vertical" &&
                  "h-[1.3em]",
                isInColumn && orientation === "vertical" && "",
              )}
            >
              <div
                className={cn(
                  "slate-blockToolbar",
                  "pointer-events-auto flex items-center",
                  orientation === "horizontal" ? "mb-1" : "mr-1",
                  isInColumn && orientation === "vertical" && "mr-1.5",
                )}
              >
                <Button
                  ref={handleRef}
                  variant="ghost"
                  className={cn(
                    "relative border-0 bg-transparent p-0 shadow-none",
                    "hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 active:bg-transparent",
                    orientation === "horizontal"
                      ? "-mb-1.5 h-5 w-8"
                      : "-mr-1.5 h-8 w-5",
                  )}
                  onFocus={showGutter}
                  onPointerDown={showGutter}
                  data-plate-prevent-deselect
                >
                  <DragHandle
                    orientation={orientation}
                    isDragging={isDragging}
                    previewRef={previewRef}
                    resetPreview={resetPreview}
                    setPreviewTop={setPreviewTop}
                  />
                </Button>
              </div>
            </div>
          </Gutter>
        )}

        <div
          ref={previewRef}
          className={cn("pointer-events-none absolute left-0 hidden w-full")}
          style={{ top: `${-previewTop}px` }}
          contentEditable={false}
        />

        <div
          className={cn(
            "slate-blockWrapper",
            isContentHeightElement ? "h-fit" : "h-full",
          )}
          onContextMenu={(event) =>
            editor
              .getApi(BlockSelectionPlugin)
              .blockSelection.addOnContextMenu({ element, event })
          }
        >
          <MemoizedChildren key={childrenRenderKey}>
            {children}
          </MemoizedChildren>
          <DropLine />
        </div>
      </div>
    </div>
  );
}

function Gutter({
  active = false,
  children,
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & {
  active?: boolean;
  orientation?: "horizontal" | "vertical";
}) {
  const editor = useEditorRef();
  const element = useElement();
  const path = usePath();
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    "isSelectionAreaVisible",
  );
  const isTouchDevice = useIsTouchDevice();
  const isEditorFocused = useFocused();

  const selected = useSelected();

  // Check if the editor's selection/cursor is within this element
  const isFocusedWithin = useEditorSelector(() => {
    if (!isEditorFocused || !path) return false;

    const selection = editor.selection;
    if (!selection) return false;

    // Get the block at the selection focus point
    const focusBlock = editor.api.block({ at: selection.focus });
    if (!focusBlock) return false;

    const [, focusPath] = focusBlock;

    // Check if the focus path starts with or is equal to this element's path
    // This means the cursor is within this element
    // A path is an ancestor if it's a prefix of the focus path
    return (
      PathApi.equals(path, focusPath) ||
      (focusPath.length > path.length &&
        focusPath.slice(0, path.length).every((p, i) => p === path[i]))
    );
  }, [isEditorFocused, path]);

  const isNodeType = (keys: string[] | string) => isType(editor, element, keys);
  const isChildOfColumnItem = React.useMemo(() => {
    if (!path || path.length === 0) return false;
    try {
      const parentNode = editor.api.node({ at: PathApi.parent(path) });
      return parentNode?.[0]?.type === "column";
    } catch {
      return false;
    }
  }, [editor, path]);
  const isInColumn = path.length === 3 || isChildOfColumnItem;

  return (
    <div
      {...props}
      className={cn(
        "slate-gutterLeft",
        "pointer-events-none absolute z-999999 flex cursor-text transition-opacity duration-100",
        // On touch devices, show when editor is focused and selection is within this element
        // On desktop, show on hover
        isTouchDevice
          ? isFocusedWithin && !isSelectionAreaVisible
            ? "opacity-100"
            : "opacity-0"
          : "hover:opacity-100 sm:opacity-0",
        orientation === "horizontal"
          ? "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
          : "top-0 left-0 h-full -translate-x-full",
        // Desktop hover behavior
        !isTouchDevice &&
          (getContainerTypes(editor).includes(element.type)
            ? "group-hover/container:opacity-100"
            : "group-hover:opacity-100"),
        isSelectionAreaVisible && "hidden",
        // On desktop, hide when not selected (unless hovering)
        !isTouchDevice && !selected && "opacity-0",
        active && !isSelectionAreaVisible && "opacity-100 sm:opacity-100",
        // Vertical orientation specific styles
        orientation === "vertical" && "w-8 justify-end",
        orientation === "vertical" && [
          isNodeType(KEYS.h1) && "pb-1 text-[1.875em]",
          isNodeType(KEYS.h2) && "pb-1 text-[1.5em]",
          isNodeType(KEYS.h3) && "pt-0.5 pb-1 text-[1.25em]",
          isNodeType([KEYS.h4, KEYS.h5]) && "pt-1 pb-0 text-[1.1em]",
          isNodeType(KEYS.h6) && "pb-0",
          isNodeType(KEYS.p) && "pt-1 pb-0",
          isNodeType(KEYS.blockquote) && "pb-0",
          isNodeType(KEYS.codeBlock) && "pt-6 pb-0",
          isNodeType([
            KEYS.img,
            KEYS.mediaEmbed,
            KEYS.excalidraw,
            KEYS.toggle,
            KEYS.column,
          ]) && "py-0",
          isNodeType([KEYS.placeholder, KEYS.table]) && "pt-3 pb-0",
          isInColumn && "items-center",
        ],
        className,
      )}
      contentEditable={false}
    >
      {children}
    </div>
  );
}

const DragHandle = React.memo(function DragHandle({
  orientation = "vertical",
  isDragging,
  previewRef,
  resetPreview,
  setPreviewTop,
}: {
  orientation?: "horizontal" | "vertical";
  isDragging: boolean;
  previewRef: React.RefObject<HTMLDivElement | null>;
  resetPreview: () => void;
  setPreviewTop: (top: number) => void;
}) {
  const editor = useEditorRef();
  const element = useElement();

  // Track if a drag actually happened (vs just a click)
  const dragStartedRef = React.useRef(false);
  const pendingBlocksRef = React.useRef<TElement[]>([]);

  React.useEffect(() => {
    if (isDragging) {
      dragStartedRef.current = true;
    }
  }, [isDragging]);

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    resetPreview();
    dragStartedRef.current = false;

    // For mouse events, check button
    if ("button" in e && (e.button !== 0 || e.shiftKey)) return;

    // For touch events, prevent default to avoid text selection
    // But for mouse events, we must NOT prevent default or stop propagation
    // because react-dnd needs these events to bubble up to the handleRef
    if ("touches" in e) {
      e.preventDefault();
    }

    const blockSelection = editor
      .getApi(BlockSelectionPlugin)
      .blockSelection.getNodes({ sort: true });

    let selectionNodes =
      blockSelection.length > 0
        ? blockSelection
        : editor.api.blocks({ mode: "highest" });

    // If current block is not in selection, use it as the starting point
    if (!selectionNodes.some(([node]) => node.id === element.id)) {
      selectionNodes = [[element, editor.api.findPath(element)!]];
    }

    // Process selection nodes to include list children
    const blocks = expandListItemsWithChildren(editor, selectionNodes).map(
      ([node]) => node,
    );

    // Store blocks for potential selection on mouse up
    pendingBlocksRef.current = blocks;

    if (blockSelection.length === 0) {
      editor.tf.blur();
      editor.tf.collapse();
    }

    // Only prepare the preview elements, don't set selection yet
    const elements = createDragPreviewElements(editor, blocks);
    previewRef.current?.append(...elements);
    previewRef.current?.classList.remove("hidden");
    previewRef.current?.classList.add("opacity-0");
    editor.setOption(DndPlugin, "multiplePreviewRef", previewRef);

    // Note: We intentionally do NOT set block selection here
    // Selection will happen on mouse up if it wasn't a drag
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startDrag(e);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startDrag(e);
  };

  const endDrag = () => {
    resetPreview();

    // Only select blocks on pointer up when this interaction stayed a click.
    if (!dragStartedRef.current && pendingBlocksRef.current.length > 0) {
      // Set block selection now (on mouse up) instead of mouse down
      editor
        .getApi(BlockSelectionPlugin)
        .blockSelection.set(
          pendingBlocksRef.current.map((block) => block.id as string),
        );

      // Focus the block selection to show toolbar
      editor.getApi(BlockSelectionPlugin).blockSelection.focus();
    }

    // Clear pending blocks
    dragStartedRef.current = false;
    pendingBlocksRef.current = [];
  };

  const handleMouseUp = () => {
    endDrag();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    endDrag();
  };

  const handleMouseEnter = () => {
    if (isDragging) return;

    const blockSelection = editor
      .getApi(BlockSelectionPlugin)
      .blockSelection.getNodes({ sort: true });

    let selectedBlocks =
      blockSelection.length > 0
        ? blockSelection
        : editor.api.blocks({ mode: "highest" });

    // If current block is not in selection, use it as the starting point
    if (!selectedBlocks.some(([node]) => node.id === element.id)) {
      selectedBlocks = [[element, editor.api.findPath(element)!]];
    }

    // Process selection to include list children
    const processedBlocks = expandListItemsWithChildren(editor, selectedBlocks);

    const ids = processedBlocks.map((block) => block[0].id as string);

    if (ids.length > 1 && ids.includes(element.id as string)) {
      const previewTop = calculatePreviewTop(editor, {
        blocks: processedBlocks.map((block) => block[0]),
        element,
      });
      setPreviewTop(previewTop);
    } else {
      setPreviewTop(0);
    }
  };

  return (
    <Tooltip delayDuration={1000}>
      <TooltipTrigger asChild>
        <div
          className="relative flex size-full touch-none items-center justify-center"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseEnter={handleMouseEnter}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          role="button"
          data-plate-prevent-deselect
        >
          <span
            className={cn(
              "pointer-events-none absolute flex items-center justify-center rounded-md",
              "text-muted-foreground/90 drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]",
              orientation === "horizontal"
                ? "bottom-0 left-1/2 h-4 w-7 -translate-x-1/2"
                : "top-1/2 right-0 h-7 w-4 -translate-y-1/2",
            )}
          >
            {orientation === "horizontal" ? (
              <GripHorizontal
                className="size-4 text-current"
                data-ppt-ignore="true"
              />
            ) : (
              <GripVertical
                className="size-4 text-current"
                data-ppt-ignore="true"
              />
            )}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>Hold and drag to move, or click to edit</TooltipContent>
    </Tooltip>
  );
});

const DropLine = React.memo(function DropLine({
  className,
}: {
  className?: string;
}) {
  const { dropLine } = useDropLine();

  if (!dropLine) return null;

  return (
    <motion.div
      layout="position"
      layoutId="presentation-dnd-drop-line"
      transition={{ layout: { duration: 0.16, ease: "easeOut" } }}
      className={cn(
        "slate-dropLine",
        "absolute rounded-full opacity-100 transition-opacity",
        "bg-blue-500",
        // Horizontal line styles for vertical drops
        (dropLine === "top" || dropLine === "bottom") && "inset-x-0 h-0.5",
        // Vertical line styles for horizontal drops
        (dropLine === "left" || dropLine === "right") && "inset-y-0 w-0.5",
        // Positioning
        dropLine === "top" && "-top-px",
        dropLine === "bottom" && "-bottom-px",
        dropLine === "left" && "-left-px",
        dropLine === "right" && "-right-px",
        className,
      )}
    />
  );
});

const createDragPreviewElements = (
  editor: PlateEditor,
  blocks: TElement[],
): HTMLElement[] => {
  const elements: HTMLElement[] = [];
  const ids: string[] = [];

  /**
   * Remove data attributes from the element to avoid recognized as slate
   * elements incorrectly.
   */
  const removeDataAttributes = (element: HTMLElement) => {
    Array.from(element.attributes).forEach((attr) => {
      if (
        attr.name.startsWith("data-slate") ||
        attr.name.startsWith("data-block-id")
      ) {
        element.removeAttribute(attr.name);
      }
    });

    Array.from(element.children).forEach((child) => {
      removeDataAttributes(child as HTMLElement);
    });
  };

  const resolveElement = (node: TElement, index: number) => {
    const domNode = editor.api.toDOMNode(node)!;
    const newDomNode = domNode.cloneNode(true) as HTMLElement;

    // Apply visual compensation for horizontal scroll
    const applyScrollCompensation = (
      original: Element,
      cloned: HTMLElement,
    ) => {
      const scrollLeft = original.scrollLeft;

      if (scrollLeft > 0) {
        // Create a wrapper to handle the scroll offset
        const scrollWrapper = document.createElement("div");
        scrollWrapper.style.overflow = "hidden";
        scrollWrapper.style.width = `${original.clientWidth}px`;

        // Create inner container with the full content
        const innerContainer = document.createElement("div");
        innerContainer.style.transform = `translateX(-${scrollLeft}px)`;
        innerContainer.style.width = `${original.scrollWidth}px`;

        // Move all children to the inner container
        while (cloned.firstChild) {
          innerContainer.append(cloned.firstChild);
        }

        // Apply the original element's styles to maintain appearance
        const originalStyles = window.getComputedStyle(original);
        cloned.style.padding = "0";
        innerContainer.style.padding = originalStyles.padding;

        scrollWrapper.append(innerContainer);
        cloned.append(scrollWrapper);
      }
    };

    applyScrollCompensation(domNode, newDomNode);

    ids.push(node.id as string);
    const wrapper = document.createElement("div");
    wrapper.append(newDomNode);
    wrapper.style.display = "flow-root";

    const lastDomNode = blocks[index - 1];

    if (lastDomNode) {
      const lastDomNodeRect = editor.api
        .toDOMNode(lastDomNode)!
        .parentElement!.getBoundingClientRect();

      const domNodeRect = domNode.parentElement!.getBoundingClientRect();

      const distance = domNodeRect.top - lastDomNodeRect.bottom;

      // Check if the two elements are adjacent (touching each other)
      if (distance > 15) {
        wrapper.style.marginTop = `${distance}px`;
      }
    }

    removeDataAttributes(newDomNode);
    elements.push(wrapper);
  };

  blocks.forEach((node, index) => resolveElement(node, index));

  editor.setOption(DndPlugin, "draggingId", ids);

  return elements;
};

const calculatePreviewTop = (
  editor: PlateEditor,
  {
    blocks,
    element,
  }: {
    blocks: TElement[];
    element: TElement;
  },
): number => {
  const child = editor.api.toDOMNode(element)!;
  const editable = editor.api.toDOMNode(editor)!;
  const firstSelectedChild = blocks[0]!;

  const firstDomNode = editor.api.toDOMNode(firstSelectedChild)!;
  // Get editor's top padding
  const editorPaddingTop = Number(
    window.getComputedStyle(editable).paddingTop.replace("px", ""),
  );

  // Calculate distance from first selected node to editor top
  const firstNodeToEditorDistance =
    firstDomNode.getBoundingClientRect().top -
    editable.getBoundingClientRect().top -
    editorPaddingTop;

  // Get margin top of first selected node
  const firstMarginTopString = window.getComputedStyle(firstDomNode).marginTop;
  const marginTop = Number(firstMarginTopString.replace("px", ""));

  // Calculate distance from current node to editor top
  const currentToEditorDistance =
    child.getBoundingClientRect().top -
    editable.getBoundingClientRect().top -
    editorPaddingTop;

  const currentMarginTopString = window.getComputedStyle(child).marginTop;
  const currentMarginTop = Number(currentMarginTopString.replace("px", ""));

  const previewElementsTopDistance =
    currentToEditorDistance -
    firstNodeToEditorDistance +
    marginTop -
    currentMarginTop;

  return previewElementsTopDistance;
};
