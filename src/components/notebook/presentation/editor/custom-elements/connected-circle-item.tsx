"use client";

import { NodeApi, PathApi } from "platejs";
import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";
import {
  type TConnectedCirclesGroupElement,
  type TConnectedCirclesItemElement,
} from "../plugins/diagram-components-plugin";
import { getPresentationAccentColor } from "./color-utils";
import {
  getConnectedCircleItemPosition,
  getConnectedCircleItemTransform,
} from "./connected-circles-layout";
import { getSiblingIndexContext } from "./sibling-index";
import { getSmartLayoutStepColor } from "./smart-layout-gradient";

export function ConnectedCircleItem(
  props: PlateElementProps<TConnectedCirclesItemElement>,
) {
  const { index, parentElement } =
    getSiblingIndexContext<TConnectedCirclesGroupElement>(
      props.editor,
      props.element,
      props.path,
    );
  const fallbackParentPath = PathApi.parent(props.path);
  const fallbackParentElement = NodeApi.get(
    props.editor,
    fallbackParentPath,
  ) as TConnectedCirclesGroupElement | undefined;
  const resolvedParentElement = parentElement ?? fallbackParentElement;
  const total = resolvedParentElement?.children?.length || 1;
  const alignment =
    props.element.alignment ?? resolvedParentElement?.alignment ?? "center";
  const position = getConnectedCircleItemPosition(index, total);
  const transform = getConnectedCircleItemTransform(index, total);
  const bgColor = getPresentationAccentColor(
    props.element,
    resolvedParentElement,
    getSmartLayoutStepColor(index, total),
  );
  return (
    <PlateElement
      {...props}
      className="group/connected-circle relative z-10 grid min-w-0 place-items-center"
      style={{
        gridColumn: position.gridColumn,
        gridRow: position.gridRow,
        justifySelf: "center",
        transform,
      }}
    >
      <div
        className={cn(
          "grid aspect-square size-56 place-items-center rounded-full px-8 text-(--presentation-foreground)",
          alignment === "left" && "text-left",
          alignment === "center" && "text-center",
          alignment === "right" && "text-right",
          "[&_:is(.presentation-heading)]:[-webkit-background-clip:unset!important;]",
          "[&_:is(.presentation-heading)]:[-webkit-text-fill-color:unset!important;]",
          "[&_:is(.presentation-heading)]:[background-clip:unset!important;]",
          "[&_:is(.presentation-heading)]:[background:none!important;]",
          "[&_:is(.presentation-heading)]:text-(--presentation-text)!",
          "[&_h1]:text-2xl [&_h2]:text-2xl [&_h3]:text-2xl [&_h4]:text-xl [&_p]:mt-2 [&_p]:text-base",
        )}
        style={
          {
            background: bgColor,
            "--presentation-heading": "var(--presentation-card-background)",
            "--presentation-text": "var(--presentation-card-background)",
          } as React.CSSProperties
        }
        data-bg-export="true"
      >
        <div className="min-w-0">{props.children}</div>
      </div>
    </PlateElement>
  );
}
