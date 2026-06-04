"use client";

import { DndPlugin } from "@platejs/dnd";
import { PlaceholderPlugin } from "@platejs/media/react";

import { PlateDndOverlay } from "@/components/plate/plugins/plate-dnd-overlay";
import { BlockDraggable } from "@/components/plate/ui/block-draggable";

export const DndKit = [
  DndPlugin.configure({
    options: {
      onDropFiles: ({ dragItem, editor, target }) => {
        editor
          .getTransforms(PlaceholderPlugin)
          .insert.media(dragItem.files, { at: target, nextBlock: false });
      },
    },
    render: {
      aboveEditable: ({ children }) => (
        <PlateDndOverlay>{children}</PlateDndOverlay>
      ),
      aboveNodes: BlockDraggable,
    },
  }),
];
