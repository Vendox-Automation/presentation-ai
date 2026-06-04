"use client";

import { AIChatPlugin } from "@platejs/ai/react";
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  Code2,
  Columns3Icon,
  FileTextIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  HelpCircleIcon,
  InfoIcon,
  LightbulbIcon,
  ListIcon,
  ListOrdered,
  PilcrowIcon,
  Quote,
  RadicalIcon,
  SparklesIcon,
  Square,
  Table,
  TableOfContentsIcon,
  XCircleIcon,
} from "lucide-react";
import { KEYS, type TComboboxInputElement, type TElement } from "platejs";
import {
  PlateElement,
  type PlateEditor,
  type PlateElementProps,
} from "platejs/react";
import type * as React from "react";

import { PRESENTATION_TITLE_ELEMENT } from "@/components/notebook/presentation/editor/lib";
import {
  insertBlock,
  insertInlineElement,
} from "@/components/plate/utils/transforms";
import { type CalloutVariant } from "./callout-variants";
import {
  InlineCombobox,
  InlineComboboxContent,
  InlineComboboxEmpty,
  InlineComboboxGroup,
  InlineComboboxGroupLabel,
  InlineComboboxInput,
  InlineComboboxItem,
} from "./inline-combobox";

type Group = {
  group: string;
  items: Item[];
};

interface Item {
  icon: React.ReactNode;
  value: string;
  onSelect: (editor: PlateEditor, value: string) => void;
  className?: string;
  focusEditor?: boolean;
  keywords?: string[];
  label?: string;
  nodeType?: string;
  props?: Partial<TElement>;
}

type CalloutSlashItem = Omit<Item, "onSelect">;

const calloutItems: Item[] = (
  [
    {
      icon: <FileTextIcon />,
      keywords: ["callout", "note"],
      label: "Note box",
      props: { variant: "note" satisfies CalloutVariant },
      value: "callout-note",
    },
    {
      icon: <InfoIcon />,
      keywords: ["callout", "info"],
      label: "Info box",
      props: { variant: "info" satisfies CalloutVariant },
      value: "callout-info",
    },
    {
      icon: <AlertCircleIcon />,
      keywords: ["callout", "warning", "alert"],
      label: "Warning box",
      props: { variant: "warning" satisfies CalloutVariant },
      value: "callout-warning",
    },
    {
      icon: <XCircleIcon />,
      keywords: ["callout", "caution", "danger"],
      label: "Caution box",
      props: { variant: "caution" satisfies CalloutVariant },
      value: "callout-caution",
    },
    {
      icon: <CheckCircleIcon />,
      keywords: ["callout", "success", "done"],
      label: "Success box",
      props: { variant: "success" satisfies CalloutVariant },
      value: "callout-success",
    },
    {
      icon: <HelpCircleIcon />,
      keywords: ["callout", "question", "help"],
      label: "Question box",
      props: { variant: "question" satisfies CalloutVariant },
      value: "callout-question",
    },
  ] satisfies CalloutSlashItem[]
).map((item) => ({
  ...item,
  nodeType: KEYS.callout,
  onSelect: (editor) => {
    insertBlock(editor, KEYS.callout, {
      props: item.props,
    });
  },
}));

