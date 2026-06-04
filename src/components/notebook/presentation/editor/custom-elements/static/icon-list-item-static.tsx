"use client";

import { ImageIcon } from "lucide-react";
import Image from "next/image";
import { NodeApi, PathApi } from "platejs";
import { SlateElement, type SlateElementProps } from "platejs/static";
import { useEffect } from "react";

import { Spinner } from "@/components/ui/spinner";
import {
  getElementImageGenerationKey,
  getElementImageGenerationTarget,
  resolvePresentationImageGenerationSource,
} from "@/lib/presentation/image-generation";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";
import { type TIconListItemElement } from "../../plugins/icon-list-plugin";
import {
  getAlignmentClasses,
  getIconListMediaSize,
  getIconListOrientation,
  getIconListVariant,
} from "../../utils";
import { PresentationIcon } from "../presentation-icon";
import { getPresentationImageCropStyles } from "../presentation-image-layout";

export function IconListItemStatic(
  props: SlateElementProps<TIconListItemElement>,
) {
  const slideId = String(props.editor.id ?? "");
  const path = props.editor.api.findPath(props.element) ?? [-1];
  const parentPath = PathApi.parent(path);
  const parentElement = NodeApi.get(props.editor, parentPath) as {
    alignment?: "left" | "center" | "right";
    children?: unknown[];
    mediaSize?: unknown;
    orientation?: unknown;
    variant?: unknown;
  };
  const alignment =
    props.element.alignment ?? parentElement?.alignment ?? "left";
  const { icon } = props.element;
  const variant = getIconListVariant(parentElement?.variant);
  const orientation = getIconListOrientation(
    parentElement?.orientation,
    parentElement?.children?.length ?? 0,
  );
  const mediaSize = getIconListMediaSize(parentElement?.mediaSize);
  const iconSize = Math.round(mediaSize);
  const mediaStyle = {
    height: mediaSize,
    width: mediaSize,
  };
  const prompt = props.element.prompt ?? props.element.query ?? "";
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
    rawComputedGen && rawComputedGen.query.trim() === prompt.trim()
      ? rawComputedGen
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

  useEffect(() => {
    const trimmedPrompt = prompt.trim();

    if (
      variant !== "image" ||
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
    imageSource,
    prompt,
    props.element.imageSource,
    props.element.stockImageProvider,
    slideId,
    startPresentationImageGeneration,
    stockImageProvider,
    variant,
  ]);

  const mediaElement =
    variant === "image" ? (
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/30 shadow-xs"
        data-decor="true"
        style={mediaStyle}
      >
        {isGenerating && !computedImageUrl ? (
          <Spinner className="size-5" />
        ) : computedImageUrl ? (
          <Image
            unoptimized
            width={400}
            height={300}
            alt={prompt}
            className="size-full object-cover"
            decoding="async"
            loading="lazy"
            src={computedImageUrl}
            style={getPresentationImageCropStyles(props.element.cropSettings)}
          />
        ) : (
          <ImageIcon
            aria-hidden="true"
            className={cn(
              "text-muted-foreground",
              hasGenerationFailed && "text-destructive",
            )}
            size={iconSize}
          />
        )}
      </div>
    ) : icon ? (
      <div data-decor="true" style={mediaStyle}>
        <PresentationIcon
          icon={icon}
          size={iconSize}
          className="flex size-full shrink-0 items-center justify-center"
          iconClassName="size-full"
        />
      </div>
    ) : null;

  return (
    <SlateElement {...props}>
      <div className={cn("group/icon-item relative w-full")}>
        <div
          className={cn(
            "flex w-full gap-4",
            orientation === "top" ? "flex-col items-start" : "items-start",
            orientation === "side" &&
              alignment === "right" &&
              "flex-row-reverse",
            alignment === "center" && "justify-center",
            orientation === "top" && alignment === "center" && "items-center",
            orientation === "top" && alignment === "right" && "items-end",
          )}
        >
          {mediaElement}

          <div className={cn("min-w-0 flex-1", getAlignmentClasses(alignment))}>
            {props.children}
          </div>
        </div>
      </div>
    </SlateElement>
  );
}
