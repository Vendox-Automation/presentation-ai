"use client";

import {
  DndPlugin,
  useDropLine,
  type DragItemNode,
  type ElementDragItemNode,
} from "@platejs/dnd";
import {
  BlockSelectionPlugin,
  useBlockSelected,
} from "@platejs/selection/react";
import { isSelectingCell } from "@platejs/table";
import {
  TablePlugin,
  TableProvider,
  useTableCellElement,
  useTableCellElementResizable,
  useTableElement,
} from "@platejs/table/react";
import { GripVertical, Plus } from "lucide-react";
import {
  ElementApi,
  KEYS,
  PathApi,
  type Path,
  type TTableCellElement,
  type TTableElement,
  type TTableRowElement,
} from "platejs";
import {
  PlateElement,
  useEditorPlugin,
  useEditorRef,
  useEditorSelector,
  useElement,
  useElementSelector,
  usePluginOption,
  useReadOnly,
  withHOC,
  type PlateEditor,
  type PlateElementProps,
} from "platejs/react";
import * as React from "react";
import { type DropTargetMonitor } from "react-dnd";

import { Button } from "@/components/plate/ui/button";
import { ResizeHandle } from "@/components/plate/ui/resize-handle";
import { cn } from "@/lib/utils";
import { blockSelectionVariants } from "../../../../plate/ui/block-selection";
import { PresentationElement } from "../custom-elements/presentation-element";
import { useDraggable } from "../dnd/hooks/useDraggable";

const TABLE_ROW_DRAG_TYPE = "presentation-table-row";

function setRefValue<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value);
    return;
  }

  if (ref) {
    ref.current = value;
  }
}

function isElementDragItem(
  dragItem: DragItemNode,
): dragItem is ElementDragItemNode {
  return "element" in dragItem && "id" in dragItem;
}

function getRowDropDirection(
  monitor: DropTargetMonitor<DragItemNode, unknown>,
  row: HTMLTableRowElement | null,
) {
  if (!row) return;

  const clientOffset = monitor.getClientOffset();
  if (!clientOffset) return;

  const rect = row.getBoundingClientRect();
  const hoverClientY = clientOffset.y - rect.top;

  return hoverClientY < rect.height / 2 ? "top" : "bottom";
}

function canDropTableRow(
  editor: PlateEditor,
  dragItem: DragItemNode,
  dropElement: TTableRowElement,
) {
  if (!isElementDragItem(dragItem)) return false;
  if (dragItem.element === dropElement) return false;

  const dragPath = editor.api.findPath(dragItem.element);
  const dropPath = editor.api.findPath(dropElement);

  return Boolean(
    dragPath &&
    dropPath &&
    PathApi.equals(PathApi.parent(dragPath), PathApi.parent(dropPath)),
  );
}

function updateRowDropLine(
  editor: PlateEditor,
  element: TTableRowElement,
  direction: "bottom" | "top" | undefined,
) {
  const { dropTarget } = editor.getOptions(DndPlugin);
  const currentId = dropTarget?.id ?? null;
  const currentLine = dropTarget?.line ?? "";
  const nextId = direction ? (element.id as string) : null;
  const nextLine = direction ?? "";

  if (currentId !== nextId || currentLine !== nextLine) {
    editor.setOption(DndPlugin, "dropTarget", {
      id: nextId,
      line: nextLine,
    });
  }
}

function moveTableRow(
  editor: PlateEditor,
  dragItem: DragItemNode,
  dropElement: TTableRowElement,
  direction: "bottom" | "top",
) {
  if (!isElementDragItem(dragItem)) return false;

  const dragPath = editor.api.findPath(dragItem.element);
  const hoveredPath = editor.api.findPath(dropElement);

  if (!dragPath || !hoveredPath) return false;
  if (!PathApi.equals(PathApi.parent(dragPath), PathApi.parent(hoveredPath))) {
    return false;
  }

  if (direction === "bottom") {
    if (PathApi.equals(dragPath, PathApi.next(hoveredPath))) return true;

    const to =
      PathApi.isBefore(dragPath, hoveredPath) &&
      PathApi.isSibling(dragPath, hoveredPath)
        ? hoveredPath
        : PathApi.next(hoveredPath);

    editor.tf.moveNodes({ at: dragPath, to });
    return true;
  }

  const previousPath = PathApi.previous(hoveredPath);
  if (previousPath && PathApi.equals(dragPath, previousPath)) return true;

  const beforePath = [
    ...hoveredPath.slice(0, -1),
    (hoveredPath.at(-1) ?? 0) - 1,
  ];
  const to =
    PathApi.isBefore(dragPath, beforePath) &&
    PathApi.isSibling(dragPath, beforePath)
      ? beforePath
      : hoveredPath;

  editor.tf.moveNodes({ at: dragPath, to });
  return true;
}

