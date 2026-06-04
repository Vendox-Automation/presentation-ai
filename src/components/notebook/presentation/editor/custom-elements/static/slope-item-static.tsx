"use client";

import { NodeApi, PathApi } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";
import { type TSlopeGroupElement } from "../../plugins/diagram-components-plugin";
import { PresentationIcon } from "../presentation-icon";
import { getSmartLayoutStepColor } from "../smart-layout-gradient";
import {
  getStaticDiagramTextAlignClass,
  type StaticDiagramElement,
} from "./diagram-static-utils";

const SLOPE_MIN_HEIGHT_PX = 245;
const SLOPE_HEIGHT_STEP_PX = 42;

export function SlopeItemStatic(props: SlateElementProps) {
  const element = props.element as StaticDiagramElement;
  const path = props.path ?? props.editor.api.findPath(props.element) ?? [0];
  const parentPath = PathApi.parent(path);
  const parentElement = NodeApi.get(props.editor, parentPath) as
    | TSlopeGroupElement
    | undefined;
  const index = path.at(-1) ?? 0;
  const total = parentElement?.children?.length || 1;

  return (
    <div
      className="group/slope-item relative flex w-44 shrink-0 grow-0 justify-center items-stretch"
      style={{ marginTop: (total - 1 - index) * SLOPE_HEIGHT_STEP_PX }}
    >
      <div
        className="relative flex w-full flex-col items-center rounded-t-full px-5 pb-8 pt-5 text-center"
        style={
          {
            background: getSmartLayoutStepColor(index, total),
            minHeight: SLOPE_MIN_HEIGHT_PX,
            "--presentation-heading": "var(--presentation-card-background)",
            "--presentation-text": "var(--presentation-card-background)",
          } as React.CSSProperties
        }
        data-bg-export="true"
      >
        <div className="mb-9 flex size-30 shrink-0 items-center justify-center rounded-full bg-(--presentation-background) text-(--presentation-muted-foreground)">
          <PresentationIcon
            icon={element.icon}
            fallbackIcon="FaLightbulb"
            size={96}
          />
        </div>
        <SlateElement
          {...props}
          className={cn(
            "min-w-0 w-full text-(--presentation-foreground) [&_h1]:text-2xl [&_h2]:text-2xl [&_h3]:text-2xl [&_h4]:text-xl [&_p]:mt-2 [&_p]:text-sm",
            "[&_:is(.presentation-heading)]:[-webkit-background-clip:unset!important;]",
            "[&_:is(.presentation-heading)]:[-webkit-text-fill-color:unset!important;]",
            "[&_:is(.presentation-heading)]:[background-clip:unset!important;]",
            "[&_:is(.presentation-heading)]:[background:none!important;]",
            "[&_:is(.presentation-heading)]:text-(--presentation-text)!",
            getStaticDiagramTextAlignClass(element.alignment),
          )}
        >
          {props.children}
        </SlateElement>
      </div>
    </div>
  );
}
