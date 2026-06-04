"use client";

import { type TElement } from "platejs";
import {
  PlateElement,
  useReadOnly,
  type PlateElementProps,
} from "platejs/react";

import { cn } from "@/lib/utils";

type TBlockquoteElement = TElement & {
  author?: string;
};

interface BlockquoteAuthorProps {
  author: string;
  isReadOnly: boolean;
  onChange: (author: string) => void;
  onFocus: () => void;
}

function BlockquoteAuthor({
  author,
  isReadOnly,
  onChange,
  onFocus,
}: BlockquoteAuthorProps) {
  if (isReadOnly) {
    if (!author) return null;

    return (
      <footer className="mt-2 text-sm text-muted-foreground">- {author}</footer>
    );
  }

  return (
    <input
      type="text"
      value={author}
      placeholder="Author name"
      onFocus={onFocus}
      onKeyDown={(e) => {
        e.stopPropagation();
      }}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onChange(e.target.value)}
      className={cn(
        "mt-2 w-full border-none bg-transparent text-sm text-muted-foreground outline-none",
        "placeholder:text-muted-foreground/60",
      )}
      aria-label="Block quote author"
    />
  );
}

export function BlockquoteElement(
  props: PlateElementProps<TBlockquoteElement>,
) {
  const readOnly = useReadOnly();
  const { children, element, ...plateProps } = props;
  const author = element.author ?? "";

  const handleAuthorChange = (newAuthor: string) => {
    if (readOnly) return;

    const blockquotePath = props.editor.api.findPath(element);
    if (!blockquotePath) return;

    props.editor.tf.setNodes({ author: newAuthor }, { at: blockquotePath });
  };

  const blurEditor = () => {
    props.editor.tf.blur();
  };

  return (
    <PlateElement
      as="blockquote"
      className="my-1 border-l-2 pl-6 italic"
      element={element}
      {...plateProps}
    >
      {children}

      <div contentEditable={false} data-decor="true" data-slate-void="true">
        <BlockquoteAuthor
          author={author}
          isReadOnly={readOnly}
          onChange={handleAuthorChange}
          onFocus={blurEditor}
        />
      </div>
    </PlateElement>
  );
}
