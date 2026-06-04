import { NodeApi, PathApi } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";
import {
  type TBulletGroupElement,
  type TBulletItemElement,
} from "../../plugins/bullet-plugin";
import { getAlignmentClasses } from "../../utils";
import { ArrowMarker } from "../bullet-item";
import {
  bulletItemVariants,
  bulletMarkerVariants,
} from "../bullet-item";
import { PresentationIcon } from "../presentation-icon";

export function BulletItemStatic(props: SlateElementProps<TBulletItemElement>) {
  const path = props.editor.api.findPath(props.element) ?? [-1];
  const parentPath = PathApi.parent(path);
  const parentElement = NodeApi.get(
    props.editor,
    parentPath,
  ) as TBulletGroupElement;

  const bulletType = parentElement?.bulletType ?? "numbered";
  const index = path.at(-1) as number;

  // Get alignment - use item alignment if set, otherwise inherit from parent
  const itemAlignment = props.element.alignment;
  const parentAlignment = parentElement?.alignment;
  const alignment = itemAlignment ?? parentAlignment ?? "left";
  const { icon } = props.element;
  const markerColor =
    (parentElement?.color as string) || "var(--presentation-primary)";

  return (
    <SlateElement {...props}>
      <div className={cn("group/bullet-item relative")}>
        {/* The bullet item layout with numbered block and content */}
        <div
          className={cn(
            bulletItemVariants({ bulletType }),
            "gap-3",
            alignment === "right" && "flex-row-reverse",
          )}
        >
          {/* Bullet marker - numbered, basic dot, or arrow */}
          <div
            data-decor="true"
            className={bulletMarkerVariants({ bulletType })}
            style={{
              backgroundColor:
                bulletType === "numbered" ? markerColor : "transparent",
              borderColor: "transparent",
              color:
                bulletType === "numbered"
                  ? "var(--presentation-background)"
                  : markerColor,
            }}
          >
            {icon ? (
              <PresentationIcon icon={icon} size={20} />
            ) : bulletType === "numbered" ? (
              index + 1
            ) : bulletType === "arrow" ? (
              <ArrowMarker color={markerColor} />
            ) : (
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: markerColor }}
              />
            )}
          </div>

          <div className={cn("flex-1", getAlignmentClasses(alignment))}>
            {props.children}
          </div>
        </div>
      </div>
    </SlateElement>
  );
}
