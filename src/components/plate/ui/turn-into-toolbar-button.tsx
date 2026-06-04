"use client";

import { BlockSelectionPlugin } from "@platejs/selection/react";
import {
  DropdownMenuItemIndicator,
  type DropdownMenuProps,
} from "@radix-ui/react-dropdown-menu";
import {
  CheckIcon,
  ChevronRightIcon,
  Columns3Icon,
  FileCodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ListIcon,
  ListOrderedIcon,
  PilcrowIcon,
  QuoteIcon,
  SquareIcon,
} from "lucide-react";
import { KEYS, type TElement } from "platejs";
import {
  useEditorRef,
  useEditorSelector,
  usePluginOption,
  useSelectionFragmentProp,
} from "platejs/react";
import * as React from "react";

import { PRESENTATION_TITLE_ELEMENT } from "@/components/notebook/presentation/editor/lib";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/plate/ui/dropdown-menu";
import {
  getBlockType,
  setBlockType,
} from "@/components/plate/utils/transforms";
import { ToolbarButton, ToolbarMenuGroup } from "./toolbar";

const turnIntoItems = [
  {
    icon: <Heading1Icon />,
    keywords: ["title", "!"],
    label: "Title",
    props: { variant: "title" },
    type: PRESENTATION_TITLE_ELEMENT,
    value: PRESENTATION_TITLE_ELEMENT,
  },
  {
    icon: <Heading2Icon />,
    keywords: ["display", "!!"],
    label: "Display",
    props: { variant: "display" },
    type: PRESENTATION_TITLE_ELEMENT,
    value: "presentation-title-display",
  },
  {
    icon: <Heading3Icon />,
    keywords: ["humongous", "!!!"],
    label: "Humongous",
    props: { variant: "humongous" },
    type: PRESENTATION_TITLE_ELEMENT,
    value: "presentation-title-humongous",
  },
  {
    icon: <PilcrowIcon />,
    keywords: ["paragraph"],
    label: "Text",
    type: KEYS.p,
    value: KEYS.p,
  },
  {
    icon: <Heading1Icon />,
    keywords: ["title", "h1"],
    label: "Heading 1",
    type: "h1",
    value: "h1",
  },
  {
    icon: <Heading2Icon />,
    keywords: ["subtitle", "h2"],
    label: "Heading 2",
    type: "h2",
    value: "h2",
  },
  {
    icon: <Heading3Icon />,
    keywords: ["subtitle", "h3"],
    label: "Heading 3",
    type: "h3",
    value: "h3",
  },
  {
    icon: <Heading4Icon />,
    keywords: ["subtitle", "h4"],
    label: "Heading 4",
    type: "h4",
    value: "h4",
  },
  {
    icon: <Heading5Icon />,
    keywords: ["subtitle", "h5"],
    label: "Heading 5",
    type: "h5",
    value: "h5",
  },
  {
    icon: <Heading6Icon />,
    keywords: ["subtitle", "h6"],
    label: "Heading 6",
    type: "h6",
    value: "h6",
  },
  {
    icon: <ListIcon />,
    keywords: ["unordered", "ul", "-"],
    label: "Bulleted list",
    type: KEYS.ul,
    value: KEYS.ul,
  },
  {
    icon: <ListOrderedIcon />,
    keywords: ["ordered", "ol", "1"],
    label: "Numbered list",
    type: KEYS.ol,
    value: KEYS.ol,
  },
  {
    icon: <SquareIcon />,
    keywords: ["checklist", "task", "checkbox", "[]"],
    label: "To-do list",
    type: KEYS.listTodo,
    value: KEYS.listTodo,
  },
  {
    icon: <ChevronRightIcon />,
    keywords: ["collapsible", "expandable"],
    label: "Toggle list",
    type: KEYS.toggle,
    value: KEYS.toggle,
  },
  {
    icon: <FileCodeIcon />,
    keywords: ["```"],
    label: "Code",
    type: KEYS.codeBlock,
    value: KEYS.codeBlock,
  },
  {
    icon: <QuoteIcon />,
    keywords: ["citation", "blockquote", ">"],
    label: "Quote",
    type: KEYS.blockquote,
    value: KEYS.blockquote,
  },
  {
    icon: <Columns3Icon />,
    label: "3 columns",
    type: "action_three_columns",
    value: "action_three_columns",
  },
];

function getTurnIntoValue(block: TElement) {
  if (getBlockType(block) !== PRESENTATION_TITLE_ELEMENT) {
    return getBlockType(block);
  }

  if (block.variant === "humongous") return "presentation-title-humongous";
  if (block.variant === "display") return "presentation-title-display";
  return PRESENTATION_TITLE_ELEMENT;
}

export function TurnIntoToolbarButton(props: DropdownMenuProps) {
  const editor = useEditorRef();
  const [open, setOpen] = React.useState(false);
  const selectedIds = usePluginOption(BlockSelectionPlugin, "selectedIds");

  const selectionValue = useSelectionFragmentProp({
    defaultValue: KEYS.p,
    getProp: (node) => getTurnIntoValue(node as TElement),
  });
  const activeBlockValue = useEditorSelector((currentEditor) => {
    const activeBlock = currentEditor.api.block();

    return activeBlock
      ? getTurnIntoValue(activeBlock[0] as TElement)
      : undefined;
  }, []);
  const selectedBlockValue = React.useMemo(() => {
    if (!selectedIds || selectedIds.size === 0) return undefined;

    const selectedValues = Array.from(selectedIds)
      .map((id) => editor.api.node({ id, at: [] })?.[0])
      .filter((node): node is TElement => Boolean(node))
      .map((node) => getTurnIntoValue(node));

    const [firstValue] = selectedValues;
    if (!firstValue) return undefined;

    return selectedValues.every((itemValue) => itemValue === firstValue)
      ? firstValue
      : undefined;
  }, [editor, selectedIds]);
  const value = selectedBlockValue ?? activeBlockValue ?? selectionValue;
  const selectedItem = React.useMemo(
    () =>
      turnIntoItems.find((item) => item.value === (value ?? KEYS.p)) ??
      turnIntoItems[0],
    [value],
  );

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false} {...props}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          className="min-w-31.25"
          pressed={open}
          tooltip="Turn into"
          isDropdown
        >
          {selectedItem!.label}
        </ToolbarButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="ignore-click-outside/toolbar min-w-0"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          editor.tf.focus();
        }}
        align="start"
      >
        <ToolbarMenuGroup
          value={value}
          onValueChange={(value) => {
            const item = turnIntoItems.find(
              (turnIntoItem) => turnIntoItem.value === value,
            );
            if (!item) return;

            setBlockType(editor, item.type, {
              props: item.props,
            });
          }}
          label="Turn into"
        >
          {turnIntoItems.map(({ icon, label, value: itemValue }) => (
            <DropdownMenuRadioItem
              key={itemValue}
              className="min-w-45 pl-2 [span]:first:*:hidden"
              value={itemValue}
            >
              <span className="pointer-events-none absolute right-2 flex size-3.5 items-center justify-center">
                <DropdownMenuItemIndicator>
                  <CheckIcon />
                </DropdownMenuItemIndicator>
              </span>
              {icon}
              {label}
            </DropdownMenuRadioItem>
          ))}
        </ToolbarMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
