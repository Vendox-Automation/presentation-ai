import {
  DndPlugin,
  type DragItemNode,
  type DropLineDirection,
  type ElementDragItemNode,
} from "@platejs/dnd";
import { PathApi, type NodeEntry, type Path, type TElement } from "platejs";
import { type PlateEditor } from "platejs/react";
import { type RefObject } from "react";

import { type CanDropCallback } from "../hooks/useDropNode";
import { getDropPathFromDirection, type DropPathResult } from "./getDropPath";

export type DropOrientation = "horizontal" | "vertical";

type ResolvedDropLineDirection = Exclude<DropLineDirection, "">;

type PointerCoordinates = {
  clientX: number;
  clientY: number;
};

export type FreeformDropRegistration = {
  canCreateColumns: boolean;
  canDropNode?: CanDropCallback;
  element: TElement;
  id: string;
  nodeRef: RefObject<HTMLElement | null>;
  orientation: DropOrientation;
};

export type FreeformDropTarget = {
  direction: ResolvedDropLineDirection;
  dropPath: DropPathResult;
  element: TElement;
  id: string;
  nodeRef: RefObject<HTMLElement | null>;
};

type FreeformDropCandidate = {
  dropElement: TElement;
  dropPath: Path;
  orientation: DropOrientation;
  rect: DOMRect;
  registration: FreeformDropRegistration;
};

type FreeformDragSnapshot = {
  candidates: FreeformDropCandidate[];
  draggedEntries: NodeEntry<TElement>[];
  primaryDragPath: Path | undefined;
  resolvedDragItem: ElementDragItemNode;
};

type ActiveFreeformDrag = {
  cleanup: () => void;
  dragItem: ElementDragItemNode;
  frameId: number | null;
  lastCoordinates: PointerCoordinates | null;
  lastTarget: FreeformDropTarget | null;
  snapshot: FreeformDragSnapshot;
};

const COLUMN_EDGE_THRESHOLD_RATIO = 0.18;
const MIN_COLUMN_EDGE_THRESHOLD_PX = 44;
const MAX_COLUMN_EDGE_THRESHOLD_PX = 96;
const EDITOR_DROP_BOUNDARY_PADDING_PX = 36;
const SAME_PARENT_SCORE_BONUS = 18;
const TARGET_DEPTH_SCORE_BONUS = 14;
const INSIDE_TARGET_SCORE_BONUS = 22;
const registrationsByEditorId = new Map<
  string,
  Map<symbol, FreeformDropRegistration>
>();
const activeDragsByEditorId = new Map<string, ActiveFreeformDrag>();

export function registerFreeformDropNode(
  editor: PlateEditor,
  registration: FreeformDropRegistration,
): () => void {
  const key = Symbol(registration.id);
  const editorRegistrations =
    registrationsByEditorId.get(editor.id) ??
    new Map<symbol, FreeformDropRegistration>();

  editorRegistrations.set(key, registration);
  registrationsByEditorId.set(editor.id, editorRegistrations);

  return () => {
    editorRegistrations.delete(key);

    if (editorRegistrations.size === 0) {
      registrationsByEditorId.delete(editor.id);
    }
  };
}

export function startFreeformDrag(
  editor: PlateEditor,
  dragItem: ElementDragItemNode,
): void {
  stopFreeformDrag(editor, { clearDropTarget: false });

  const activeDrag: ActiveFreeformDrag = {
    cleanup: () => undefined,
    dragItem,
    frameId: null,
    lastCoordinates: null,
    lastTarget: null,
    snapshot: createFreeformDragSnapshot(editor, dragItem),
  };

  const syncFromEvent = (event: DragEvent) => {
    if (event.clientX === 0 && event.clientY === 0) return;

    activeDrag.lastCoordinates = {
      clientX: event.clientX,
      clientY: event.clientY,
    };

    if (activeDrag.frameId !== null) return;

    activeDrag.frameId = window.requestAnimationFrame(() => {
      activeDrag.frameId = null;

      if (!activeDrag.lastCoordinates) return;

      activeDrag.lastTarget = syncFreeformDropTarget(editor, dragItem, {
        coordinates: activeDrag.lastCoordinates,
      });
    });
  };

  window.addEventListener("drag", syncFromEvent, true);
  window.addEventListener("dragover", syncFromEvent, true);
  window.addEventListener("drop", syncFromEvent, true);

  activeDrag.cleanup = () => {
    window.removeEventListener("drag", syncFromEvent, true);
    window.removeEventListener("dragover", syncFromEvent, true);
    window.removeEventListener("drop", syncFromEvent, true);

    if (activeDrag.frameId !== null) {
      window.cancelAnimationFrame(activeDrag.frameId);
      activeDrag.frameId = null;
    }
  };

  activeDragsByEditorId.set(editor.id, activeDrag);
}

