import { type TAudioElement } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";

export function AudioElementStatic(props: SlateElementProps<TAudioElement>) {
  return (
    <SlateElement {...props} className="mb-1">
      <figure className="group relative cursor-default">
        <div className="h-16">
          <audio
            aria-label="media audio node static control"
            className="size-full"
            src={props.element.url}
            controls
          >
            <track kind="captions" src="data:text/vtt,WEBVTT%0A" />
          </audio>
        </div>
      </figure>
      {props.children}
    </SlateElement>
  );
}
