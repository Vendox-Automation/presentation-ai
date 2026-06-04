"use client";

import { BlockSelectionPlugin } from "@platejs/selection/react";
import { getCellTypes } from "@platejs/table";
import {
  TablePlugin,
  useTableBordersDropdownMenuContentState,
  useTableMergeState,
} from "@platejs/table/react";
import type * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CombineIcon,
  EraserIcon,
  Grid2X2Icon,
  PaintBucketIcon,
  SquareSplitHorizontalIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import {
  ElementApi,
  KEYS,
  type NodeEntry,
  type Path,
  type TElement,
} from "platejs";
import {
  useEditorPlugin,
  useEditorRef,
  useEditorSelector,
  usePluginOption,
} from "platejs/react";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from "@/components/plate/ui/dropdown-menu";
import {
  BorderAllIcon,
  BorderBottomIcon,
  BorderLeftIcon,
  BorderNoneIcon,
  BorderRightIcon,
  BorderTopIcon,
} from "@/components/plate/ui/table-icons";
import { ToolbarButton, ToolbarGroup } from "@/components/plate/ui/toolbar";
import ColorPicker from "@/components/ui/color-picker";
import { cn } from "@/lib/utils";
import { FLOATING_TOOLBAR_IGNORE_CLASS } from "./toolbar-interaction";

type TableBlockEntry = NodeEntry<TElement>;
type TableSelectionScope = "table" | "row" | "cell";

const DEFAULT_TABLE_PICKER_COLOR = "#3b82f6";

function isTableElement(element: TElement | undefined) {
  return element?.type === KEYS.table;
}

function isRowElement(element: TElement | undefined) {
  return element?.type === KEYS.tr;
}

function getElementBackground(element: TElement | undefined) {
  const background = element?.background;
  return typeof background === "string"
    ? background
    : DEFAULT_TABLE_PICKER_COLOR;
}