export function stopFreeformDrag(
  editor: PlateEditor,
  { clearDropTarget = true }: { clearDropTarget?: boolean } = {},
): void {
  const activeDrag = activeDragsByEditorId.get(editor.id);

  if (activeDrag) {
    activeDrag.cleanup();
    activeDragsByEditorId.delete(editor.id);
  }

  if (clearDropTarget) {
    setEditorDropTarget(editor, null);
  }
}

export function getActiveFreeformDropTarget(
  editor: PlateEditor,
): FreeformDropTarget | null {
  return activeDragsByEditorId.get(editor.id)?.lastTarget ?? null;
}

export function syncFreeformDropTargetFromClientOffset(
  editor: PlateEditor,
  dragItem: DragItemNode,
  clientOffset: { x: number; y: number } | null,
): FreeformDropTarget | null | undefined {
  if (!clientOffset || !isElementDragItem(dragItem)) return undefined;

  const target = syncFreeformDropTarget(editor, dragItem, {
    coordinates: {
      clientX: clientOffset.x,
      clientY: clientOffset.y,
    },
  });
  const activeDrag = activeDragsByEditorId.get(editor.id);

  if (activeDrag) {
    activeDrag.lastCoordinates = {
      clientX: clientOffset.x,
      clientY: clientOffset.y,
    };
    activeDrag.lastTarget = target;
  }

  return target;
}

function resolveFreeformDropTarget(
  editor: PlateEditor,
  dragItem: ElementDragItemNode,
  { coordinates }: { coordinates: PointerCoordinates },
): FreeformDropTarget | null {
  if (!isPointInsideEditor(editor, coordinates)) return null;

  const snapshot =
    activeDragsByEditorId.get(editor.id)?.snapshot ??
    createFreeformDragSnapshot(editor, dragItem);
  let bestTarget: FreeformDropTarget | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  snapshot.candidates.forEach(
    ({ dropElement, dropPath, orientation, rect, registration }) => {
      const direction = getCandidateDirection({
        coordinates,
        orientation,
        rect,
        registration,
      });
      const dropPathResult = getDropPathFromDirection(editor, {
        canCreateColumns: registration.canCreateColumns,
        canDropNode: registration.canDropNode,
        direction,
        dragItem: snapshot.resolvedDragItem,
        element: dropElement,
      });

      if (!dropPathResult) return;

      const score = getCandidateScore({
        coordinates,
        direction,
        dropPath,
        primaryDragPath: snapshot.primaryDragPath,
        rect,
        registration,
      });

      if (score < bestScore) {
        bestScore = score;
        bestTarget = {
          direction,
          dropPath: dropPathResult,
          element: dropElement,
          id: registration.id,
          nodeRef: registration.nodeRef,
        };
      }
    },
  );

  return bestTarget;
}

function syncFreeformDropTarget(
  editor: PlateEditor,
  dragItem: ElementDragItemNode,
  { coordinates }: { coordinates: PointerCoordinates },
): FreeformDropTarget | null {
  const target = resolveFreeformDropTarget(editor, dragItem, { coordinates });

  setEditorDropTarget(editor, target);

  return target;
}

function setEditorDropTarget(
  editor: PlateEditor,
  target: FreeformDropTarget | null,
): void {
  const current = editor.getOptions(DndPlugin).dropTarget;
  const nextDropTarget = target
    ? { id: target.id, line: target.direction }
    : { id: null, line: "" as DropLineDirection };

  if (
    current?.id === nextDropTarget.id &&
    current?.line === nextDropTarget.line
  ) {
    return;
  }

  editor.setOption(DndPlugin, "dropTarget", nextDropTarget);
}

function isElementDragItem(
  dragItem: DragItemNode | undefined,
): dragItem is ElementDragItemNode {
  return Boolean(
    dragItem &&
    "id" in dragItem &&
    "element" in dragItem &&
    "editorId" in dragItem,
  );
}

