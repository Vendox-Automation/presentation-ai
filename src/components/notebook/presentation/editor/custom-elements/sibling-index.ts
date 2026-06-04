import {
  NodeApi,
  PathApi,
  type NodeEntry,
  type Path,
  type TElement,
} from "platejs";
import { type PlateEditor } from "platejs/react";

type ElementWithOptionalId = TElement & {
  id?: unknown;
};

function findCurrentElementPath(
  editor: PlateEditor,
  element: TElement,
): Path | undefined {
  const elementId = (element as ElementWithOptionalId).id;

  if (typeof elementId === "string") {
    const entry = editor.api.node({
      id: elementId,
      at: [],
    }) as NodeEntry<TElement> | undefined;

    if (entry) return entry[1];
  }

  return editor.api.findPath(element);
}

export function getSiblingIndexContext<TParentElement extends TElement>(
  editor: PlateEditor,
  element: TElement,
  fallbackPath: Path,
) {
  const elementPath = findCurrentElementPath(editor, element) ?? fallbackPath;
  const parentPath = PathApi.parent(elementPath);
  const parentElement = NodeApi.get(editor, parentPath) as
    | TParentElement
    | undefined;
  const index = elementPath.at(-1) ?? fallbackPath.at(-1) ?? 0;

  return {
    elementPath,
    index,
    parentElement,
    parentPath,
  };
}
