"use client";

import { createPlatePlugin, type PlateEditor } from "platejs/react";

import {
  type DiscussionUser,
  type DiscussionUsersMap,
  type StoredDiscussion,
} from "@/lib/notes/discussions";
import { BlockDiscussion } from "../ui/block-discussion";
import { type TComment } from "../ui/comment";

export type TDiscussion = {
  id: string;
  comments: TComment[];
  createdAt: Date | string;
  isResolved: boolean;
  user?: DiscussionUser;
  userId: string;
  documentContent?: string;
};

type DiscussionChangeHandler = (discussions: StoredDiscussion[]) => void;

type DiscussionPluginOptions = {
  currentUserId: string;
  discussions: StoredDiscussion[];
  onDiscussionsChange?: DiscussionChangeHandler;
  users: DiscussionUsersMap;
};

const discussionPluginOptions: DiscussionPluginOptions = {
  currentUserId: "",
  discussions: [],
  onDiscussionsChange: undefined,
  users: {},
};

export const discussionPlugin = createPlatePlugin({
  key: "discussion",
  options: discussionPluginOptions,
})
  .configure({
    render: { aboveNodes: BlockDiscussion },
  })
  .extendSelectors(({ getOption }) => ({
    currentUser: () => getOption("users")[getOption("currentUserId")],
    user: (id: string) => getOption("users")[id],
  }));

export function updateDiscussionState(
  editor: PlateEditor,
  discussions: StoredDiscussion[],
) {
  editor.setOption(discussionPlugin, "discussions", discussions);

  const onDiscussionsChange = editor.getOption(
    discussionPlugin,
    "onDiscussionsChange",
  );

  onDiscussionsChange?.(discussions);
}

export const DiscussionKit = [discussionPlugin];