function getLastTableRowPath(
  tableElement: TTableElement,
  tablePath: Path,
): Path | undefined {
  if (tableElement.children.length === 0) return undefined;

  return [...tablePath, tableElement.children.length - 1];
}

function getLastTableCellPath(
  tableElement: TTableElement,
  tablePath: Path,
): Path | undefined {
  for (
    let rowIndex = tableElement.children.length - 1;
    rowIndex >= 0;
    rowIndex -= 1
  ) {
    const row = tableElement.children[rowIndex];

    if (!ElementApi.isElement(row)) continue;

    if (row.children.length > 0) {
      return [...tablePath, rowIndex, row.children.length - 1];
    }
  }

  return undefined;
}

const PresentationTableElementWithProvider = withHOC(
  TableProvider,
  function PresentationTableElement({
    children,
    ...props
  }: PlateElementProps<TTableElement>) {
    const editor = useEditorRef();
    const { tf } = useEditorPlugin(TablePlugin);
    const readOnly = useReadOnly();
    const isSelectionAreaVisible = usePluginOption(
      BlockSelectionPlugin,
      "isSelectionAreaVisible",
    );
    const hasControls = !readOnly && !isSelectionAreaVisible;
    const { marginLeft, props: tableProps } = useTableElement();
    const isSelectingCells = isSelectingCell(props.editor);
    const tableId = props.element.id;
    const isTableBlockSelected = useBlockSelected(
      typeof tableId === "string" ? tableId : undefined,
    );
    const isSelectionInCurrentTable = useEditorSelector(
      (currentEditor) => {
        const tableEntry = currentEditor.api.above({
          match: { type: KEYS.table },
        });
        const [selectedTable] = tableEntry ?? [];

        return typeof tableId === "string" && selectedTable?.id === tableId;
      },
      [tableId],
    );
    const showTableGrowthControls =
      hasControls && (isTableBlockSelected || isSelectionInCurrentTable);

    const colSizes = props.element.colSizes ?? [];

    const insertColumnAfter = React.useCallback(() => {
      const tablePath = editor.api.findPath(props.element);
      if (!tablePath) return;

      const fromCell = getLastTableCellPath(props.element, tablePath);
      if (!fromCell) return;

      tf.insert.tableColumn({ fromCell, select: true });
      editor.tf.focus();
    }, [editor, props.element, tf]);

    const insertRowAfter = React.useCallback(() => {
      const tablePath = editor.api.findPath(props.element);
      if (!tablePath) return;

      const fromRow = getLastTableRowPath(props.element, tablePath);
      if (!fromRow) return;

      tf.insert.tableRow({ fromRow, select: true });
      editor.tf.focus();
    }, [editor, props.element, tf]);

    const content = (
      <PresentationElement
        {...props}
        className={cn(
          "overflow-x-auto py-5",
          hasControls && "-ml-2 data-[slot=block-selection]:*:left-2",
        )}
        style={{ paddingLeft: marginLeft }}
      >
        <div
          className={cn(
            "group/table relative w-full bg-transparent",
            showTableGrowthControls &&
              "grid grid-cols-[minmax(0,1fr)_1.25rem] grid-rows-[auto_1.25rem]",
          )}
        >
          {isTableBlockSelected && (
            <div className={blockSelectionVariants()} contentEditable={false} />
          )}
          <table
            className={cn(
              "mr-0 ml-px table h-px max-w-full table-fixed border-collapse bg-transparent text-(--presentation-text)",
              isSelectingCells && "selection:bg-transparent",
              colSizes && colSizes.length > 0 && colSizes?.every((s) => s !== 0)
                ? "w-fit"
                : "w-full",
            )}
            {...tableProps}
          >
            <tbody className="w-full">{children}</tbody>
          </table>
          {showTableGrowthControls && (
            <>
              <Button
                aria-label="Add column"
                className={cn(
                  "z-40 h-full min-h-10 w-5 rounded-md border-border/80 bg-muted/80 p-0 text-muted-foreground shadow-xs backdrop-blur-sm",
                  "transition-colors duration-100 hover:bg-background hover:text-foreground",
                )}
                contentEditable={false}
                onClick={insertColumnAfter}
                onMouseDown={(event) => event.preventDefault()}
                size="icon"
                title="Add column"
                type="button"
                variant="outline"
              >
                <Plus className="size-3.5" data-ppt-ignore="true" />
              </Button>
              <Button
                aria-label="Add row"
                className={cn(
                  "z-40 col-span-2 h-5 w-auto rounded-md border-border/80 bg-muted/80 p-0 text-muted-foreground shadow-xs backdrop-blur-sm",
                  "transition-colors duration-100 hover:bg-background hover:text-foreground",
                )}
                contentEditable={false}
                onClick={insertRowAfter}
                onMouseDown={(event) => event.preventDefault()}
                size="icon"
                title="Add row"
                type="button"
                variant="outline"
              >
                <Plus className="size-3.5" data-ppt-ignore="true" />
              </Button>
            </>
          )}
        </div>
      </PresentationElement>
    );

    return content;
  },
);

