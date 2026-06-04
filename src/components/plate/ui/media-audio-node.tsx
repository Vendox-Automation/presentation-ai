"use client";

import { useMediaState } from "@platejs/media/react";
import { ResizableProvider } from "@platejs/resizable";
import { type TAudioElement } from "platejs";
import { PlateElement, withHOC, type PlateElementProps } from "platejs/react";

import { Caption, CaptionTextarea } from "./caption";

export const AudioElement = withHOC(
  ResizableProvider,
  function AudioElement(props: PlateElementProps<TAudioElement>) {
    const { align = "center", readOnly, unsafeUrl } = useMediaState();

    return (
      <PlateElement {...props} className="mb-1">
        <figure
          className="group relative cursor-default"
          contentEditable={false}
        >
          <div className="h-16">
            <audio
              aria-label="media audio node control"
              className="size-full"
              src={unsafeUrl}
              controls
            >
              <track kind="captions" src="data:text/vtt,WEBVTT%0A" />
            </audio>
          </div>

          <Caption style={{ width: "100%" }} align={align}>
            <CaptionTextarea
              className="h-20"
              readOnly={readOnly}
              placeholder="Write a caption..."
            />
          </Caption>
        </figure>
        {props.children}
      </PlateElement>
    );
  },
);
