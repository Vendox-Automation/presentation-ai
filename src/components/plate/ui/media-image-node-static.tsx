import Image from "next/image";
import {
  NodeApi,
  type TCaptionProps,
  type TImageElement,
  type TResizableProps,
} from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";

export function ImageElementStatic(
  props: SlateElementProps<TImageElement & TCaptionProps & TResizableProps>,
) {
  const { align = "center", caption, url, width } = props.element;

  return (
    <SlateElement {...props} className="py-2.5">
      <figure className="group relative m-0 inline-block" style={{ width }}>
        <div
          className="relative max-w-full min-w-23"
          style={{ textAlign: align }}
        >
          <Image
            unoptimized
            width={400}
            height={300}
            className={cn(
              "w-full max-w-full cursor-default object-cover px-0",
              "rounded-sm",
            )}
            alt={props.attributes.alt as string}
            src={url}
          />
          {caption && (
            <figcaption className="mx-auto mt-2 h-6 max-w-full">
              {NodeApi.string(caption![0]!)}
            </figcaption>
          )}
        </div>
      </figure>
      {props.children}
    </SlateElement>
  );
}
