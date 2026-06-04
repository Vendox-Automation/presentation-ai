import { type TElement } from "platejs";
import { createTPlatePlugin } from "platejs/react";

import BoxGroup from "../custom-elements/box";
import { BoxItem } from "../custom-elements/box-item";
import { BOX_GROUP, BOX_ITEM } from "../lib";

export const BoxGroupPlugin = createTPlatePlugin({
  key: BOX_GROUP,
  node: {
    isElement: true,
    type: BOX_GROUP,
    component: BoxGroup,
  },
});

export const BoxItemPlugin = createTPlatePlugin({
  key: BOX_ITEM,
  node: {
    isElement: true,
    isStrictSiblings: true,
    type: BOX_ITEM,
    component: BoxItem,
  },
});

export type TBoxGroupElement = TElement & {
  type: typeof BOX_GROUP;
  columnSize?: "sm" | "md" | "lg" | "xl";
  boxType?:
    | "outline"
    | "icon"
    | "solid"
    | "sideline"
    | "side-label"
    | "top-label"
    | "top-circle"
    | "joined"
    | "joined-icon"
    | "leaf"
    | "labeled"
    | "alternating";
  numbered?: boolean;
  alignment?: "left" | "center" | "right";
  orientation?: "horizontal" | "vertical";
};
export type TBoxItemElement = TElement & {
  type: typeof BOX_ITEM;
  icon?: string;
  alignment?: "left" | "center" | "right";
};
