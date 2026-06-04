"use client";

import { NodeApi, PathApi } from "platejs";
import {
  PlateElement,
  useReadOnly,
  type PlateElementProps,
} from "platejs/react";

import { IconPicker } from "@/components/ui/icon-picker";
import { cn } from "@/lib/utils";
import {
  type TSlopeGroupElement,
  type TSlopeItemElement,
} from "../plugins/diagram-components-plugin";
import { getPresentationAccentColor } from "./color-utils";
import { PresentationIcon } from "./presentation-icon";
import { getSiblingIndexContext } from "./sibling-index";
import { getSmartLayoutStepColor } from "./smart-layout-gradient";

const SLOPE_MIN_HEIGHT_PX = 245;
const SLOPE_HEIGHT_STEP_PX = 42;

export function SlopeItem(props: PlateElementProps<TSlopeItemElement>) {
  const readOnly = useReadOnly();
  const { index, parentElement } = getSiblingIndexContext<TSlopeGroupElement>(
    props.editor,
    props.element,
    props.path,
  );
  const fallbackParentPath = PathApi.parent(props.path);
  const fallbackParentElement = NodeApi.get(
    props.editor,
    fallbackParentPath,
  ) as TSlopeGroupElement | undefined;
  const resolvedParentElement = parentElement ?? fallbackParentElement;
  const total = resolvedParentElement?.children?.length || 1;
  const alignment = props.element.alignment ?? "center";
  const background = getPresentationAccentColor(
    props.element,
    resolvedParentElement,
    getSmartLayoutStepColor(index, total),
  );

  const handleIconChange = (icon: string) => {
    if (readOnly) return;
    const itemPath = props.editor.api.findPath(props.element);
    if (!itemPath) return;
    props.editor.tf.setNodes({ icon }, { at: itemPath });
  };

  return (
    <PlateElement
      {...props}
      className="group/slope-item relative flex h-full min-w-0 flex-1 flex-col items-center justify-start"
    >
      <div
        className="relative flex w-full max-w-44 min-w-28 flex-1 flex-col"
        style={{ marginTop: (total - 1 - index) * SLOPE_HEIGHT_STEP_PX }}
      >
        <div
          className="relative flex w-full flex-1 flex-col items-center rounded-t-full px-5 pt-5 pb-8 text-center"
          style={
            {
              background,
              minHeight: SLOPE_MIN_HEIGHT_PX,
              "--presentation-heading": "var(--presentation-card-background)",
              "--presentation-text": "var(--presentation-card-background)",
            } as React.CSSProperties
          }
          data-bg-export="true"
        >
          <div
            className="mb-9 flex size-30 shrink-0 items-center justify-center rounded-full bg-(--presentation-background) text-(--presentation-muted-foreground)"
            contentEditable={false}
            data-decor="true"
            data-slate-void="true"
          >
            {readOnly ? (
              <PresentationIcon
                icon={props.element.icon}
                fallbackIcon="FaLightbulb"
                size={96}
              />
            ) : (
              <IconPicker
                defaultIcon={props.element.icon}
                hidePlaceholderWhenEmpty
                onIconSelect={handleIconChange}
                onIconRemove={() => handleIconChange("")}
                className="size-24 rounded-full border-transparent bg-transparent text-(--presentation-muted-foreground) shadow-none hover:bg-black/5 [&_svg]:size-24!"
                size="lg"
              />
            )}
          </div>
          <div
            className={cn(
              "w-full min-w-0 text-(--presentation-foreground) [&_h1]:text-2xl [&_h2]:text-2xl [&_h3]:text-2xl [&_h4]:text-xl [&_p]:mt-2 [&_p]:text-sm",
              "[&_:is(.presentation-heading)]:[-webkit-background-clip:unset!important;]",
              "[&_:is(.presentation-heading)]:[-webkit-text-fill-color:unset!important;]",
              "[&_:is(.presentation-heading)]:[background-clip:unset!important;]",
              "[&_:is(.presentation-heading)]:[background:none!important;]",
              "[&_:is(.presentation-heading)]:text-(--presentation-text)!",
              alignment === "left" && "text-left **:text-left",
              alignment === "center" && "text-center **:text-center",
              alignment === "right" && "text-right **:text-right",
            )}
          >
            {props.children}
          </div>
        </div>
      </div>
    </PlateElement>
  );
}