export function PresentationTableToolbarControls() {
  const { editor, tf } = useEditorPlugin(TablePlugin);
  const isSelectionInTable = useEditorSelector(
    (currentEditor) => currentEditor.api.some({ match: { type: KEYS.table } }),
    [],
  );
  const selectedIds = usePluginOption(BlockSelectionPlugin, "selectedIds");
  const selectedCells = usePluginOption(TablePlugin, "selectedCells");
  const { canMerge, canSplit } = useTableMergeState();

  const selectedBlockEntry = React.useMemo<TableBlockEntry | undefined>(() => {
    for (const blockId of selectedIds ?? []) {
      const entry = editor.api.node({
        at: [],
        id: String(blockId),
      }) as TableBlockEntry | undefined;
      const [element] = entry ?? [];

      if (isTableElement(element) || isRowElement(element)) return entry;
    }

    return undefined;
  }, [editor, selectedIds]);

  const selectedTableEntry = React.useMemo<TableBlockEntry | undefined>(() => {
    const [selectedElement, selectedPath] = selectedBlockEntry ?? [];

    if (isTableElement(selectedElement)) return selectedBlockEntry;

    if (isRowElement(selectedElement) && selectedPath) {
      const tablePath = selectedPath.slice(0, -1);
      const tableElement = editor.api.node({ at: tablePath })?.[0];

      if (ElementApi.isElement(tableElement) && isTableElement(tableElement)) {
        return [tableElement, tablePath];
      }
    }

    const tableEntry = editor.api.above({
      match: { type: KEYS.table },
    }) as TableBlockEntry | undefined;

    return tableEntry;
  }, [editor, selectedBlockEntry]);

  const selectedRowEntry = React.useMemo<TableBlockEntry | undefined>(() => {
    const [selectedElement] = selectedBlockEntry ?? [];

    if (isRowElement(selectedElement)) return selectedBlockEntry;

    return editor.api.above({
      match: { type: KEYS.tr },
    }) as TableBlockEntry | undefined;
  }, [editor, selectedBlockEntry]);

  const hasSelectedCells = (selectedCells?.length ?? 0) > 0;
  const blockScope = isTableElement(selectedBlockEntry?.[0])
    ? "table"
    : isRowElement(selectedBlockEntry?.[0])
      ? "row"
      : undefined;
  const scope: TableSelectionScope =
    blockScope ?? (hasSelectedCells || isSelectionInTable ? "cell" : "table");
  const tableSelected = Boolean(selectedTableEntry) || isSelectionInTable;
  const cellToolbarActive = scope === "cell";
  const rowToolbarActive = scope === "row";
  const tableToolbarActive = scope === "table";
  const colorTooltip =
    scope === "table"
      ? "Table background"
      : scope === "row"
        ? "Row background"
        : "Cell background";
  const pickerColor = getElementBackground(
    scope === "row"
      ? selectedRowEntry?.[0]
      : scope === "table"
        ? selectedTableEntry?.[0]
        : selectedCells?.[0],
  );

  const getFirstCellPath = React.useCallback(
    (tableEntry: TableBlockEntry | undefined): Path | undefined => {
      const [tableElement, tablePath] = tableEntry ?? [];
      if (!tableElement || !tablePath) return undefined;

      for (
        let rowIndex = 0;
        rowIndex < tableElement.children.length;
        rowIndex += 1
      ) {
        const row = tableElement.children[rowIndex];
        if (!ElementApi.isElement(row)) continue;

        for (
          let cellIndex = 0;
          cellIndex < row.children.length;
          cellIndex += 1
        ) {
          const cell = row.children[cellIndex];
          if (ElementApi.isElement(cell)) {
            return [...tablePath, rowIndex, cellIndex];
          }
        }
      }

      return undefined;
    },
    [],
  );

  const getLastCellPath = React.useCallback(
    (tableEntry: TableBlockEntry | undefined): Path | undefined => {
      const [tableElement, tablePath] = tableEntry ?? [];
      if (!tableElement || !tablePath) return undefined;

      for (
        let rowIndex = tableElement.children.length - 1;
        rowIndex >= 0;
        rowIndex -= 1
      ) {
        const row = tableElement.children[rowIndex];
        if (!ElementApi.isElement(row)) continue;

        for (
          let cellIndex = row.children.length - 1;
          cellIndex >= 0;
          cellIndex -= 1
        ) {
          const cell = row.children[cellIndex];
          if (ElementApi.isElement(cell)) {
            return [...tablePath, rowIndex, cellIndex];
          }
        }
      }

      return undefined;
    },
    [],
  );

  const getTargetCellPath = React.useCallback((): Path | undefined => {
    const selectedCell = selectedCells?.[0];

    if (selectedCell) {
      const selectedCellPath = editor.api.findPath(selectedCell);
      if (selectedCellPath) return selectedCellPath;
    }

    const currentCellEntry = editor.api.above({
      match: { type: getCellTypes(editor) },
    }) as NodeEntry<TElement> | undefined;

    return currentCellEntry?.[1] ?? getFirstCellPath(selectedTableEntry);
  }, [editor, getFirstCellPath, selectedCells, selectedTableEntry]);

  const selectTargetCell = React.useCallback(() => {
    const targetCellPath = getTargetCellPath();
    if (!targetCellPath) return false;

    editor.tf.select(targetCellPath);
    return true;
  }, [editor, getTargetCellPath]);

  const updateCellsInEntry = React.useCallback(
    (entry: TableBlockEntry | undefined, color: string | null) => {
      const [element, path] = entry ?? [];
      if (!element || !path) return;

      if (isTableElement(element)) {
        element.children.forEach((row, rowIndex) => {
          if (!ElementApi.isElement(row)) return;

          row.children.forEach((cell, cellIndex) => {
            if (!ElementApi.isElement(cell)) return;

            editor.tf.setNodes(
              { background: color },
              { at: [...path, rowIndex, cellIndex] },
            );
          });
        });
        return;
      }

      if (isRowElement(element)) {
        element.children.forEach((cell, cellIndex) => {
          if (!ElementApi.isElement(cell)) return;

          editor.tf.setNodes(
            { background: color },
            { at: [...path, cellIndex] },
          );
        });
      }
    },
    [editor],
  );

  const updateBackground = React.useCallback(
    (color: string | null) => {
      if (scope === "table") {
        updateCellsInEntry(selectedTableEntry, color);
        editor.tf.focus();
        return;
      }

      if (scope === "row") {
        updateCellsInEntry(selectedRowEntry, color);
        editor.tf.focus();
        return;
      }

      if (selectedCells && selectedCells.length > 0) {
        selectedCells.forEach((cell) => {
          if (!ElementApi.isElement(cell)) return;

          const cellPath = editor.api.findPath(cell);
          if (cellPath) {
            editor.tf.setNodes({ background: color }, { at: cellPath });
          }
        });
        editor.tf.focus();
        return;
      }

      const targetCellPath = getTargetCellPath();
      if (!targetCellPath) return;

      editor.tf.setNodes({ background: color }, { at: targetCellPath });
      editor.tf.focus();
    },
    [
      editor,
      getTargetCellPath,
      scope,
      selectedCells,
      selectedRowEntry,
      selectedTableEntry,
      updateCellsInEntry,
    ],
  );

  const getRowPath = React.useCallback(
    (before?: boolean): Path | undefined => {
      if (selectedRowEntry) return selectedRowEntry[1];

      const currentRowEntry = editor.api.above({
        match: { type: KEYS.tr },
      }) as TableBlockEntry | undefined;

      if (currentRowEntry) return currentRowEntry[1];

      const [tableElement, tablePath] = selectedTableEntry ?? [];
      if (!tableElement || !tablePath) return undefined;

      const rowIndex = before ? 0 : tableElement.children.length - 1;
      return [...tablePath, rowIndex];
    },
    [editor, selectedRowEntry, selectedTableEntry],
  );

  const insertRow = React.useCallback(
    (before?: boolean) => {
      const rowPath = getRowPath(before);

      if (rowPath) {
        tf.insert.tableRow({ before, fromRow: rowPath, select: true });
      } else {
        tf.insert.tableRow({ before, select: true });
      }

      editor.tf.focus();
    },
    [editor, getRowPath, tf],
  );

  const insertColumn = React.useCallback(
    (before?: boolean) => {
      const targetCellPath =
        scope === "table" && !isSelectionInTable
          ? before
            ? getFirstCellPath(selectedTableEntry)
            : getLastCellPath(selectedTableEntry)
          : getTargetCellPath();

      if (targetCellPath) {
        tf.insert.tableColumn({
          before,
          fromCell: targetCellPath,
          select: true,
        });
      } else {
        tf.insert.tableColumn({ before, select: true });
      }

      editor.tf.focus();
    },
    [
      editor,
      getFirstCellPath,
      getLastCellPath,
      getTargetCellPath,
      isSelectionInTable,
      scope,
      selectedTableEntry,
      tf,
    ],
  );

  const runCellScopedAction = React.useCallback(
    (action: () => void) => {
      if (!hasSelectedCells && !selectTargetCell()) return;

      action();
      editor.tf.focus();
    },
    [editor, hasSelectedCells, selectTargetCell],
  );

  const removeSelectedTable = React.useCallback(() => {
    if (selectedTableEntry) {
      editor.tf.removeNodes({ at: selectedTableEntry[1] });
    } else {
      tf.remove.table();
    }

    editor.tf.focus();
  }, [editor, selectedTableEntry, tf]);

  return (
    <>
      <ToolbarGroup>
        <ColorPicker value={pickerColor} onChange={updateBackground}>
          <ToolbarButton
            disabled={!tableSelected}
            size="sm"
            tooltip={colorTooltip}
          >
            <PaintBucketIcon className="h-4 w-4" />
          </ToolbarButton>
        </ColorPicker>
        <ToolbarButton
          disabled={!tableSelected}
          onClick={() => updateBackground(null)}
          onMouseDown={(event) => event.preventDefault()}
          size="sm"
          tooltip="Clear background"
        >
          <EraserIcon className="h-4 w-4" />
        </ToolbarButton>
      </ToolbarGroup>

      {cellToolbarActive && (
        <ToolbarGroup>
          <ToolbarButton
            disabled={!canMerge}
            onClick={() => runCellScopedAction(() => tf.table.merge())}
            onMouseDown={(event) => event.preventDefault()}
            size="sm"
            tooltip="Merge selected cells"
          >
            <CombineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            disabled={!canSplit}
            onClick={() => runCellScopedAction(() => tf.table.split())}
            onMouseDown={(event) => event.preventDefault()}
            size="sm"
            tooltip="Split merged cell"
          >
            <SquareSplitHorizontalIcon className="h-4 w-4" />
          </ToolbarButton>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <ToolbarButton
                disabled={!tableSelected}
                size="sm"
                tooltip="Cell borders"
              >
                <Grid2X2Icon className="h-4 w-4" />
              </ToolbarButton>
            </DropdownMenuTrigger>

            <DropdownMenuPortal>
              <TableBordersDropdownMenuContent />
            </DropdownMenuPortal>
          </DropdownMenu>
        </ToolbarGroup>
      )}

      {(cellToolbarActive || rowToolbarActive || tableToolbarActive) && (
        <ToolbarGroup>
          <ToolbarButton
            disabled={!tableSelected}
            onClick={() => insertRow(true)}
            onMouseDown={(event) => event.preventDefault()}
            size="sm"
            tooltip="Insert row above"
          >
            <ArrowUp className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            disabled={!tableSelected}
            onClick={() => insertRow()}
            onMouseDown={(event) => event.preventDefault()}
            size="sm"
            tooltip="Insert row below"
          >
            <ArrowDown className="h-4 w-4" />
          </ToolbarButton>
          {(cellToolbarActive || rowToolbarActive) && (
            <ToolbarButton
              disabled={!tableSelected}
              onClick={() => runCellScopedAction(() => tf.remove.tableRow())}
              onMouseDown={(event) => event.preventDefault()}
              size="sm"
              tooltip="Delete row"
            >
              <XIcon className="h-4 w-4" />
            </ToolbarButton>
          )}
        </ToolbarGroup>
      )}

      {(cellToolbarActive || tableToolbarActive) && (
        <ToolbarGroup>
          <ToolbarButton
            disabled={!tableSelected}
            onClick={() => insertColumn(true)}
            onMouseDown={(event) => event.preventDefault()}
            size="sm"
            tooltip="Insert column left"
          >
            <ArrowLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            disabled={!tableSelected}
            onClick={() => insertColumn()}
            onMouseDown={(event) => event.preventDefault()}
            size="sm"
            tooltip="Insert column right"
          >
            <ArrowRight className="h-4 w-4" />
          </ToolbarButton>
          {cellToolbarActive && (
            <ToolbarButton
              disabled={!tableSelected}
              onClick={() => runCellScopedAction(() => tf.remove.tableColumn())}
              onMouseDown={(event) => event.preventDefault()}
              size="sm"
              tooltip="Delete column"
            >
              <XIcon className="h-4 w-4" />
            </ToolbarButton>
          )}
        </ToolbarGroup>
      )}

      {tableToolbarActive && (
        <ToolbarGroup>
          <ToolbarButton
            disabled={!tableSelected}
            onClick={removeSelectedTable}
            onMouseDown={(event) => event.preventDefault()}
            size="sm"
            tooltip="Delete table"
          >
            <Trash2Icon className="h-4 w-4" />
          </ToolbarButton>
        </ToolbarGroup>
      )}
    </>
  );
}

