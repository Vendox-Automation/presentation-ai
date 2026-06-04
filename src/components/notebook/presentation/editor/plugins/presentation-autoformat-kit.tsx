"use client";

import { BlockquoteRules } from "@platejs/basic-nodes";
import { CodeBlockRules } from "@platejs/code-block";
import {
  BulletedListRules,
  OrderedListRules,
  TaskListRules,
} from "@platejs/list";
import { createRuleFactory, KEYS } from "platejs";
import { createPlatePlugin } from "platejs/react";

import {
  PRESENTATION_TITLE_ELEMENT,
  type PresentationTitleVariant,
} from "../lib";

function getPresentationTitleVariant(marker: string): PresentationTitleVariant {
  if (marker === "!!!") return "humongous";
  if (marker === "!!") return "display";
  return "title";
}

const presentationTitleRule = createRuleFactory({
  type: "blockStart",
  trigger: " ",
  match: /^!{1,3}$/,
  apply: ({ editor }, match) => {
    editor.tf.delete({ at: match.range });
    editor.tf.setNodes(
      {
        type: PRESENTATION_TITLE_ELEMENT,
        variant: getPresentationTitleVariant(match.text),
      },
      { match: (node) => editor.api.isBlock(node) },
    );
    return true;
  },
});

const presentationHeadingRule = createRuleFactory<{
  level: 1 | 2 | 3 | 4 | 5 | 6;
}>(({ level }) => ({
  type: "blockStart",
  trigger: " ",
  match: "#".repeat(level),
  node: `h${level}`,
}));

const presentationDividerOnSpaceRule = createRuleFactory({
  type: "blockStart",
  trigger: " ",
  match: /^([-*_])\1{2}$/,
  apply: ({ editor }, match) => {
    editor.tf.delete({ at: match.range });
    editor.tf.setNodes({ type: KEYS.hr });
    editor.tf.insertNodes({
      children: [{ text: "" }],
      type: KEYS.p,
    });
    return true;
  },
});

const presentationDividerOnCharacterRule = createRuleFactory<{
  marker: "-" | "*" | "_";
}>(({ marker }) => ({
  type: "blockStart",
  trigger: marker,
  match: `${marker}${marker}`,
  apply: ({ editor }, match) => {
    editor.tf.delete({ at: match.range });
    editor.tf.setNodes({ type: KEYS.hr });
    editor.tf.insertNodes({
      children: [{ text: "" }],
      type: KEYS.p,
    });
    return true;
  },
}));

export const PresentationAutoformatKit = [
  createPlatePlugin({
    key: "presentation-autoformat",
    inputRules: [
      presentationTitleRule(),
      presentationHeadingRule({ level: 1 }),
      presentationHeadingRule({ level: 2 }),
      presentationHeadingRule({ level: 3 }),
      presentationHeadingRule({ level: 4 }),
      presentationHeadingRule({ level: 5 }),
      presentationHeadingRule({ level: 6 }),
      BlockquoteRules.markdown(),
      BulletedListRules.markdown(),
      BulletedListRules.markdown({ variant: "*" }),
      OrderedListRules.markdown(),
      OrderedListRules.markdown({ variant: ")" }),
      TaskListRules.markdown(),
      TaskListRules.markdown({ checked: true }),
      CodeBlockRules.markdown({ on: "match" }),
      presentationDividerOnCharacterRule({ marker: "-" }),
      presentationDividerOnCharacterRule({ marker: "*" }),
      presentationDividerOnCharacterRule({ marker: "_" }),
      presentationDividerOnSpaceRule(),
    ],
  }),
];
