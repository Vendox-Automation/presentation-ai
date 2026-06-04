"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";

import {
  type TSnakeGroupElement,
  type TSnakeItemElement,
} from "../plugins/diagram-components-plugin";
import { getSiblingIndexContext } from "./sibling-index";
import { getSnakeGridColumn, getSnakeGridRow } from "./snake-shared";

export function SnakeItem(props: PlateElementProps<TSnakeItemElement>) {
  const { index } = getSiblingIndexContext<TSnakeGroupElement>(
    props.editor,
    props.element,
    props.path,
  );
  const isLowerLaneItem = index % 2 === 1;

  return (
    <PlateElement
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
    </PlateElement>
  );
}
