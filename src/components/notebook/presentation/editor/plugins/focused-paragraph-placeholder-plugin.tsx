"use client";

import {
  CheckSquareIcon,
  Code2Icon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  Heading6Icon,
  ImageIcon,
  LayoutGridIcon,
  ListIcon,
  ListOrderedIcon,
  MessageSquareQuoteIcon,
  PilcrowIcon,
  TableIcon,
  TextQuoteIcon,
  ToggleRightIcon,
  X,
} from "lucide-react";
import { KEYS, nanoid, NodeApi, PathApi, type TElement } from "platejs";
import {
  useEditorSelector,
  type PlateEditor,
  type PlateElementProps,
} from "platejs/react";
import * as React from "react";
import { type ReactNode } from "react";

import { insertBlock } from "@/components/plate/utils/transforms";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  CATEGORY_ICONS,
  COLUMN_GROUP,
  getDefaultChartDataForType,
  GROUPED_BLOCKS,
  isChartType,
  PARENT_CHILD_RELATIONSHIP,
  QUOTE_ELEMENT,
} from "../lib";

type BlockOption = {
  icon: ReactNode;
  key?: string;
  name: string;
  supportsOrientation?: boolean;
  type: string;
  variant?: string;
};

type InsertOption = {
  id: string;
  icon: ReactNode;
  label: string;
  type: string;
  keywords?: readonly string[];
  props?: Partial<TElement>;
};

type InsertOptionGroup = {
  label: string;
  options: readonly InsertOption[];
};

const basicOptionGroups = [
  {
    label: "Basic blocks",
    options: [
      {
        id: "paragraph",
        icon: <PilcrowIcon className="size-4" />,
        label: "Text",
        type: KEYS.p,
        keywords: ["paragraph", "body"],
      },
      {
        id: "heading-1",
        icon: <Heading1Icon className="size-4" />,
        label: "Heading 1",
        type: KEYS.h1,
        keywords: ["title"],
      },
      {
        id: "heading-2",
        icon: <Heading2Icon className="size-4" />,
        label: "Heading 2",
        type: KEYS.h2,
        keywords: ["subtitle"],
      },
      {
        id: "heading-3",
        icon: <Heading3Icon className="size-4" />,
        label: "Heading 3",
        type: KEYS.h3,
      },
      {
        id: "heading-4",
        icon: <Heading4Icon className="size-4" />,
        label: "Heading 4",
        type: KEYS.h4,
      },
      {
        id: "heading-5",
        icon: <Heading5Icon className="size-4" />,
        label: "Heading 5",
        type: KEYS.h5,
      },
      {
        id: "heading-6",
        icon: <Heading6Icon className="size-4" />,
        label: "Heading 6",
        type: KEYS.h6,
      },
      {
        id: "blockquote",
        icon: <TextQuoteIcon className="size-4" />,
        label: "Blockquote",
        type: KEYS.blockquote,
        keywords: ["quote", "citation"],
      },
      {
        id: "callout",
        icon: <MessageSquareQuoteIcon className="size-4" />,
        label: "Callout",
        type: KEYS.callout,
        keywords: ["note", "info", "warning"],
      },
      {
        id: "toggle",
        icon: <ToggleRightIcon className="size-4" />,
        label: "Toggle",
        type: KEYS.toggle,
        keywords: ["collapsible", "expand"],
      },
      {
        id: "code-block",
        icon: <Code2Icon className="size-4" />,
        label: "Code block",
        type: KEYS.codeBlock,
        keywords: ["code"],
      },
    ],
  },
  {
    label: "Lists",
    options: [
      {
        id: "bulleted-list",
        icon: <ListIcon className="size-4" />,
        label: "Bulleted list",
        type: KEYS.ul,
        keywords: ["unordered", "bullet"],
      },
      {
        id: "numbered-list",
        icon: <ListOrderedIcon className="size-4" />,
        label: "Numbered list",
        type: KEYS.ol,
        keywords: ["ordered"],
      },
      {
        id: "todo-list",
        icon: <CheckSquareIcon className="size-4" />,
        label: "To-do list",
        type: KEYS.listTodo,
        keywords: ["task", "checklist"],
      },
    ],
  },
  {
    label: "Media",
    options: [
      {
        id: "image",
        icon: <ImageIcon className="size-4" />,
        label: "Image",
        type: KEYS.img,
        keywords: ["photo", "picture"],
      },
      {
        id: "table",
        icon: <TableIcon className="size-4" />,
        label: "Table",
        type: KEYS.table,
        keywords: ["grid", "rows", "columns"],
      },
    ],
  },
] as const satisfies readonly InsertOptionGroup[];

