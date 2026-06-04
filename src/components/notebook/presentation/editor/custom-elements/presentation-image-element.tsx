"use client";

import { Image, useMediaState } from "@platejs/media/react";
import { ResizableProvider, ResizeHandle } from "@platejs/resizable";
import { type TImageElement } from "platejs";
import {
  PlateElement,
  useEditorRef,
  useReadOnly,
  withHOC,
  type PlateElementProps,
} from "platejs/react";
import { useEffect, useMemo, useRef } from "react";

import {
  mediaResizeHandleVariants,
  Resizable,
} from "@/components/plate/ui/resize-handle";
import { Spinner } from "@/components/ui/spinner";
import {
  getElementImageGenerationTarget,
  getPresentationImageGenerationKey,
  resolvePresentationImageGenerationSource,
} from "@/lib/presentation/image-generation";
import { cn } from "@/lib/utils";
import {
  usePresentationState,
  type ImageEditorMode,
  type PresentationStockImageProvider,
} from "@/states/presentation-state";
import { type ImageCropSettings } from "../../utils/types";
import { useDraggable } from "../dnd/hooks/useDraggable";
import { getPresentationImageCropStyles } from "./presentation-image-layout";
import { PresentationImagePlaceholder } from "./presentation-image-placeholder";

type PresentationImageNode = TImageElement & {
  id?: string;
  query?: string;
  cropSettings?: ImageCropSettings;
  imageSource?: "generate" | "search" | "gif" | "upload";
  stockImageProvider?: PresentationStockImageProvider;
  imageGenerationStatus?: "failed";
};

export interface PresentationImageElementProps extends PlateElementProps<PresentationImageNode> {
  nodeProps?: Record<string, unknown>;
}

