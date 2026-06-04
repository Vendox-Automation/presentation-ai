"use client";

import {
  BlockquotePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  H4Plugin,
  H5Plugin,
  H6Plugin,
  HorizontalRulePlugin,
} from "@platejs/basic-nodes/react";
import { createPlatePlugin, ParagraphPlugin } from "platejs/react";

import { BlockquoteElement } from "@/components/plate/ui/blockquote-node";
import { HrElement } from "@/components/plate/ui/hr-node";
import ContributorElement from "../custom-elements/contributor";
import LabelElement from "../custom-elements/label";
import {
  H1Element,
  H2Element,
  H3Element,
  H4Element,
  H5Element,
  H6Element,
} from "../custom-elements/presentation-heading-element";
import { PresentationParagraphElement } from "../custom-elements/presentation-paragraph-element";
import PresentationTitleElement from "../custom-elements/presentation-title";
import {
  CONTRIBUTOR_ELEMENT,
  LABEL_ELEMENT,
  PRESENTATION_TITLE_ELEMENT,
} from "../lib";

const presentationTitleRules = {
  break: { empty: "reset" as const },
};

const PresentationTitlePlugin = createPlatePlugin({
  key: PRESENTATION_TITLE_ELEMENT,
  node: {
    isElement: true,
    component: PresentationTitleElement,
  },
  rules: {
    break: presentationTitleRules.break,
  },
});

const LabelPlugin = createPlatePlugin({
  key: LABEL_ELEMENT,
  node: {
    isElement: true,
    component: LabelElement,
  },
});

const ContributorPlugin = createPlatePlugin({
  key: CONTRIBUTOR_ELEMENT,
  node: {
    isElement: true,
    isVoid: true,
    component: ContributorElement,
  },
});

export const BasicBlocksKit = [
  ParagraphPlugin.withComponent(PresentationParagraphElement),
  PresentationTitlePlugin,
  LabelPlugin,
  ContributorPlugin,
  H1Plugin.configure({
    node: {
      component: H1Element,
    },
    rules: {
      break: { empty: "reset" },
    },
    shortcuts: { toggle: { keys: "mod+alt+1" } },
  }),
  H2Plugin.configure({
    node: {
      component: H2Element,
    },
    rules: {
      break: { empty: "reset" },
    },
    shortcuts: { toggle: { keys: "mod+alt+2" } },
  }),
  H3Plugin.configure({
    node: {
      component: H3Element,
    },
    rules: {
      break: { empty: "reset" },
    },
    shortcuts: { toggle: { keys: "mod+alt+3" } },
  }),
  H4Plugin.configure({
    node: {
      component: H4Element,
    },
    rules: {
      break: { empty: "reset" },
    },
    shortcuts: { toggle: { keys: "mod+alt+4" } },
  }),
  H5Plugin.configure({
    node: {
      component: H5Element,
    },
    rules: {
      break: { empty: "reset" },
    },
    shortcuts: { toggle: { keys: "mod+alt+5" } },
  }),
  H6Plugin.configure({
    node: {
      component: H6Element,
    },
    rules: {
      break: { empty: "reset" },
    },
    shortcuts: { toggle: { keys: "mod+alt+6" } },
  }),
  BlockquotePlugin.configure({
    node: { component: BlockquoteElement },
    shortcuts: { toggle: { keys: "mod+shift+period" } },
  }),
  HorizontalRulePlugin.configure({
    node: { component: HrElement },
  }),
];
