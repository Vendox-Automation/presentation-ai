"use client";

import {
  BlockSelectionPlugin,
  useBlockSelected,
} from "@platejs/selection/react";
import { formatDistanceToNow } from "date-fns";
import { UserRound } from "lucide-react";
import { PlateElement, type PlateElementProps } from "platejs/react";
import type * as React from "react";

import { usePresentationOwner } from "@/hooks/presentation/usePresentationOwner";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { type TContributorElement } from "../lib";

function getJustifyClass(alignment: TContributorElement["alignment"]) {
  if (alignment === "left") return "justify-start";
  if (alignment === "right") return "justify-end";
  return "justify-center";
}

function getOwnerDisplayName(name: string | null | undefined) {
  return name?.trim() ? name : "Unknown owner";
}

function getInitials(name: string) {
  return name
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getEditedLabel(updatedAt: string | null | undefined) {
  if (!updatedAt) return "Just now";

  const updatedDate = new Date(updatedAt);
  if (Number.isNaN(updatedDate.getTime())) {
    return "Just now";
  }

  return `Last edited ${formatDistanceToNow(updatedDate, { addSuffix: true })}`;
}

export default function ContributorElement(
  props: PlateElementProps<TContributorElement>,
) {
  const isBlockSelected = useBlockSelected();
  const presentationId = usePresentationState((s) => s.currentPresentationId);
  const updatedAt = usePresentationState((s) => s.currentPresentationUpdatedAt);
  const { data: owner } = usePresentationOwner(presentationId);
  const ownerName = getOwnerDisplayName(owner?.name);
  const editedLabel =
    props.element.editedLabel ??
    getEditedLabel(updatedAt ?? props.element.updatedAt ?? null);
  const avatarUrl = owner?.image;
  const avatarStyle = avatarUrl
    ? ({
        backgroundImage: `url(${JSON.stringify(avatarUrl)})`,
      } satisfies React.CSSProperties)
    : undefined;
  const initials = getInitials(ownerName);
  const alignment = props.element.alignment ?? "left";
  const accentColor = "var(--presentation-primary)";
  const backgroundColor = props.element.backgroundColor ?? "transparent";
  const textColor =
    props.element.textColor ??
    props.element.color ??
    "var(--presentation-heading)";
  const style = {
    "--presentation-contributor-accent": accentColor,
    "--presentation-contributor-background": backgroundColor,
    "--presentation-contributor-text": textColor,
  } as React.CSSProperties;
  const selectContributorBlock = () => {
    const elementId = props.element.id;
    if (typeof elementId !== "string" || !elementId) return;

    const blockSelectionApi = props.editor.getApi(BlockSelectionPlugin);
    blockSelectionApi.blockSelection.set([elementId]);
    blockSelectionApi.blockSelection.focus();
  };

  const handleMouseDownCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    selectContributorBlock();
  };

  return (
    <PlateElement
      {...props}
      className={cn(
        "slate-editable-void slate-selectable relative my-2 flex w-full",
        getJustifyClass(alignment),
        isBlockSelected && "bg-brand/13",
      )}
      style={style}
    >
      <div
        className="flex items-center gap-3 rounded-xl bg-(--presentation-contributor-background) px-4 py-3 text-(--presentation-contributor-text)"
        contentEditable={false}
        data-slate-void="true"
        onMouseDownCapture={handleMouseDownCapture}
      >
        <div
          aria-label={avatarUrl ? ownerName : undefined}
          className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-(--presentation-contributor-accent)/50 bg-(--presentation-contributor-accent)/20 bg-cover bg-center text-(--presentation-contributor-accent)"
          role={avatarUrl ? "img" : undefined}
          style={avatarStyle}
        >
          {avatarUrl ? null : initials ? (
            <span className="text-sm font-bold">{initials}</span>
          ) : (
            <UserRound className="size-6" />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-2xl leading-tight font-bold">
            <span>by </span>
            <span>{ownerName}</span>
          </div>
          <div className="text-base leading-snug opacity-75">{editedLabel}</div>
        </div>
      </div>
      <span className="sr-only">{props.children}</span>
    </PlateElement>
  );
}
