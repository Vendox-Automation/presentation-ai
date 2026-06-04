import { type TElement } from "platejs";
import { createTPlatePlugin } from "platejs/react";

import StepsElement from "../custom-elements/steps-element";
import { StepsItem } from "../custom-elements/steps-item";
import { STEPS_GROUP, STEPS_ITEM } from "../lib";

export const StepsPlugin = createTPlatePlugin({
  key: STEPS_GROUP,
  node: {
    isElement: true,
    type: STEPS_GROUP,
    component: StepsElement,
  },
});

export const StepsItemPlugin = createTPlatePlugin({
  key: STEPS_ITEM,
  node: {
    isElement: true,
    isStrictSiblings: true,
    type: STEPS_ITEM,
    component: StepsItem,
  },
});

export type TStepsGroupElement = TElement & {
  type: typeof STEPS_GROUP;
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "arrow" | "box";
  columns?: number;
  columnSize?: "sm" | "md" | "lg" | "xl" | string;
  color?: string;
};

export type TStepsItemElement = TElement & {
  type: typeof STEPS_ITEM;
};