const groups: Group[] = [
  {
    group: "AI",
    items: [
      {
        focusEditor: false,
        icon: <SparklesIcon />,
        value: "AI",
        onSelect: (editor) => {
          editor.getApi(AIChatPlugin).aiChat.show();
        },
      },
    ],
  },
  {
    group: "Basic blocks",
    items: [
      {
        icon: <Heading1Icon />,
        keywords: ["title", "!"],
        label: "Title",
        props: { variant: "title" },
        value: PRESENTATION_TITLE_ELEMENT,
      },
      {
        icon: <Heading2Icon />,
        keywords: ["display", "!!"],
        label: "Display",
        props: { variant: "display" },
        value: "presentation-title-display",
        nodeType: PRESENTATION_TITLE_ELEMENT,
      },
      {
        icon: <Heading3Icon />,
        keywords: ["humongous", "!!!"],
        label: "Humongous",
        props: { variant: "humongous" },
        value: "presentation-title-humongous",
        nodeType: PRESENTATION_TITLE_ELEMENT,
      },
      {
        icon: <PilcrowIcon />,
        keywords: ["paragraph"],
        label: "Text",
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon />,
        keywords: ["title", "h1"],
        label: "Heading 1",
        value: KEYS.h1,
      },
      {
        icon: <Heading2Icon />,
        keywords: ["subtitle", "h2"],
        label: "Heading 2",
        value: KEYS.h2,
      },
      {
        icon: <Heading3Icon />,
        keywords: ["subtitle", "h3"],
        label: "Heading 3",
        value: KEYS.h3,
      },
      {
        icon: <ListIcon />,
        keywords: ["unordered", "ul", "-"],
        label: "Bulleted list",
        value: KEYS.ul,
      },
      {
        icon: <ListOrdered />,
        keywords: ["ordered", "ol", "1"],
        label: "Numbered list",
        value: KEYS.ol,
      },
      {
        icon: <Square />,
        keywords: ["checklist", "task", "checkbox", "[]"],
        label: "To-do list",
        value: KEYS.listTodo,
      },
      {
        icon: <ChevronRightIcon />,
        keywords: ["collapsible", "expandable"],
        label: "Toggle",
        value: KEYS.toggle,
      },
      {
        icon: <Code2 />,
        keywords: ["```"],
        label: "Code Block",
        value: KEYS.codeBlock,
      },
      {
        icon: <Table />,
        label: "Table",
        value: KEYS.table,
      },
      {
        icon: <Quote />,
        keywords: ["citation", "blockquote", "quote", ">"],
        label: "Blockquote",
        value: KEYS.blockquote,
      },
      {
        description: "Insert a highlighted block.",
        icon: <LightbulbIcon />,
        keywords: ["note"],
        label: "Callout",
        value: KEYS.callout,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor) => {
        insertBlock(editor, item.nodeType ?? item.value, {
          props: item.props,
        });
      },
    })),
  },
  {
    group: "Callout boxes",
    items: calloutItems,
  },
  {
    group: "Advanced blocks",
    items: [
      {
        icon: <TableOfContentsIcon />,
        keywords: ["toc"],
        label: "Table of contents",
        value: KEYS.toc,
      },
      {
        icon: <Columns3Icon />,
        label: "3 columns",
        value: "action_three_columns",
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        label: "Equation",
        value: KEYS.equation,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
    group: "Inline",
    items: [
      {
        focusEditor: true,
        icon: <CalendarIcon />,
        keywords: ["time"],
        label: "Date",
        value: KEYS.date,
      },
      {
        focusEditor: false,
        icon: <RadicalIcon />,
        label: "Inline Equation",
        value: KEYS.inlineEquation,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertInlineElement(editor, value);
      },
    })),
  },
];

export function SlashInputElement(
  props: PlateElementProps<TComboboxInputElement>,
) {
  const { editor, element } = props;

  return (
    <PlateElement {...props} as="span" data-slate-value={element.value}>
      <InlineCombobox element={element} trigger="/">
        <InlineComboboxInput />

        <InlineComboboxContent>
          <InlineComboboxEmpty>No results</InlineComboboxEmpty>

          {groups.map(({ group, items }) => (
            <InlineComboboxGroup key={group}>
              <InlineComboboxGroupLabel>{group}</InlineComboboxGroupLabel>

              {items.map(
                ({ focusEditor, icon, keywords, label, value, onSelect }) => (
                  <InlineComboboxItem
                    key={value}
                    value={value}
                    onClick={() => onSelect(editor, value)}
                    label={label}
                    focusEditor={focusEditor}
                    group={group}
                    keywords={keywords}
                  >
                    <div className="mr-2 text-muted-foreground">{icon}</div>
                    {label ?? value}
                  </InlineComboboxItem>
                ),
              )}
            </InlineComboboxGroup>
          ))}
        </InlineComboboxContent>
      </InlineCombobox>

      {props.children}
    </PlateElement>
  );
}
