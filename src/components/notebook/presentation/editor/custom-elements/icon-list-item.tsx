"use client";

import { ImageIcon, Plus } from "lucide-react";
import { NodeApi, PathApi } from "platejs";
import {
  PlateElement,
  useReadOnly,
  type PlateElementProps,
} from "platejs/react";
import { useEffect, useMemo, useRef, useState } from "react";

import { IconPicker } from "@/components/ui/icon-picker";
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
} from "@/states/presentation-state";
import { type TIconListItemElement } from "../plugins/icon-list-plugin";
import {
  getAlignmentClasses,
  getIconListMediaSize,
  getIconListOrientation,
  getIconListVariant,
} from "../utils";
import { PALETTE_DROP_MUTABLE_KEY } from "../utils/paletteDrop";
import { PresentationIcon } from "./presentation-icon";
import { getPresentationImageCropStyles } from "./presentation-image-layout";

// IconItem component for individual items in the icons list
export const IconListElement = (
  props: PlateElementProps<TIconListItemElement>,
) => {
  const parentPath = PathApi.parent(props.path);
  const parentElement = NodeApi.get(props.editor, parentPath);
  const {
    alignment = "left",
    mediaSize,
    orientation,
    variant,
    children = [],
  } = parentElement as {
    alignment?: "left" | "center" | "right";
    children?: unknown[];
    mediaSize?: unknown;
    orientation?: unknown;
    variant?: unknown;
  };
  const { icon } = props.element;
  const itemPrompt = props.element.prompt ?? props.element.query ?? "";
  const itemUrl = props.element.url;
  const resolvedVariant = getIconListVariant(variant);
  const resolvedOrientation = getIconListOrientation(
    orientation,
    children.length,
  );
  const itemRef = useRef<HTMLDivElement | null>(null);
  const isReadOnly = useReadOnly();
  const [isFullRowItem, setIsFullRowItem] = useState(children.length <= 1);
  const effectiveOrientation =
    resolvedOrientation === "top" && isFullRowItem
      ? "side"
      : resolvedOrientation;
  const resolvedMediaSize = getIconListMediaSize(mediaSize);
  const imageSource = usePresentationState((s) => s.imageSource);
  const imageModel = usePresentationState((s) => s.imageModel);
  const stockImageProvider = usePresentationState((s) => s.stockImageProvider);
  const startPresentationImageGeneration = usePresentationState(
    (s) => s.startPresentationImageGeneration,
  );
  const rootImageGeneration = usePresentationState(
    (s) => s.rootImageGeneration,
  );
  const openPresentationImageEditor = usePresentationState(
    (s) => s.openPresentationImageEditor,
  );
  const presentationImageEditorInitialMode = usePresentationState(
    (s) => s.presentationImageEditorInitialMode,
  );
  const setImageSearchState = usePresentationState(
    (s) => s.setImageSearchState,
  );
  const slideId = String(props.editor.id ?? "");
  const elementId =
    typeof props.element.id === "string" ? props.element.id : undefined;
  const generationTarget = useMemo(
    () =>
      slideId && elementId
        ? getElementImageGenerationTarget(slideId, elementId)
        : null,
    [elementId, slideId],
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
      : itemUrl;
  const isGenerating =
    computedGen?.status === "queued" || computedGen?.status === "generating";
  const hasGenerationFailed =
    computedGen?.status === "error" ||
    props.element.imageGenerationStatus === "failed";

  const handleIconSelect = (iconName: string) => {
    const itemPath = props.editor.api.findPath(props.element);
    if (!itemPath) return;
    props.editor.tf.setNodes({ icon: iconName }, { at: itemPath });
  };

  const handleOpenImageEditor = (mode: ImageEditorMode) => {
    if (isReadOnly || !elementId) {
      return;
    }

    const boundUpdateElement = (updateProps: Record<string, unknown>) => {
      const queryPatch =
        typeof updateProps.query === "string"
          ? { prompt: updateProps.query }
          : {};

      props.editor.tf.setNodes(
        {
          ...updateProps,
          ...queryPatch,
          [PALETTE_DROP_MUTABLE_KEY]: false,
        },
        {
          at: [],
          match: (node) => node.id === elementId,
        },
      );
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
        query: itemPrompt,
        url: computedImageUrl,
      },
      {
        height: resolvedMediaSize,
        width: resolvedMediaSize,
      },
    );
  };

  useEffect(() => {
    const itemElement = itemRef.current;
    const gridElement = itemElement?.closest("[data-icon-list-grid='true']");

    if (!itemElement || !(gridElement instanceof HTMLElement)) {
      return;
    }

    const updateRowState = () => {
      setIsFullRowItem(
        itemElement.offsetWidth >= gridElement.clientWidth * 0.85,
      );
    };

    updateRowState();

    const observer = new ResizeObserver(updateRowState);
    observer.observe(itemElement);
    observer.observe(gridElement);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (
      resolvedVariant !== "image" ||
      !generationTarget ||
      !itemPrompt ||
      computedImageUrl ||
      hasGenerationFailed
    ) {
      return;
    }

    if (computedGen?.query === itemPrompt) {
      return;
    }

    const source = resolvePresentationImageGenerationSource({
      globalImageSource: imageSource,
      imageSource: props.element.imageSource,
    });

    startPresentationImageGeneration(generationTarget, itemPrompt, {
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
    itemPrompt,
    props.element.imageSource,
    props.element.stockImageProvider,
    resolvedVariant,
    startPresentationImageGeneration,
    stockImageProvider,
  ]);

  const mediaStyle = {
    height: resolvedMediaSize,
    width: resolvedMediaSize,
  };
  const mediaIconSize = Math.round(resolvedMediaSize);
  const hasIcon = Boolean(icon?.trim());
  const removeIcon = () => {
    const itemPath = props.editor.api.findPath(props.element);
    if (!itemPath) return;
    props.editor.tf.setNodes({ icon: "" }, { at: itemPath });
  };
  const mediaElement =
    resolvedVariant === "image" ? (
      <div
        className="flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border bg-muted/30 shadow-xs"
        data-decor="true"
        onClick={(event) => {
          event.stopPropagation();

          if (presentationImageEditorInitialMode) {
            event.preventDefault();
            handleOpenImageEditor(presentationImageEditorInitialMode);
          }
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();

          const mode: ImageEditorMode =
            props.element.imageSource === "search"
              ? "search"
              : props.element.imageSource === "gif"
                ? "gif"
                : "generate";

          handleOpenImageEditor(mode);
        }}
        onContextMenu={(event) => {
          event.preventDefault();
          event.stopPropagation();

          const mode: ImageEditorMode =
            props.element.imageSource === "search"
              ? "search"
              : props.element.imageSource === "gif"
                ? "gif"
                : "generate";

          handleOpenImageEditor(mode);
        }}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        style={mediaStyle}
      >
        {isGenerating && !computedImageUrl ? (
          <Spinner className="size-5" />
        ) : computedImageUrl ? (
          // biome-ignore lint/performance/noImgElement: Generated editor thumbnail needs direct sizing.
          <img
            alt={itemPrompt}
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
            size={mediaIconSize}
          />
        )}
      </div>
    ) : (
      <div className="relative shrink-0" data-decor="true" style={mediaStyle}>
        {hasIcon ? (
          <>
            <PresentationIcon
              icon={icon}
              size={mediaIconSize}
              className="flex size-full items-center justify-center"
              iconClassName="size-full"
            />
            {!isReadOnly ? (
              <IconPicker
                defaultIcon={icon}
                onIconSelect={(iconName) => handleIconSelect(iconName)}
                onIconRemove={removeIcon}
                className="absolute inset-0 size-full border-0 bg-transparent! p-0 opacity-0 shadow-none hover:bg-transparent!"
                iconClassName="size-full"
                iconPixelSize={mediaIconSize}
                size="md"
              />
            ) : null}
          </>
        ) : (
          <IconPicker
            defaultIcon={icon}
            hidePlaceholderWhenEmpty
            onIconSelect={(iconName) => handleIconSelect(iconName)}
            onIconRemove={removeIcon}
            className="size-full border-0 bg-transparent! p-0 shadow-none hover:bg-transparent! hover:opacity-80"
            iconClassName="size-full"
            iconPixelSize={mediaIconSize}
            placeholder={
              <Plus
                className="size-full text-muted-foreground"
                size={mediaIconSize}
              />
            }
            size="md"
          />
        )}
      </div>
    );

  return (
    <PlateElement {...props}>
      <div
        ref={itemRef}
        className={cn("group group/icon-item relative w-full")}
      >
        <div
          className={cn(
            "flex w-full gap-4",
            effectiveOrientation === "top"
              ? "flex-col items-start"
              : "items-start",
            effectiveOrientation === "side" &&
              alignment === "right" &&
              "flex-row-reverse",
            alignment === "center" && "justify-center",
            effectiveOrientation === "top" &&
              alignment === "center" &&
              "items-center",
            effectiveOrientation === "top" &&
              alignment === "right" &&
              "items-end",
          )}
        >
          {mediaElement}

          <div className={cn("min-w-0 flex-1", getAlignmentClasses(alignment))}>
            {props.children}
          </div>
        </div>
      </div>
    </PlateElement>
  );
};
