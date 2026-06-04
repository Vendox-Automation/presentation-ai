import { type TElement } from "platejs";
import { createTPlatePlugin } from "platejs/react";

import CircularGrid from "../custom-elements/circular-grid";
import { CircularGridItem } from "../custom-elements/circular-grid-item";
import { ConnectedCircleItem } from "../custom-elements/connected-circle-item";
import ConnectedCircles from "../custom-elements/connected-circles";
import Slope from "../custom-elements/slope";
import { SlopeItem } from "../custom-elements/slope-item";
import Snake from "../custom-elements/snake";
import { SnakeItem } from "../custom-elements/snake-item";
import {
  CIRCULAR_GRID_GROUP,
  CIRCULAR_GRID_ITEM,
  CONNECTED_CIRCLES_GROUP,
  CONNECTED_CIRCLES_ITEM,
  SLOPE_GROUP,
  SLOPE_ITEM,
  SNAKE_GROUP,
  SNAKE_ITEM,
} from "../lib";

export const SlopeGroupPlugin = createTPlatePlugin({
  key: SLOPE_GROUP,
  node: {
    isElement: true,
    type: SLOPE_GROUP,
    component: Slope,
  },
});

export const SlopeItemPlugin = createTPlatePlugin({
  key: SLOPE_ITEM,
  node: {
    isElement: true,
    isStrictSiblings: true,
    type: SLOPE_ITEM,
    component: SlopeItem,
  },
});

export const ConnectedCirclesGroupPlugin = createTPlatePlugin({
  key: CONNECTED_CIRCLES_GROUP,
  node: {
    isElement: true,
    type: CONNECTED_CIRCLES_GROUP,
    component: ConnectedCircles,
  },
});

export const ConnectedCirclesItemPlugin = createTPlatePlugin({
  key: CONNECTED_CIRCLES_ITEM,
  node: {
    isElement: true,
    isStrictSiblings: true,
    type: CONNECTED_CIRCLES_ITEM,
    component: ConnectedCircleItem,
  },
});

export const CircularGridGroupPlugin = createTPlatePlugin({
  key: CIRCULAR_GRID_GROUP,
  node: {
    isElement: true,
    type: CIRCULAR_GRID_GROUP,
    component: CircularGrid,
  },
});

export const CircularGridItemPlugin = createTPlatePlugin({
  key: CIRCULAR_GRID_ITEM,
  node: {
    isElement: true,
    isStrictSiblings: true,
    type: CIRCULAR_GRID_ITEM,
    component: CircularGridItem,
  },
});

export const SnakeGroupPlugin = createTPlatePlugin({
  key: SNAKE_GROUP,
  node: {
    isElement: true,
    type: SNAKE_GROUP,
    component: Snake,
  },
});

export const SnakeItemPlugin = createTPlatePlugin({
  key: SNAKE_ITEM,
  node: {
    isElement: true,
    isStrictSiblings: true,
    type: SNAKE_ITEM,
    component: SnakeItem,
  },
});

export type TSlopeGroupElement = TElement & {
  type: typeof SLOPE_GROUP;
  alignment?: "left" | "center" | "right";
};

export type TSlopeItemElement = TElement & {
  type: typeof SLOPE_ITEM;
  icon?: string;
  alignment?: "left" | "center" | "right";
};

export type TConnectedCirclesGroupElement = TElement & {
  type: typeof CONNECTED_CIRCLES_GROUP;
  alignment?: "left" | "center" | "right";
};

export type TConnectedCirclesItemElement = TElement & {
  type: typeof CONNECTED_CIRCLES_ITEM;
  alignment?: "left" | "center" | "right";
};

export type TCircularGridGroupElement = TElement & {
  type: typeof CIRCULAR_GRID_GROUP;
  alignment?: "left" | "center" | "right";
  centerText?: string;
};

export type TCircularGridItemElement = TElement & {
  type: typeof CIRCULAR_GRID_ITEM;
  alignment?: "left" | "center" | "right";
};

export type TSnakeGroupElement = TElement & {
  type: typeof SNAKE_GROUP;
  alignment?: "left" | "center" | "right";
};

export type TSnakeItemElement = TElement & {
  type: typeof SNAKE_ITEM;
  alignment?: "left" | "center" | "right";
};