function getResolvedDragItem(
  editor: PlateEditor,
  dragItem: ElementDragItemNode,
): ElementDragItemNode {
  const primaryDragId = getDraggedIds(dragItem)[0];

  if (!primaryDragId) return dragItem;

  const freshEntry = getElementEntryById(editor, primaryDragId);

  if (!freshEntry) return dragItem;

  return {
    ...dragItem,
    element: freshEntry[0],
  };
}

function getDraggedEntries(
  editor: PlateEditor,
  dragItem: ElementDragItemNode,
): NodeEntry<TElement>[] {
  return getDraggedIds(dragItem)
    .map((id) => getElementEntryById(editor, id))
    .filter((entry): entry is NodeEntry<TElement> => Boolean(entry));
}

function getDraggedIds(dragItem: ElementDragItemNode): string[] {
  return Array.isArray(dragItem.id) ? dragItem.id : [dragItem.id];
}

function createFreeformDragSnapshot(
  editor: PlateEditor,
  dragItem: ElementDragItemNode,
): FreeformDragSnapshot {
  const resolvedDragItem = getResolvedDragItem(editor, dragItem);
  const draggedEntries = getDraggedEntries(editor, resolvedDragItem);
  const primaryDragPath = draggedEntries[0]?.[1];
  const groupedRegistrations = getGroupedRegistrations(editor.id);
  const candidatesWithoutOrientation: Array<
    Omit<FreeformDropCandidate, "orientation">
  > = [];

  groupedRegistrations.forEach((registrations) => {
    const preferred = selectPreferredRegistrationWithRect(registrations);

    if (!preferred) return;

    const { rect, registration } = preferred;
    const dropEntry = getElementEntryById(editor, registration.id);

    if (!dropEntry) return;

    const [dropElement, dropPath] = dropEntry;

    if (
      draggedEntries.some(([, dragPath]) =>
        PathApi.isAncestor(dragPath, dropPath),
      )
    ) {
      return;
    }

    candidatesWithoutOrientation.push({
      dropElement,
      dropPath,
      rect,
      registration,
    });
  });

  const candidates = candidatesWithoutOrientation.map((candidate) => ({
    ...candidate,
    orientation: getResolvedDropOrientationFromCandidates({
      candidates: candidatesWithoutOrientation,
      fallbackOrientation: candidate.registration.orientation,
      path: candidate.dropPath,
    }),
  }));

  return {
    candidates,
    draggedEntries,
    primaryDragPath,
    resolvedDragItem,
  };
}

function getElementEntryById(
  editor: PlateEditor,
  id: string,
): NodeEntry<TElement> | undefined {
  const entry = editor.api.node({ id, at: [] }) as
    | NodeEntry<TElement>
    | undefined;

  if (!entry || !isElementNode(entry[0])) return undefined;

  return entry;
}

function isElementNode(node: unknown): node is TElement {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    "children" in node
  );
}

function getGroupedRegistrations(
  editorId: string,
): Map<string, FreeformDropRegistration[]> {
  const editorRegistrations = registrationsByEditorId.get(editorId);
  const grouped = new Map<string, FreeformDropRegistration[]>();

  editorRegistrations?.forEach((registration) => {
    const group = grouped.get(registration.id) ?? [];
    group.push(registration);
    grouped.set(registration.id, group);
  });

  return grouped;
}

function selectPreferredRegistrationWithRect(
  registrations: FreeformDropRegistration[],
): { rect: DOMRect; registration: FreeformDropRegistration } | undefined {
  let best:
    | { rect: DOMRect; registration: FreeformDropRegistration; score: number }
    | undefined;

  registrations.forEach((registration) => {
    const node = registration.nodeRef.current;

    if (!node?.isConnected) return;

    const rect = node.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) return;

    const score = getRegistrationScore(registration, rect);

    if (!best || score > best.score) {
      best = { rect, registration, score };
    }
  });

  return best;
}

function getRegistrationScore(
  registration: FreeformDropRegistration,
  rect: DOMRect,
): number {
  const area = rect.width * rect.height;

  return (
    (registration.canDropNode ? 10_000_000 : 0) +
    (registration.canCreateColumns ? 1_000_000 : 0) +
    area
  );
}

