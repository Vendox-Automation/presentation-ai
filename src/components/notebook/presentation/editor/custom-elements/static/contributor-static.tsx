import { formatDistanceToNow } from "date-fns";
import { UserRound } from "lucide-react";
import { SlateElement, type SlateElementProps } from "platejs/static";
import type * as React from "react";

import { usePresentationOwner } from "@/hooks/presentation/usePresentationOwner";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { type TContributorElement } from "../../lib";

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

export function ContributorStatic(
  props: SlateElementProps<TContributorElement>,
) {
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

  return (
    <SlateElement
      {...props}
      className={cn("relative my-2 flex w-full", getJustifyClass(alignment))}
      style={style}
    >
      <div className="flex items-center gap-3 rounded-xl bg-(--presentation-contributor-background) px-4 py-3 text-(--presentation-contributor-text)">
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
    </SlateElement>
  );
}
