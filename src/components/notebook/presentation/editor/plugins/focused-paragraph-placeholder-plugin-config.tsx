"use client";

import { KEYS } from "platejs";
import { createTPlatePlugin, type RenderNodeWrapper } from "platejs/react";

import { FocusedParagraphPlaceholder } from "./focused-paragraph-placeholder-plugin";

const focusedParagraphPlaceholderWrapper: RenderNodeWrapper = (props) => {
  const { element } = props;

  if (element.type !== KEYS.p) {
    return ({ children }) => children;
  }

  return (wrapperProps) => <FocusedParagraphPlaceholder {...wrapperProps} />;
};

export const FocusedParagraphPlaceholderPlugin = createTPlatePlugin({
  key: "focusedParagraphPlaceholder",
  editOnly: true,
  render: {
    aboveNodes: focusedParagraphPlaceholderWrapper,
  },
});