export const PresentationImageElement = withHOC(
  ResizableProvider,
  function PresentationImageElement({
    children,
    className,
    nodeProps,
    ref,
    ...props
  }: PresentationImageElementProps) {
    const { align = "center", focused, readOnly, selected } = useMediaState();
    const { isDragging, handleRef } = useDraggable({
      element: props.element,
    });
    const imageRef = useRef<HTMLDivElement | null>(null);
    const editor = useEditorRef();
    const slideId = String(props.editor.id ?? "");

    const imageSource = usePresentationState((s) => s.imageSource);
    const imageModel = usePresentationState((s) => s.imageModel);
    const stockImageProvider = usePresentationState(
      (s) => s.stockImageProvider,
    );
    const setImageSearchState = usePresentationState(
      (s) => s.setImageSearchState,
    );
    const openPresentationImageEditor = usePresentationState(
      (s) => s.openPresentationImageEditor,
    );
    const presentationImageEditorInitialMode = usePresentationState(
      (s) => s.presentationImageEditorInitialMode,
    );
    const startPresentationImageGeneration = usePresentationState(
      (s) => s.startPresentationImageGeneration,
    );
    const rootImageGeneration = usePresentationState(
      (s) => s.rootImageGeneration,
    );

    const isReadOnly = useReadOnly();
    const generationTarget = useMemo(
      () =>
        slideId && props.element.id
          ? getElementImageGenerationTarget(slideId, props.element.id)
          : null,
      [props.element.id, slideId],
    );
    const generationKey = generationTarget
      ? getPresentationImageGenerationKey(generationTarget)
      : null;
    const computedGen = generationKey
      ? rootImageGeneration[generationKey]
      : undefined;
    const computedImageUrl =
      computedGen?.status === "success" && computedGen.url
        ? computedGen.url
        : props.element.url;
    const isGenerating =
      computedGen?.status === "queued" || computedGen?.status === "generating";
    const hasGenerationFailed =
      computedGen?.status === "error" ||
      props.element.imageGenerationStatus === "failed";

    const cropSettings: ImageCropSettings = props.element.cropSettings || {
      objectFit: "cover",
      objectPosition: { x: 50, y: 50 },
      zoom: 1,
    };

    const handleOpenEditor = (mode: ImageEditorMode) => {
      if (isReadOnly) return;
      if (props.element.id) {
        const boundUpdateElement = (updateProps: Record<string, unknown>) => {
          editor.tf.setNodes(updateProps as Partial<TImageElement>, {
            at: [],
            match: (n) => n.id === props.element.id,
          });
        };

        if (mode === "search") {
          setImageSearchState({
            mode: props.element.stockImageProvider ?? stockImageProvider,
          });
        }

        openPresentationImageEditor(
          mode,
          boundUpdateElement,
          {
            ...props.element,
            url: computedImageUrl,
          },
          getPresentationImageElementFrame(props.element),
        );
      }
    };

    useEffect(() => {
      if (
        !generationTarget ||
        !props.element.query ||
        props.element.url ||
        computedImageUrl ||
        hasGenerationFailed
      ) {
        return;
      }

      if (computedGen?.query === props.element.query) {
        return;
      }

      const source = resolvePresentationImageGenerationSource({
        globalImageSource: imageSource,
        imageSource: props.element.imageSource,
      });

      startPresentationImageGeneration(generationTarget, props.element.query, {
        imageModel,
        source,
        ...(source === "stock"
          ? {
              stockImageProvider:
                props.element.stockImageProvider ?? stockImageProvider,
            }
          : {}),
      });
    }, [
      computedGen?.query,
      computedImageUrl,
      generationTarget,
      hasGenerationFailed,
      imageModel,
      imageSource,
      props.element.imageSource,
      props.element.query,
      props.element.stockImageProvider,
      props.element.url,
      startPresentationImageGeneration,
      stockImageProvider,
    ]);

    const imageStyles = getPresentationImageCropStyles(cropSettings);

    if (isReadOnly) {
      return (
        <PlateElement ref={ref} className={cn(className)} {...props}>
          <div ref={imageRef}>
            <Resizable
              align={align}
              options={{
                align,
                readOnly,
              }}
            >
              {computedImageUrl ? (
                <div className="my-4 text-center">
                  <Image
                    ref={handleRef}
                    className={cn("h-auto max-w-full")}
                    alt={props.element.query ?? ""}
                    src={computedImageUrl}
                    loading="lazy"
                    decoding="async"
                    style={{
                      ...imageStyles,
                      borderRadius: "var(--presentation-border-radius, 0.5rem)",
                      boxShadow:
                        "var(--presentation-card-shadow, 0 1px 3px rgba(0,0,0,0.12))",
                    }}
                    {...nodeProps}
                  />
                </div>
              ) : (
                <PresentationImagePlaceholder
                  className="pointer-events-auto h-full w-full rounded-[inherit]"
                  element={props.element}
                  imageNotFound={hasGenerationFailed}
                />
              )}
              {children}
            </Resizable>
          </div>
        </PlateElement>
      );
    }

    return (
      <PlateElement ref={ref} className={cn(className)} {...props}>
        <div ref={imageRef}>
          <Resizable
            align={align}
            options={{
              align,
              readOnly,
            }}
            className={cn("flex", !props.element.width && "w-full")}
          >
            <ResizeHandle
              className={mediaResizeHandleVariants({ direction: "left" })}
              options={{ direction: "left" }}
            />
            {isGenerating && !computedImageUrl ? (
              <div className="relative min-h-50 w-full">
                <div className="absolute inset-0 flex items-center justify-center rounded-sm bg-muted">
                  <div className="flex flex-col items-center gap-2">
                    <Spinner className="h-6 w-6" />
                    <span className="text-sm text-muted-foreground">
                      Generating image...
                    </span>
                  </div>
                </div>
              </div>
            ) : !computedImageUrl ? (
              <div
                ref={handleRef}
                className={cn(
                  "my-4 aspect-video w-full",
                  focused && selected && "ring-2 ring-ring ring-offset-2",
                )}
                style={{
                  borderRadius: "var(--presentation-border-radius, 0.5rem)",
                }}
                {...nodeProps}
              >
                <PresentationImagePlaceholder
                  className="pointer-events-auto h-full w-full rounded-[inherit]"
                  element={props.element}
                  imageNotFound={hasGenerationFailed}
                />
              </div>
            ) : (
              <div className="my-4 flex-1 text-center">
                <Image
                  ref={handleRef}
                  className={cn(
                    "h-auto w-full",
                    "cursor-pointer",
                    focused && selected && "ring-2 ring-ring ring-offset-2",
                    isDragging && "opacity-50",
                  )}
                  alt={props.element.query ?? ""}
                  src={computedImageUrl}
                  loading="lazy"
                  decoding="async"
                  onClick={(event) => {
                    if (!presentationImageEditorInitialMode) {
                      return;
                    }

                    event.preventDefault();
                    event.stopPropagation();
                    handleOpenEditor(presentationImageEditorInitialMode);
                  }}
                  onDoubleClick={() => {
                    const mode: ImageEditorMode =
                      props.element.imageSource === "search"
                        ? "search"
                        : props.element.imageSource === "gif"
                          ? "gif"
                          : "generate";
                    handleOpenEditor(mode);
                  }}
                  style={{
                    ...imageStyles,
                    borderRadius: "var(--presentation-border-radius, 0.5rem)",
                    boxShadow:
                      "var(--presentation-card-shadow, 0 1px 3px rgba(0,0,0,0.12))",
                  }}
                  onError={(e) => {
                    console.error(
                      "Presentation image failed to load:",
                      e,
                      computedImageUrl,
                    );
                  }}
                  {...nodeProps}
                />
              </div>
            )}
            <ResizeHandle
              className={mediaResizeHandleVariants({
                direction: "right",
              })}
              options={{ direction: "right" }}
            />
            {children}
          </Resizable>
        </div>
      </PlateElement>
    );
  },
);

function getPresentationImageElementFrame(element: PresentationImageNode):
  | {
      height: number;
      width: number;
    }
  | undefined {
  const width = typeof element.width === "number" ? element.width : undefined;
  const height =
    typeof element.height === "number" ? element.height : undefined;

  if (width && height) {
    return { height, width };
  }

  return undefined;
}
