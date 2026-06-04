import { type TElement } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";

type TBlockquoteElement = TElement & {
  author?: string;
};

export function BlockquoteElementStatic(
  props: SlateElementProps<TBlockquoteElement>,
) {
  const { children, element, ...slateProps } = props;
  const author = element.author ?? "";

  return (
    <SlateElement
      as="blockquote"
      className="my-1 border-l-2 pl-6 italic"
      element={element}
      {...slateProps}
    >
      {children}
      {author && (
        <footer className="mt-2 text-sm text-muted-foreground">
          - {author}
        </footer>
      )}
    </SlateElement>
  );
}