function getCandidateDirection({
  coordinates,
  orientation,
  rect,
  registration,
}: {
  coordinates: PointerCoordinates;
  orientation: DropOrientation;
  rect: DOMRect;
  registration: FreeformDropRegistration;
}): ResolvedDropLineDirection {
  if (
    registration.canCreateColumns &&
    isPointInsideRect(coordinates, rect) &&
    orientation === "vertical"
  ) {
    const threshold = Math.min(
      Math.max(
        rect.width * COLUMN_EDGE_THRESHOLD_RATIO,
        MIN_COLUMN_EDGE_THRESHOLD_PX,
      ),
      MAX_COLUMN_EDGE_THRESHOLD_PX,
    );

    if (coordinates.clientX <= rect.left + threshold) return "left";
    if (coordinates.clientX >= rect.right - threshold) return "right";
  }

  if (orientation === "horizontal") {
    return coordinates.clientX < rect.left + rect.width / 2 ? "left" : "right";
  }

  return coordinates.clientY < rect.top + rect.height / 2 ? "top" : "bottom";
}

function getResolvedDropOrientationFromCandidates({
  candidates,
  fallbackOrientation,
  path,
}: {
  candidates: Array<Omit<FreeformDropCandidate, "orientation">>;
  fallbackOrientation: DropOrientation;
  path: Path;
}): DropOrientation {
  const parentPath = PathApi.parent(path);
  const siblingRects = candidates
    .filter((candidate) =>
      PathApi.equals(PathApi.parent(candidate.dropPath), parentPath),
    )
    .map((candidate) => candidate.rect);

  if (siblingRects.length < 2) return fallbackOrientation;

  const centers = siblingRects.map((rect) => ({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  }));
  const minX = Math.min(...centers.map((center) => center.x));
  const maxX = Math.max(...centers.map((center) => center.x));
  const minY = Math.min(...centers.map((center) => center.y));
  const maxY = Math.max(...centers.map((center) => center.y));
  const xSpread = maxX - minX;
  const ySpread = maxY - minY;

  return ySpread > xSpread ? "vertical" : "horizontal";
}

function getCandidateScore({
  coordinates,
  direction,
  dropPath,
  primaryDragPath,
  rect,
  registration,
}: {
  coordinates: PointerCoordinates;
  direction: ResolvedDropLineDirection;
  dropPath: Path;
  primaryDragPath: Path | undefined;
  rect: DOMRect;
  registration: FreeformDropRegistration;
}): number {
  const insertionLineDistance =
    direction === "left"
      ? Math.abs(coordinates.clientX - rect.left)
      : direction === "right"
        ? Math.abs(coordinates.clientX - rect.right)
        : direction === "top"
          ? Math.abs(coordinates.clientY - rect.top)
          : Math.abs(coordinates.clientY - rect.bottom);
  const crossAxisDistance =
    direction === "left" || direction === "right"
      ? distanceToRange(coordinates.clientY, rect.top, rect.bottom)
      : distanceToRange(coordinates.clientX, rect.left, rect.right);
  const sameParentBonus =
    primaryDragPath &&
    PathApi.equals(PathApi.parent(primaryDragPath), PathApi.parent(dropPath))
      ? SAME_PARENT_SCORE_BONUS
      : 0;
  const columnCreationBonus =
    registration.canCreateColumns &&
    (direction === "left" || direction === "right")
      ? SAME_PARENT_SCORE_BONUS
      : 0;
  const depthBonus = dropPath.length * TARGET_DEPTH_SCORE_BONUS;
  const insideTargetBonus = isPointInsideRect(coordinates, rect)
    ? INSIDE_TARGET_SCORE_BONUS
    : 0;

  return (
    insertionLineDistance +
    crossAxisDistance * 0.35 -
    sameParentBonus -
    columnCreationBonus -
    depthBonus -
    insideTargetBonus
  );
}

function distanceToRange(value: number, start: number, end: number): number {
  if (value < start) return start - value;
  if (value > end) return value - end;

  return 0;
}

function isPointInsideRect(
  { clientX, clientY }: PointerCoordinates,
  rect: DOMRect,
): boolean {
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function isPointInsideEditor(
  editor: PlateEditor,
  { clientX, clientY }: PointerCoordinates,
): boolean {
  try {
    const editorNode = editor.api.toDOMNode(editor);

    if (!(editorNode instanceof HTMLElement)) return false;

    const rect = editorNode.getBoundingClientRect();

    return (
      clientX >= rect.left - EDITOR_DROP_BOUNDARY_PADDING_PX &&
      clientX <= rect.right + EDITOR_DROP_BOUNDARY_PADDING_PX &&
      clientY >= rect.top - EDITOR_DROP_BOUNDARY_PADDING_PX &&
      clientY <= rect.bottom + EDITOR_DROP_BOUNDARY_PADDING_PX
    );
  } catch {
    return false;
  }
}