function TableBordersDropdownMenuContent(
  props: React.ComponentProps<typeof DropdownMenuPrimitive.Content>,
) {
  const editor = useEditorRef();
  const {
    getOnSelectTableBorder,
    hasBottomBorder,
    hasLeftBorder,
    hasNoBorders,
    hasOuterBorders,
    hasRightBorder,
    hasTopBorder,
  } = useTableBordersDropdownMenuContentState();

  return (
    <DropdownMenuContent
      align="start"
      className={cn(FLOATING_TOOLBAR_IGNORE_CLASS, "min-w-55")}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        editor.tf.focus();
      }}
      side="right"
      sideOffset={0}
      {...props}
    >
      <DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          checked={hasTopBorder}
          onCheckedChange={getOnSelectTableBorder("top")}
        >
          <BorderTopIcon />
          <div>Top border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasRightBorder}
          onCheckedChange={getOnSelectTableBorder("right")}
        >
          <BorderRightIcon />
          <div>Right border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasBottomBorder}
          onCheckedChange={getOnSelectTableBorder("bottom")}
        >
          <BorderBottomIcon />
          <div>Bottom border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasLeftBorder}
          onCheckedChange={getOnSelectTableBorder("left")}
        >
          <BorderLeftIcon />
          <div>Left border</div>
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>

      <DropdownMenuGroup>
        <DropdownMenuCheckboxItem
          checked={hasNoBorders}
          onCheckedChange={getOnSelectTableBorder("none")}
        >
          <BorderNoneIcon />
          <div>No border</div>
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={hasOuterBorders}
          onCheckedChange={getOnSelectTableBorder("outer")}
        >
          <BorderAllIcon />
          <div>Outside borders</div>
        </DropdownMenuCheckboxItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  );
}
