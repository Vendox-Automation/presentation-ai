"use client";

import { type DropdownMenuProps } from "@radix-ui/react-dropdown-menu";
import {
  CalendarIcon,
  ChevronRightIcon,
  Columns3Icon,
  FileCodeIcon,
  FilmIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ImageIcon,
  Link2Icon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PilcrowIcon,
  PlusIcon,
  QuoteIcon,
  RadicalIcon,
  SquareIcon,
  TableIcon,
  TableOfContentsIcon,
} from "lucide-react";
import { KEYS, type TElement } from "platejs";
import { useEditorRef, type PlateEditor } from "platejs/react";
import * as React from "react";

import { PRESENTATION_TITLE_ELEMENT } from "@/components/notebook/presentation/editor/lib";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/plate/ui/dropdown-menu";
import {
  insertBlock,
  insertInlineElement,
} from "@/components/plate/utils/transforms";
import { ToolbarButton, ToolbarMenuGroup } from "./toolbar";

type Group = {
  group: string;
  items: Item[];
};

interface Item {
  icon: React.ReactNode;
  value: string;
  onSelect: (editor: PlateEditor, value: string) => void;
  focusEditor?: boolean;
  label?: string;
  nodeType?: string;
  props?: Partial<TElement>;
}

const groups: Group[] = [
  {
    group: "Basic blocks",
    items: [
      {
        icon: <Heading1Icon />,
        label: "Title",
        props: { variant: "title" },
        value: PRESENTATION_TITLE_ELEMENT,
      },
      {
        icon: <Heading2Icon />,
        label: "Display",
        props: { variant: "display" },
        value: "presentation-title-display",
        nodeType: PRESENTATION_TITLE_ELEMENT,
      },
      {
        icon: <Heading3Icon />,
        label: "Humongous",
        props: { variant: "humongous" },
        value: "presentation-title-humongous",
        nodeType: PRESENTATION_TITLE_ELEMENT,
      },
      {
        icon: <PilcrowIcon />,
        label: "Paragraph",
        value: KEYS.p,
      },
      {
        icon: <Heading1Icon />,
        label: "Heading 1",
        value: "h1",
      },
      {
        icon: <Heading2Icon />,
        label: "Heading 2",
        value: "h2",
      },
      {
        icon: <Heading3Icon />,
        label: "Heading 3",
        value: "h3",
      },
      {
        icon: <TableIcon />,
        label: "Table",
        value: KEYS.table,
      },
      {
        icon: <FileCodeIcon />,
        label: "Code",
        value: KEYS.codeBlock,
      },
      {
        icon: <QuoteIcon />,
        label: "Quote",
        value: KEYS.blockquote,
      },
      {
        icon: <MinusIcon />,
        label: "Divider",
        value: KEYS.hr,
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
    group: "Lists",
    items: [
      {
        icon: <ListIcon />,
        label: "Bulleted list",
        value: KEYS.ul,
      },
      {
        icon: <ListOrderedIcon />,
        label: "Numbered list",
        value: KEYS.ol,
      },
      {
        icon: <SquareIcon />,
        label: "To-do list",
        value: KEYS.listTodo,
      },
      {
        icon: <ChevronRightIcon />,
        label: "Toggle list",
        value: KEYS.toggle,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
    group: "Media",
    items: [
      {
        icon: <ImageIcon />,
        label: "Image",
        value: KEYS.img,
      },
      {
        icon: <FilmIcon />,
        label: "Embed",
        value: KEYS.mediaEmbed,
      },
    ].map((item) => ({
      ...item,
      onSelect: (editor, value) => {
        insertBlock(editor, value);
      },
    })),
  },
  {
    group: "Advanced blocks",
    items: [
      {
        icon: <TableOfContentsIcon />,
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
        icon: <Link2Icon />,
        label: "Link",
        value: KEYS.link,
      },
      {
        focusEditor: true,
        icon: <CalendarIcon />,
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

export function InsertToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton pressed={open} tooltip="Insert" isDropdown>
          <PlusIcon />
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="flex max-h-125 min-w-0 flex-col overflow-y-auto"
        align="start"
      >
        {groups.map(({ group, items: nestedItems }) => (
          <ToolbarMenuGroup key={group} label={group}>
            {nestedItems.map(({ icon, label, value, onSelect }) => (
              <DropdownMenuItem
                key={value}
                className="min-w-45"
                onSelect={() => {
                  onSelect(editor, value);
                  editor.tf.focus();
                }}
              >
                {icon}
                {label}
              </DropdownMenuItem>
            ))}
          </ToolbarMenuGroup>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