export function PresentationTableElement(
  props: PlateElementProps<TTableElement>,
) {
  return <PresentationTableElementWithProvider {...props} />;
}

export function PresentationTableRowElement(
  props: PlateElementProps<TTableRowElement>,
) {
  const { element } = props;
  const readOnly = useReadOnly();
  const editor = useEditorRef();
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    "isSelectionAreaVisible",
  );
  const hasControls = !readOnly && !isSelectionAreaVisible;

  const { isDragging, nodeRef, handleRef } = useDraggable<HTMLTableRowElement>({
    element,
    type: TABLE_ROW_DRAG_TYPE,
    drag: {
      disableFreeformDrag: true,
    },
    preview: { disable: true },
    drop: {
      hover: (dragItem, monitor) => {
        const direction = getRowDropDirection(monitor, nodeRef.current);

        if (!direction || !canDropTableRow(editor, dragItem, element)) {
          updateRowDropLine(editor, element, undefined);
          return;
        }

        updateRowDropLine(editor, element, direction);
      },
    },
    onDropHandler: (_, { dragItem, monitor }) => {
      const direction = getRowDropDirection(monitor, nodeRef.current);
      if (!direction) return true;

      const moved = moveTableRow(editor, dragItem, element, direction);
      if (moved) editor.tf.focus();

      updateRowDropLine(editor, element, undefined);
      return true;
    },
  });
  const rowRef = React.useCallback(
    (node: HTMLTableRowElement | null) => {
      setRefValue<HTMLTableRowElement>(props.ref, node);
      setRefValue<HTMLTableRowElement>(nodeRef, node);
    },
    [nodeRef, props.ref],
  );

  return (
    <PlateElement
      {...props}
      ref={rowRef}
      as="tr"
      className={cn("group/row", isDragging && "opacity-50")}
    >
      {hasControls && (
        <td className="w-2 select-none" contentEditable={false}>
          <RowDragHandle dragRef={handleRef} />
          <RowDropLine />
        </td>
      )}

      {props.children}
    </PlateElement>
  );
}

function RowDragHandle({ dragRef }: { dragRef: React.Ref<HTMLButtonElement> }) {
  const editor = useEditorRef();
  const element = useElement();

  return (
    <button
      ref={dragRef}
      type="button"
      className={cn(
        "absolute top-1/2 z-51 w-4 -translate-y-1/2 p-0.5 focus-visible:ring-0 focus-visible:ring-offset-0",
        "cursor-grab active:cursor-grabbing",
        'flex items-center rounded bg-accent opacity-0 outline transition-opacity duration-100 group-hover/row:opacity-100 group-has-data-[resizing="true"]/row:opacity-0',
      )}
      onClick={() => {
        editor.tf.select(element);
      }}
    >
      <GripVertical
        className="size-3.5 text-muted-foreground"
        data-ppt-ignore="true"
      />
    </button>
  );
}

function RowDropLine() {
  const { dropLine } = useDropLine();

  if (!dropLine) return null;

  return (
    <div
      className={cn(
        "absolute inset-x-0 left-2 z-50 h-0.5 rounded-full bg-brand/50",
        dropLine === "top" ? "-top-px" : "-bottom-px",
      )}
    />
  );
}

