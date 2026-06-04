import { type TColumnElement } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";

function parseColumnWidth(width: unknown): number | null {
  if (width === undefined || width === null) return null;

  const parsed = Number.parseFloat(String(width));

  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.round(parsed * 100) / 100;
}

export function ColumnElementStatic(props: SlateElementProps<TColumnElement>) {
  const width = parseColumnWidth(props.element.width);
  const style =
    width === null
      ? { flex: "1 1 0", minWidth: 0 }
      : {
          flex: `0 0 ${width}%`,
          maxWidth: `${width}%`,
          minWidth: 0,
        };

  return (
    <div className="group/column relative" style={style}>
      <SlateElement
        className="px-2 pt-2 group-first/column:pl-0 group-last/column:pr-0"
        {...props}
      >
        <div className="relative border border-transparent p-1.5">
          {props.children}
        </div>
      </SlateElement>
    </div>
  );
}

export function ColumnGroupElementStatic(props: SlateElementProps) {
  return (
    <SlateElement className="mb-2" {...props}>
      <div className="flex w-full rounded">{props.children}</div>
    </SlateElement>
  );
}