const layoutOptionGroups = Object.entries(GROUPED_BLOCKS).map(
  ([category, items]) =>
    ({
      label: category,
      options: items.map((option) => ({
        id: `${option.type}-${option.key ?? "type"}-${
          option.variant ?? "default"
        }`,
        icon: option.icon,
        label: option.name,
        type: option.type,
        props: getBlockProps(option),
      })),
    }) satisfies InsertOptionGroup,
);

const insertOptionGroups = [...basicOptionGroups, ...layoutOptionGroups];

function getCategoryIcon(label: string) {
  if (label in CATEGORY_ICONS) {
    return CATEGORY_ICONS[label as keyof typeof CATEGORY_ICONS];
  }

  return null;
}

function isSelectionInsidePath(
  selectionPath: readonly number[] | undefined,
  elementPath: readonly number[],
) {
  if (!selectionPath || selectionPath.length < elementPath.length) {
    return false;
  }

  for (let index = 0; index < elementPath.length; index += 1) {
    if (elementPath[index] !== selectionPath[index]) {
      return false;
    }
  }

  return true;
}

function isElementNode(node: unknown): node is TElement {
  return (
    typeof node === "object" &&
    node !== null &&
    "type" in node &&
    "children" in node
  );
}

function isTableCellType(type: unknown) {
  return type === KEYS.td || type === KEYS.th;
}

function getBlockProps(option: BlockOption): Partial<TElement> | undefined {
  const props: Partial<TElement> = {};

  if (option.key && option.variant) {
    props[option.key] =
      option.key === "isFunnel" ? option.variant === "funnel" : option.variant;
  }

  if (option.supportsOrientation) {
    props.orientation = "vertical";
  }

  return Object.keys(props).length > 0 ? props : undefined;
}

function insertPlaceholderBlock(editor: PlateEditor, option: InsertOption) {
  const customBlock = createPresentationBlock(option);

  if (!customBlock) {
    insertBlock(editor, option.type, { props: option.props });
    return;
  }

  const activeBlock = editor.api.block();
  if (!activeBlock) return;

  editor.tf.withoutNormalizing(() => {
    const [block, blockPath] = activeBlock;

    editor.tf.insertNodes(customBlock, {
      at: PathApi.next(blockPath),
      select: true,
    });

    if (NodeApi.string(block).trim().length === 0) {
      editor.tf.removeNodes({ at: blockPath });
    }
  });
}

function createTextBlock(type: string, text: string): TElement {
  return {
    id: nanoid(),
    type,
    children: [{ text }],
  };
}

function createNestedTextChildren(title: string, description: string) {
  return [
    createTextBlock(KEYS.h3, title),
    createTextBlock(KEYS.p, description),
  ];
}

function createRelationshipChild(childType: string, index: number): TElement {
  if (childType === "bullet") {
    return {
      id: nanoid(),
      type: childType,
      children: [{ text: `Point ${index + 1}` }],
    };
  }

  return {
    id: nanoid(),
    type: childType,
    children: createNestedTextChildren(
      `Item ${index + 1}`,
      "Add supporting detail.",
    ),
  };
}

function createPresentationBlock(option: InsertOption): TElement | null {
  if (isChartType(option.type)) {
    return {
      id: nanoid(),
      type: option.type,
      data: getDefaultChartDataForType(option.type),
      ...option.props,
      children: [{ text: "" }],
    };
  }

  if (option.type === QUOTE_ELEMENT) {
    return {
      id: nanoid(),
      type: option.type,
      ...option.props,
      children: [{ text: "Add a quote." }],
    };
  }

  const relationship =
    PARENT_CHILD_RELATIONSHIP[
      option.type as keyof typeof PARENT_CHILD_RELATIONSHIP
    ];

  if (!relationship) return null;

  const childTypes = Array.isArray(relationship.child)
    ? relationship.child
    : [relationship.child];

  return {
    id: nanoid(),
    type: option.type,
    ...(option.type === COLUMN_GROUP ? { layout: [1, 1] } : {}),
    ...option.props,
    children: Array.from({ length: Math.max(2, childTypes.length) }).map(
      (_, index) =>
        createRelationshipChild(childTypes[index % childTypes.length]!, index),
    ),
  };
}

const PlaceholderActionButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, onMouseDown, type = "button", ...props }, ref) => {
  return (
    <button
      ref={ref}
      type={type}
      contentEditable={false}
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-(--presentation-muted)/30 bg-(--presentation-background)/85 px-1.5 text-[13px] leading-none font-medium text-(--presentation-muted-foreground)/70 shadow-xs transition-[background-color,border-color,color,box-shadow]",
        "hover:border-(--presentation-text)/45 hover:bg-(--presentation-card-background) hover:text-(--presentation-text) hover:shadow-sm",
        "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-hidden",
        className,
      )}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onMouseDown?.(event);
      }}
      {...props}
    />
  );
});
PlaceholderActionButton.displayName = "PlaceholderActionButton";

