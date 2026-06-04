"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { type TImageElement } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";
import type * as React from "react";
import { useEffect } from "react";

import { Spinner } from "@/components/ui/spinner";
import {
  getElementImageGenerationKey,
  getElementImageGenerationTarget,
  resolvePresentationImageGenerationSource,
} from "@/lib/presentation/image-generation";
import { cn } from "@/lib/utils";
import {
  usePresentationState,
  type PresentationStockImageProvider,
} from "@/states/presentation-state";
import { type ImageCropSettings } from "../../../utils/types";
import {
  getPresentationImageFrameStyles,
  presentationImageAlignmentClasses,
} from "../presentation-image-layout";

type StaticPresentationImageElement = TImageElement & {
  align?: "center" | "left" | "right";
  cropSettings?: ImageCropSettings;
  id?: string;
  imageGenerationStatus?: "failed";
  imageSource?: "generate" | "search" | "gif" | "upload";
  prompt?: string;
  query?: string;
  stockImageProvider?: PresentationStockImageProvider;
};

// Static renderer for presentation image that preserves crop styles
export function PresentationImageElementStatic(
  props: SlateElementProps<StaticPresentationImageElement>,
) {
  const { url, cropSettings, width, align = "center" } = props.element;
  const slideId = String(props.editor.id ?? "");
  const imagePrompt = props.element.query ?? props.element.prompt ?? "";
  const imageSource = usePresentationState((s) => s.imageSource);
  const imageModel = usePresentationState((s) => s.imageModel);
  const stockImageProvider = usePresentationState((s) => s.stockImageProvider);
  const startPresentationImageGeneration = usePresentationState(
    (s) => s.startPresentationImageGeneration,
  );
  const rootImageGeneration = usePresentationState(
    (s) => s.rootImageGeneration,
  );
  const elementId =
    typeof props.element.id === "string" ? props.element.id : undefined;
  const generationKey =
    slideId && elementId
      ? getElementImageGenerationKey(slideId, elementId)
      : null;
  const rawComputedGen = generationKey
    ? rootImageGeneration[generationKey]
    : undefined;
  const computedGen =
    rawComputedGen && rawComputedGen.query.trim() === imagePrompt.trim()
      ? rawComputedGen
      : undefined;
  const computedImageUrl =
    computedGen?.status === "success" && computedGen.url
      ? computedGen.url
      : url;
  const isGenerating =
    computedGen?.status === "queued" || computedGen?.status === "generating";
  const hasGenerationFailed =
    computedGen?.status === "error" ||
    props.element.imageGenerationStatus === "failed";

  const imageStyles = getPresentationImageFrameStyles(cropSettings);

  useEffect(() => {
    const trimmedPrompt = imagePrompt.trim();

    if (
      !slideId ||
      !elementId ||
      !trimmedPrompt ||
      computedImageUrl ||
      hasGenerationFailed
    ) {
      return;
    }

    if (computedGen?.query.trim() === trimmedPrompt) {
      return;
    }

    const source = resolvePresentationImageGenerationSource({
      globalImageSource: imageSource,
      imageSource: props.element.imageSource,
    });
    const generationTarget = getElementImageGenerationTarget(
      slideId,
      elementId,
    );

    startPresentationImageGeneration(generationTarget, trimmedPrompt, {
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
    elementId,
    hasGenerationFailed,
    imageModel,
    imagePrompt,
    imageSource,
    props.element.imageSource,
    props.element.stockImageProvider,
    slideId,
    startPresentationImageGeneration,
    stockImageProvider,
  ]);

  // Container styles for width and alignment
  const containerStyles: React.CSSProperties = {
    width:
      typeof width === "string" || typeof width === "number" ? width : "100%",
  };

  if (!computedImageUrl) {
    return (
      <SlateElement {...props} className={cn(props.className, "block")}>
        <div
          className={cn(
            "flex aspect-video items-center justify-center rounded-md bg-muted/30",
            presentationImageAlignmentClasses[align],
          )}
          style={{
            ...containerStyles,
            borderRadius: "var(--presentation-border-radius, 0.5rem)",
          }}
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            {isGenerating ? (
              <>
                <Spinner className="size-6" />
                <span className="text-sm">Generating image&hellip;</span>
              </>
            ) : (
              <>
                <ImageIcon
                  className={cn(
                    "h-8 w-8",
                    hasGenerationFailed && "text-destructive",
                  )}
                />
                <span className="text-sm">
                  {hasGenerationFailed ? "Image generation failed" : "No image"}
                </span>
              </>
            )}
          </div>
        </div>
        {props.children}
      </SlateElement>
    );
  }

  return (
    <SlateElement {...props} className={cn(props.className)}>
      <div
        className={cn(
          "my-4 text-center",
          presentationImageAlignmentClasses[align],
        )}
        style={containerStyles}
      >
        <Image
          unoptimized
          width={400}
          height={300}
          src={computedImageUrl}
          alt={imagePrompt}
          className="inline-block h-auto max-w-full"
          style={imageStyles}
        />
      </div>
      {props.children}
    </SlateElement>
  );
}
