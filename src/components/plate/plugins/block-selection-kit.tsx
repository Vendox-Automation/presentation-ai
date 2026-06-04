/** biome-ignore-all lint/suspicious/noExplicitAny: This use requires any */
"use client";

import {
  BlockSelectionAfterEditable,
  BlockSelectionPlugin,
} from "@platejs/selection/react";
import { getPluginTypes, KEYS } from "platejs";

import { BlockSelectionFocusBridge } from "@/components/plate/plugins/block-selection-focus-bridge";
import { BlockSelection } from "@/components/plate/ui/block-selection";

export const BlockSelectionKit = [
  BlockSelectionPlugin.configure(({ editor }) => ({
    options: {
      enableContextMenu: false,
      isSelectable: (element) => {
        return !getPluginTypes(editor, [KEYS.codeLine, KEYS.td]).includes(
          element.type,
        );
      },
    },
    render: {
      afterEditable: () => (
        <>
          <BlockSelectionAfterEditable />
          <BlockSelectionFocusBridge />
        </>
      ),
      belowRootNodes: (props) => {
        if (!props.attributes.className?.includes("slate-selectable"))
          return null;

        return <BlockSelection {...(props as any)} />;
      },
    },
  })),
];