export function PresentationTableCellElement({
  isHeader,
  ...props
}: PlateElementProps<TTableCellElement> & {
  isHeader?: boolean;
}) {
  const { api } = useEditorPlugin(TablePlugin);
  const readOnly = useReadOnly();
  const element = props.element;

  const rowId = useElementSelector(([node]) => node.id as string, [], {
    key: KEYS.tr,
  });
  const isSelectingRow = useBlockSelected(rowId);
  const isSelectionAreaVisible = usePluginOption(
    BlockSelectionPlugin,
    "isSelectionAreaVisible",
  );
  const selectedCellIds = usePluginOption(TablePlugin, "selectedCellIds");

  const { borders, colIndex, colSpan, minHeight, rowIndex, selected, width } =
    useTableCellElement();
  const isCellSelected =
    selected ||
    (typeof element.id === "string" &&
      (selectedCellIds?.includes(element.id) ?? false));

  const { bottomProps, hiddenLeft, leftProps, rightProps } =
    useTableCellElementResizable({
      colIndex,
      colSpan,
      rowIndex,
    });

  return (
    <PlateElement
      {...props}
      as={isHeader ? "th" : "td"}
      className={cn(
        "relative h-full overflow-visible border-none bg-transparent p-0",
        isHeader && "text-left *:m-0",
        "before:inset-0 before:z-10 before:size-full",
        (isCellSelected || isSelectingRow) && "before:bg-brand/20",
        "before:absolute before:box-border before:content-[''] before:select-none",
        borders.bottom?.size && `before:border-b before:border-b-border`,
        borders.right?.size && `before:border-r before:border-r-border`,
        borders.left?.size && `before:border-l before:border-l-border`,
        borders.top?.size && `before:border-t before:border-t-border`,
      )}
      style={
        {
          "--cellBackground": element.background,
          maxWidth: width || 240,
          width: width || undefined,
          minWidth: width || 120,
          backgroundColor:
            element.background ??
            (isHeader ? "var(--presentation-card-background)" : undefined),
        } as React.CSSProperties
      }
      attributes={{
        ...props.attributes,
        colSpan: api.table.getColSpan(element),
        rowSpan: api.table.getRowSpan(element),
      }}
    >
      {(isCellSelected || isSelectingRow) && (
        <div
          className="pointer-events-none absolute inset-0 z-10 bg-brand/20"
          contentEditable={false}
        />
      )}

      <div
        className={cn(
          "relative z-20 box-border h-full rounded-md px-3 py-2",
          isHeader ? "text-lg font-bold text-primary" : "presentation-text",
        )}
        style={{ minHeight }}
      >
        {props.children}
      </div>

      {!isSelectionAreaVisible && (
        <div
          className="group absolute top-0 size-full select-none"
          contentEditable={false}
          suppressContentEditableWarning={true}
        >
          {!readOnly && (
            <>
              <ResizeHandle
                {...rightProps}
                className="-top-2 -right-1 h-[calc(100%+8px)] w-2"
                data-col={colIndex}
              />
              <ResizeHandle {...bottomProps} className="-bottom-1 h-2" />
              {!hiddenLeft && (
                <ResizeHandle
                  {...leftProps}
                  className="top-0 -left-1 w-2"
                  data-resizer-left={colIndex === 0 ? "true" : undefined}
                />
              )}

              <div
                className={cn(
                  "absolute top-0 z-30 hidden h-full w-1 bg-ring",
                  "right-[-1.5px]",
                  getColumnResizeClass(colIndex),
                )}
              />
              {colIndex === 0 && (
                <div
                  className={cn(
                    "absolute top-0 z-30 h-full w-1 bg-ring",
                    "left-[-1.5px]",
                    'hidden animate-in fade-in group-has-[[data-resizer-left]:hover]/table:block group-has-[[data-resizer-left][data-resizing="true"]]/table:block',
                  )}
                />
              )}
            </>
          )}
        </div>
      )}

      {isSelectingRow && (
        <div className={blockSelectionVariants()} contentEditable={false} />
      )}
    </PlateElement>
  );
}

export function PresentationTableCellHeaderElement(
  props: React.ComponentProps<typeof PresentationTableCellElement>,
) {
  return <PresentationTableCellElement {...props} isHeader />;
}

const COLUMN_RESIZE_CLASSES: Record<number, string> = {
  0: 'group-has-[[data-col="0"]:hover]/table:block group-has-[[data-col="0"][data-resizing="true"]]/table:block',
  1: 'group-has-[[data-col="1"]:hover]/table:block group-has-[[data-col="1"][data-resizing="true"]]/table:block',
  2: 'group-has-[[data-col="2"]:hover]/table:block group-has-[[data-col="2"][data-resizing="true"]]/table:block',
  3: 'group-has-[[data-col="3"]:hover]/table:block group-has-[[data-col="3"][data-resizing="true"]]/table:block',
  4: 'group-has-[[data-col="4"]:hover]/table:block group-has-[[data-col="4"][data-resizing="true"]]/table:block',
  5: 'group-has-[[data-col="5"]:hover]/table:block group-has-[[data-col="5"][data-resizing="true"]]/table:block',
  6: 'group-has-[[data-col="6"]:hover]/table:block group-has-[[data-col="6"][data-resizing="true"]]/table:block',
  7: 'group-has-[[data-col="7"]:hover]/table:block group-has-[[data-col="7"][data-resizing="true"]]/table:block',
  8: 'group-has-[[data-col="8"]:hover]/table:block group-has-[[data-col="8"][data-resizing="true"]]/table:block',
  9: 'group-has-[[data-col="9"]:hover]/table:block group-has-[[data-col="9"][data-resizing="true"]]/table:block',
  10: 'group-has-[[data-col="10"]:hover]/table:block group-has-[[data-col="10"][data-resizing="true"]]/table:block',
};

function getColumnResizeClass(colIndex: number) {
  return COLUMN_RESIZE_CLASSES[colIndex] ?? "";
}
