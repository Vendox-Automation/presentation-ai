import { type TElement } from "platejs";
import { createPlatePlugin } from "platejs/react";

import ButtonElement from "../custom-elements/button";
import { BUTTON_ELEMENT, type PresentationElementAlignment } from "../lib";

export const ButtonPlugin = createPlatePlugin({
  key: BUTTON_ELEMENT,
  node: {
    isElement: true,
    component: ButtonElement,
  },
  options: {
    variant: "filled",
    size: "md",
  },
});

export type TButtonElement = TElement & {
  alignment?: PresentationElementAlignment;
  backgroundColor?: string;
  color?: string;
  textColor?: string;
  type: typeof BUTTON_ELEMENT;
  variant?: "filled" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};
