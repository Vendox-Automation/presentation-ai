import {
  NodeApi,
  PathApi,
  type NodeEntry,
  type TElement,
  type TText,
} from "platejs";
import { type PlateEditor } from "platejs/react";

/**
 * Components that require force full sibling updates when their siblings change
 * These components depend on sibling indexes or count for their layout/styling
 */
const COMPONENTS_REQUIRING_SIBLING_UPDATES = [
  "pyramid-item",
  "cycle-item",
  "stair-item",
  "before-after-side",
  "compare-side",
  "timeline-item",
  "arrow-vertical-item",
  "box-item",
  "bullet",
  "cons-item",
  "pros-item",
  "slope-item",
  "connected-circle-item",
  "circular-grid-item",
  "snake-item",
] as const;

type ComponentRequiringSiblingUpdates =
  (typeof COMPONENTS_REQUIRING_SIBLING_UPDATES)[number];

function requiresSiblingUpdates(element: { type?: unknown } | undefined) {
  const type = element?.type;

  return (
    typeof type === "string" &&
    COMPONENTS_REQUIRING_SIBLING_UPDATES.includes(
      type as ComponentRequiringSiblingUpdates,
    )
  );
}

let siblingUpdateSequence = 0;

function getNextSiblingUpdateToken(): number {
  siblingUpdateSequence += 1;

  return Date.now() + siblingUpdateSequence;
}

function getSiblingUpdateToken(): number {
  return getNextSiblingUpdateToken();
}

/**
 * Forces all sibling nodes under the same parent to re-render by touching
 * a `lastUpdate` property on each sibling node. Useful when UI depends on
 * sibling indexes or count (e.g., alternating layouts).
 *
 * Always reads the fresh parent from the editor to avoid stale children counts.
 */
export function updateSiblingsForcefully(
  editor: PlateEditor,
  _parentElement: NodeEntry<TElement | TText>[0] | null,
  parentPath: number[],
) {
  // Always read the fresh parent from the editor to avoid stale children counts
  const freshParent = NodeApi.get(editor, parentPath) as TElement | undefined;

  if (!freshParent?.children || freshParent.children.length === 0) {
    return;
  }

  const childCount = freshParent.children.length;
  const updateTimestamp = getNextSiblingUpdateToken();

  try {
    editor.tf.withoutNormalizing(() => {
      for (let childIndex = 0; childIndex < childCount; childIndex++) {
        const siblingPath = [...parentPath, childIndex];
        try {
          editor.tf.setNodes(
            { lastUpdate: updateTimestamp },
            { at: siblingPath },
          );
        } catch {
          // ignore errors for siblings that might be mid-edit
        }
      }
    });
  } catch {
    // ignore
  }
}

/**
 * Updates siblings for all components that require it after a drop operation.
 * The dropped element's type determines whether sibling updates are needed.
 * When they are, ALL siblings under the same parent get a fresh `lastUpdate` token.
 */
export function updateSiblingsAfterDrop(
  editor: PlateEditor,
  droppedElement: { type: string; id?: string },
  dropPath: number[],
) {
  if (!requiresSiblingUpdates(droppedElement)) return;

  // Get the parent path and read the fresh parent from the editor
  const parentPath = PathApi.parent(dropPath);
  const freshParent = NodeApi.get(editor, parentPath) as TElement | undefined;

  if (!freshParent) return;

  updateSiblingsForcefully(editor, freshParent, parentPath);
}

export function updateDroppedElementAfterDrop(
  editor: PlateEditor,
  dropPath: number[],
) {
  const droppedEntry = editor.api.node({ at: dropPath }) as
    | NodeEntry<TElement>
    | undefined;

  if (!droppedEntry) return;

  editor.tf.setNodes({ lastUpdate: getSiblingUpdateToken() }, { at: dropPath });
  updateSiblingsAfterDrop(editor, droppedEntry[0], droppedEntry[1]);
}

export function updateSiblingsAfterDropById(
  editor: PlateEditor,
  droppedElementId: string,
) {
  const droppedEntry = editor.api.node({
    id: droppedElementId,
    at: [],
  }) as NodeEntry<TElement> | undefined;

  if (!droppedEntry) return;

  updateSiblingsAfterDrop(editor, droppedEntry[0], droppedEntry[1]);
}
