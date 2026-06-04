import { NodeApi, PathApi } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";

import { type TStepsGroupElement } from "../../plugins/steps-plugin";
import { getDefaultColumnSize } from "../../utils";

const columnSizeToColumns: Record<string, number> = {
  sm: 4,
  md: 3,
  lg: 2,
  xl: 1,
};

export function StepsItemStatic(props: SlateElementProps) {
  const path = props.editor.api.findPath(props.element) ?? [-1];
  const parentPath = PathApi.parent(path);
  const parent = NodeApi.get(props.editor, parentPath) as TStepsGroupElement;
  const index = (path?.at(-1) as number) ?? 0;

  const { variant = "default" } = parent ?? {};
  const columnSize =
    parent?.columnSize ?? getDefaultColumnSize(parent?.children.length ?? 0);

  const columns = columnSizeToColumns[columnSize] ?? 3;

  const isVertical = columns === 1;
  const colIndex = isVertical ? index : index % columns;

  const primaryColor =
    "var(--presentation-smart-layout, var(--presentation-primary))";

  if (!isVertical) {
    if (variant === "default") {
      const topMargin = Math.max(0, (columns - 1 - colIndex) * 2);
      return (
        <SlateElement {...props} className="my-0 flex h-full min-w-0 flex-col">
          <div
            className="flex flex-1 flex-col"
            style={{ marginTop: `${topMargin}rem` }}
          >
            <div
              className="mb-3 h-1.5 w-full shrink-0 rounded-full"
              data-decor="true"
              style={{ backgroundColor: primaryColor }}
            />
            <div className="flex-1">{props.children}</div>
          </div>
        </SlateElement>
      );
    }

    if (variant === "arrow") {
      const topMargin = Math.max(0, (columns - 1 - colIndex) * 2);
      return (
        <SlateElement {...props} className="my-0 flex h-full min-w-0 flex-col">
          <div
            className="flex flex-1 flex-col"
            style={{ marginTop: `${topMargin}rem` }}
          >
            <div
              className="mb-3 flex w-full shrink-0 items-center pr-4"
              data-decor="true"
              style={{ color: primaryColor }}
            >
              <div className="h-3 flex-1 bg-current" />
              <svg
                viewBox="0 0 16 24"
                className="-ml-px h-6 w-4 shrink-0 fill-current"
              >
                <path d="M0 0l16 12-16 12z" />
              </svg>
            </div>
            <div className="flex-1">{props.children}</div>
          </div>
        </SlateElement>
      );
    }

    if (variant === "box") {
      const topMargin = Math.max(0, (columns - 1 - colIndex) * 2);
      return (
        <SlateElement {...props} className="my-0 flex h-full min-w-0 flex-col">
          <div
            className="flex flex-1 flex-col"
            style={{ marginTop: `${topMargin}rem` }}
          >
            <div
              className="flex-1 rounded-lg border p-4"
              style={{
                borderLeftWidth: "6px",
                borderColor: primaryColor,
              }}
            >
              <div>{props.children}</div>
            </div>
          </div>
        </SlateElement>
      );
    }
  }

  // Vertical layout
  if (variant === "default") {
    return (
      <SlateElement {...props} className="my-0 min-w-0">
        <div
          className="py-2 pl-4"
          style={{
            marginLeft: `${colIndex * 1.5}rem`,
            borderLeftWidth: "6px",
            borderLeftStyle: "solid",
            borderLeftColor: primaryColor,
          }}
        >
          <div>{props.children}</div>
        </div>
      </SlateElement>
    );
  }

  if (variant === "arrow") {
    return (
      <SlateElement {...props} className="my-0 min-w-0">
        <div
          className="flex gap-4"
          style={{ marginLeft: `${colIndex * 1.5}rem` }}
        >
          <div
            className="flex shrink-0 flex-col items-center"
            data-decor="true"
            style={{ color: primaryColor }}
          >
            <div className="w-3 flex-1 bg-current" />
            <svg
              viewBox="0 0 24 16"
              className="-mt-px h-4 w-6 shrink-0 fill-current"
            >
              <path d="M0 0l12 16 12-16z" />
            </svg>
          </div>
          <div className="min-w-0 pb-4">{props.children}</div>
        </div>
      </SlateElement>
    );
  }

  if (variant === "box") {
    return (
      <SlateElement {...props} className="my-0 min-w-0">
        <div
          className="w-full rounded-lg border p-4"
          style={{
            marginLeft: `${colIndex * 1.5}rem`,
            width: `calc(100% - ${colIndex * 1.5}rem)`,
            borderLeftWidth: "6px",
            borderLeftStyle: "solid",
            borderColor: primaryColor,
          }}
        >
          <div>{props.children}</div>
        </div>
      </SlateElement>
    );
  }

  // Fallback
  return (
    <SlateElement {...props} className="my-0 min-w-0">
      {props.children}
    </SlateElement>
  );
}
