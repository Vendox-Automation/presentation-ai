import { KEYS, NodeApi, type TElement } from "platejs";
import { createTPlatePlugin } from "platejs/react";

const REMOVABLE_EMPTY_BLOCK_TYPES = new Set<string>([
  KEYS.p,
  KEYS.h1,
  KEYS.h2,
  KEYS.h3,
  KEYS.h4,
  KEYS.h5,
  KEYS.h6,
]);

function isRemovableEmptyTextBlock(element: TElement): boolean {
  return (
    REMOVABLE_EMPTY_BLOCK_TYPES.has(element.type) &&
    NodeApi.string(element).trim().length === 0
  );
}

export const EmptyBlockPlugin = createTPlatePlugin({
  key: "only-when-empty",
  handlers: {
    onKeyDown: ({ editor, event }) => {
      if (
        event.defaultPrevented ||
        (event.key !== "Backspace" && event.key !== "Delete") ||
        !editor.api.isCollapsed()
      ) {
        return;
      }

      const blockEntry = editor.api.block();
      if (!blockEntry) return;

      const [block, blockPath] = blockEntry;
      const blockIndex = blockPath[0];

      if (
        blockIndex === undefined ||
        blockPath.length !== 1 ||
        editor.children.length <= 1 ||
        !isRemovableEmptyTextBlock(block)
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const nextSelectionIndex =
        blockIndex < editor.children.length - 1 ? blockIndex : blockIndex - 1;

      editor.tf.removeNodes({ at: blockPath });

      if (nextSelectionIndex >= 0 && editor.children[nextSelectionIndex]) {
        editor.tf.select([nextSelectionIndex]);
      }

      return true;
    },
    onChange: ({ editor, value }) => {
      // Check if the editor effectively has no children or is in an invalid state
      const isEmpty = !value || value.length === 0;
      if (isEmpty) {
        // Insert a default paragraph if completely empty
        editor.tf.insertNode({
          type: "p", // Make sure this matches your paragraph type key
          children: [{ text: "" }],
        });
      }
    },
  },
});
