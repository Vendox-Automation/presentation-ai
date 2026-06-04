import { type TDateElement } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";

function formatDateElementLabel(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DateElementStatic(props: SlateElementProps<TDateElement>) {
  const { element } = props;

  return (
    <SlateElement className="inline-block" {...props}>
      <span className="w-fit rounded-sm bg-muted px-1 text-muted-foreground">
        {element.date ? (
          formatDateElementLabel(element.date)
        ) : (
          <span>Pick a date</span>
        )}
      </span>
      {props.children}
    </SlateElement>
  );
}
