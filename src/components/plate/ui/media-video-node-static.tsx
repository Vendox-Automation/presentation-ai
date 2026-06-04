import {
  NodeApi,
  type TCaptionElement,
  type TResizableProps,
  type TVideoElement,
} from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";

export function VideoElementStatic(
  props: SlateElementProps<TVideoElement & TCaptionElement & TResizableProps>,
) {
  const { align = "center", caption, url, width } = props.element;

  return (
    <SlateElement className="py-2.5" {...props}>
      <div style={{ textAlign: align }}>
        <figure
          className="group relative m-0 inline-block cursor-default"
          style={{ width }}
        >
          <video
            aria-label="media video node static control"
            className="w-full max-w-full rounded-sm object-cover px-0"
            src={url}
            controls
          >
            <track kind="captions" src="data:text/vtt,WEBVTT%0A" />
          </video>
          {caption && <figcaption>{NodeApi.string(caption[0]!)}</figcaption>}
        </figure>
      </div>
      {props.children}
    </SlateElement>
  );
}