function MoreBlocksPopover({
  editor,
  hideTable,
  open,
  onOpenChange,
  showLabels,
}: {
  editor: PlateEditor;
  hideTable: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showLabels: boolean;
}) {
  const visibleOptionGroups = React.useMemo(
    () =>
      hideTable
        ? insertOptionGroups
            .map(({ label, options }) => ({
              label,
              options: options.filter((option) => option.type !== KEYS.table),
            }))
            .filter(({ options }) => options.length > 0)
        : insertOptionGroups,
    [hideTable],
  );

  const handleSelect = React.useCallback(
    (option: InsertOption) => {
      insertPlaceholderBlock(editor, option);
      onOpenChange(false);
    },
    [editor, onOpenChange],
  );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <PlaceholderActionButton>
          <LayoutGridIcon className="size-4" />
          {showLabels ? <span>Add more blocks</span> : null}
        </PlaceholderActionButton>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-84 overflow-hidden border-border/70 p-0"
        contentEditable={false}
        onMouseDown={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder="Search blocks..." />
          <CommandList className="max-h-80">
            <CommandEmpty>No blocks found</CommandEmpty>
            {visibleOptionGroups.map(({ label, options }) => {
              const categoryIcon = getCategoryIcon(label);

              return (
                <CommandGroup key={label} heading={label}>
                  {options.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={`${label} ${option.label} ${option.type} ${(
                        option.keywords ?? []
                      ).join(" ")}`}
                      onSelect={() => handleSelect(option)}
                    >
                      <span className="text-muted-foreground">
                        {option.icon}
                      </span>
                      <span className="flex-1">{option.label}</span>
                      {categoryIcon ? (
                        <span className="text-muted-foreground">
                          {categoryIcon}
                        </span>
                      ) : null}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function FocusedParagraphPlaceholder(props: PlateElementProps) {
  const { editor, element, path } = props;
  const [moreBlocksOpen, setMoreBlocksOpen] = React.useState(false);
  const isRootLevel = path.length === 1;
  const isCurrentElementEmpty = NodeApi.string(element).trim().length === 0;
  const isFocusedInside = useEditorSelector(
    (editor) =>
      isSelectionInsidePath(editor.selection?.focus.path, path) &&
      !editor.api.isReadOnly(),
    [path],
  );
  const isInsideTableCell = useEditorSelector(
    (editor) =>
      Boolean(
        editor.api.above({
          at: path,
          match: (node) => isElementNode(node) && isTableCellType(node.type),
        }),
      ),
    [path],
  );
  const showPlaceholder =
    isCurrentElementEmpty && (isFocusedInside || moreBlocksOpen);

  const handleInsertImage = React.useCallback(() => {
    insertBlock(editor, KEYS.img);
  }, [editor]);

  const handleInsertTable = React.useCallback(() => {
    insertBlock(editor, KEYS.table);
  }, [editor]);

  return (
    <div className="relative">
      {showPlaceholder ? (
        <div
          contentEditable={false}
          className={cn(
            "absolute top-1/2 z-10 flex -translate-y-1/2 flex-nowrap items-center gap-2 overflow-hidden whitespace-nowrap",
            isRootLevel
              ? "right-4.5 left-4.5 md:right-8.5 md:left-8.5"
              : "right-0 left-0",
            "text-(--presentation-muted-foreground)",
          )}
        >
          <span className="pointer-events-none inline-flex min-h-7 shrink-0 items-center text-[13px] leading-none font-normal opacity-80">
            Type / to add blocks or...
          </span>
          <PlaceholderActionButton
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              handleInsertImage();
            }}
          >
            <ImageIcon className="size-4" />
            {isRootLevel ? <span>Add image</span> : null}
          </PlaceholderActionButton>
          {!isInsideTableCell ? (
            <PlaceholderActionButton
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                handleInsertTable();
              }}
            >
              <TableIcon className="size-4" />
              {isRootLevel ? <span>Add table</span> : null}
            </PlaceholderActionButton>
          ) : null}
          <MoreBlocksPopover
            editor={editor}
            hideTable={isInsideTableCell}
            open={moreBlocksOpen}
            onOpenChange={setMoreBlocksOpen}
            showLabels={isRootLevel}
          />
          {moreBlocksOpen ? (
            <button
              type="button"
              aria-label="Close block search"
              contentEditable={false}
              className="inline-flex size-8 items-center justify-center rounded-full text-(--presentation-muted-foreground) transition-colors hover:bg-(--presentation-muted-foreground)/15 hover:text-(--presentation-text)"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setMoreBlocksOpen(false);
              }}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      ) : null}
      {props.children}
    </div>
  );
}
