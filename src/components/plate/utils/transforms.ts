"use client";

import { insertCallout } from "@platejs/callout";
import { insertCodeBlock } from "@platejs/code-block";
import { insertDate } from "@platejs/date";
import { insertColumnGroup, toggleColumnGroup } from "@platejs/layout";
import { triggerFloatingLink } from "@platejs/link/react";
import { isOrderedList } from "@platejs/list";
import { insertEquation, insertInlineEquation } from "@platejs/math";
import {
  insertAudioPlaceholder,
  insertFilePlaceholder,
  insertMedia,
  insertVideoPlaceholder,
} from "@platejs/media";
import { SuggestionPlugin } from "@platejs/suggestion/react";
import { TablePlugin } from "@platejs/table/react";
import { insertToc } from "@platejs/toc";
import {
  KEYS,
  PathApi,
  type NodeEntry,
  type Path,
  type TElement,
} from "platejs";
import { type PlateEditor } from "platejs/react";

const ACTION_THREE_COLUMNS = "action_three_columns";
const LIST_STYLE_TYPE_KEY = "listStyleType";
const LIST_START_KEY = "listStart";
const LIST_RESTART_KEY = "listRestart";
const LIST_RESTART_POLITE_KEY = "listRestartPolite";

const insertList = (editor: PlateEditor, type: string) => {
  editor.tf.insertNodes(
    editor.api.create.block({
      indent: 1,
      listStyleType: type,
    }),
    { select: true },
  );
};

const insertBlockMap: Record<
  string,
  (editor: PlateEditor, type: string, props?: Partial<TElement>) => void
> = {
  [KEYS.listTodo]: insertList,
  [KEYS.ol]: insertList,
  [KEYS.ul]: insertList,
  [ACTION_THREE_COLUMNS]: (editor) =>
    insertColumnGroup(editor, { columns: 3, select: true }),
  [KEYS.audio]: (editor) => insertAudioPlaceholder(editor, { select: true }),
  [KEYS.callout]: (editor, _type, props) =>
    insertCallout(editor, {
      icon: getStringProp(props, "icon"),
      select: true,
      variant: getStringProp(props, "variant"),
    }),
  [KEYS.codeBlock]: (editor) => insertCodeBlock(editor, { select: true }),
  [KEYS.equation]: (editor) => insertEquation(editor, { select: true }),
  [KEYS.file]: (editor) => insertFilePlaceholder(editor, { select: true }),
  [KEYS.img]: (editor) =>
    insertMedia(editor, {
      select: true,
      type: KEYS.img,
    }),
  [KEYS.mediaEmbed]: (editor) =>
    insertMedia(editor, {
      select: true,
      type: KEYS.mediaEmbed,
    }),
  [KEYS.table]: (editor) =>
    editor.getTransforms(TablePlugin).insert.table({}, { select: true }),
  [KEYS.toc]: (editor) => insertToc(editor, { select: true }),
  [KEYS.video]: (editor) => insertVideoPlaceholder(editor, { select: true }),
};

const insertInlineMap: Record<
  string,
  (editor: PlateEditor, type: string) => void
> = {
  [KEYS.date]: (editor) => insertDate(editor, { select: true }),
  [KEYS.inlineEquation]: (editor) =>
    insertInlineEquation(editor, "", { select: true }),
  [KEYS.link]: (editor) => triggerFloatingLink(editor, { focused: true }),
};

export const insertBlock = (
  editor: PlateEditor,
  type: string,
  { props }: { props?: Partial<TElement> } = {},
) => {
  editor.tf.withoutNormalizing(() => {
    const block = editor.api.block();

    if (!block) return;
    if (type in insertBlockMap) {
      insertBlockMap[type]!(editor, type, props);
    } else {
      editor.tf.insertNodes(editor.api.create.block({ ...props, type }), {
        at: PathApi.next(block[1]),
        select: true,
      });
    }
    if (getBlockType(block[0]) !== type) {
      editor.getApi(SuggestionPlugin).suggestion.withoutSuggestions(() => {
        editor.tf.removeNodes({ previousEmptyBlock: true });
      });
    }
  });
};

function getStringProp(props: Partial<TElement> | undefined, key: string) {
  const value = props?.[key];

  return typeof value === "string" ? value : undefined;
}

export const insertInlineElement = (editor: PlateEditor, type: string) => {
  if (insertInlineMap[type]) {
    insertInlineMap[type](editor, type);
  }
};

const setList = (
  editor: PlateEditor,
  type: string,
  entry: NodeEntry<TElement>,
) => {
  editor.tf.setNodes(
    editor.api.create.block({
      indent: 1,
      listStyleType: type,
    }),
    {
      at: entry[1],
    },
  );
};

const setBlockMap: Record<
  string,
  (editor: PlateEditor, type: string, entry: NodeEntry<TElement>) => void
> = {
  [KEYS.listTodo]: setList,
  [KEYS.ol]: setList,
  [KEYS.ul]: setList,
  [ACTION_THREE_COLUMNS]: (editor) => toggleColumnGroup(editor, { columns: 3 }),
};

type SetBlockTypeOptions = {
  at?: Path;
  props?: Partial<TElement>;
};

export const setBlockType = (
  editor: PlateEditor,
  type: string,
  { at, props }: SetBlockTypeOptions = {},
) => {
  editor.tf.withoutNormalizing(() => {
    const setEntry = (entry: NodeEntry<TElement>) => {
      const [node, path] = entry;

      if (node[KEYS.listType] || node[LIST_STYLE_TYPE_KEY]) {
        editor.tf.unsetNodes(
          [
            KEYS.listType,
            "indent",
            LIST_STYLE_TYPE_KEY,
            LIST_START_KEY,
            LIST_RESTART_KEY,
            LIST_RESTART_POLITE_KEY,
          ],
          { at: path },
        );
      }
      if (type in setBlockMap) {
        return setBlockMap[type]!(editor, type, entry);
      }
      if (node.type !== type) {
        editor.tf.setNodes({ ...props, type }, { at: path });
      } else if (props) {
        editor.tf.setNodes(props, { at: path });
      }
    };

    if (at) {
      const entry = editor.api.node(at) as NodeEntry<TElement> | undefined;

      if (entry) {
        setEntry(entry);

        return;
      }
    }

    const entries = editor.api.blocks({ mode: "lowest" });

    entries.forEach((entry) => setEntry(entry));
  });
};

export const getBlockType = (block: TElement) => {
  if (typeof block[LIST_STYLE_TYPE_KEY] === "string") {
    if (block[LIST_STYLE_TYPE_KEY] === KEYS.listTodo) {
      return KEYS.listTodo;
    }

    return isOrderedList(block) ? KEYS.ol : KEYS.ul;
  }

  if (block[KEYS.listType]) {
    if (block[KEYS.listType] === KEYS.ol) {
      return KEYS.ol;
    } else if (block[KEYS.listType] === KEYS.listTodo) {
      return KEYS.listTodo;
    } else {
      return KEYS.ul;
    }
  }

  return block.type;
};
