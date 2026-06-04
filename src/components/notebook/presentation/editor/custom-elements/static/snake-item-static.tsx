"use client";

import { SlateElement, type SlateElementProps } from "platejs/static";

import { getSnakeGridColumn, getSnakeGridRow } from "../snake-shared";

export function SnakeItemStatic(props: SlateElementProps) {
  const path = props.path ?? props.editor.api.findPath(props.element) ?? [0];
  const index = path.at(-1) ?? 0;
  const isLowerLaneItem = index % 2 === 1;

  return (
    <SlateElement
      {...props}
      className="z-10 grid min-w-0 items-start justify-items-center"
      style={{
        alignSelf: isLowerLaneItem ? "end" : "stretch",
        gridRow: getSnakeGridRow(index),
        gridColumn: getSnakeGridColumn(index),
        justifySelf: "stretch",
      }}
    >
      <div className="min-w-0 px-2 text-center text-(--presentation-muted-foreground) [&_h1]:text-xl [&_h2]:text-xl [&_h3]:text-xl [&_h4]:text-lg [&_h1]:text-(--presentation-muted-foreground) [&_h2]:text-(--presentation-muted-foreground) [&_h3]:text-(--presentation-muted-foreground) [&_p]:mt-1 [&_p]:text-sm">
        {props.children}
      </div>
    </SlateElement>
  );
}
