"use client";

import { DndPlugin, type DragItemNode } from "@platejs/dnd";
import { ImagePlugin } from "@platejs/media/react";
import { useEditorRef } from "platejs/react";
import { type ResizeCallback } from "re-resizable";
import { useCallback, useId, useMemo } from "react";
import { type DragSourceMonitor } from "react-dnd";

import {
  BASE_HEIGHT,
  BASE_WIDTH_PERCENTAGE,
  getRootImageCropSettings,
  getRootImageObjectStyles,
  getRootImageSizeStyle,
  MAX_HEIGHT,
  MAX_WIDTH_PERCENTAGE,
  MIN_HEIGHT,
  MIN_WIDTH_PERCENTAGE,
} from "@/components/notebook/presentation/editor/custom-elements/root-image-layout";
import { useDraggable } from "@/components/notebook/presentation/editor/dnd/hooks/useDraggable";
import {
  type LayoutType,
  type PlateSlide,
  type RootImage,
} from "@/components/notebook/presentation/utils/parser";
import { type ImageCropSettings } from "@/components/notebook/presentation/utils/types";
import { useDebouncedSave } from "@/hooks/presentation/useDebouncedSave";
import { usePresentationState } from "@/states/presentation-state";

export {
  BASE_HEIGHT,
  BASE_WIDTH_PERCENTAGE,
  MAX_HEIGHT,
  MAX_WIDTH_PERCENTAGE,
  MIN_HEIGHT,
  MIN_WIDTH_PERCENTAGE,
} from "@/components/notebook/presentation/editor/custom-elements/root-image-layout";

type UseRootImageActionsOptions = {
  image?: RootImage;
  layoutType?: LayoutType | string;
  maxHeightPx?: number;
  slideId?: string;
};

function getMeasuredEditorHeight(resizeElement: HTMLElement) {
  const slideRoot = resizeElement.closest<HTMLElement>(
    '[data-slide-content="true"]',
  );
  const editorRegion = slideRoot?.querySelector<HTMLElement>(
    '[data-presentation-editor-region="true"]',
  );
  const editorHeight = editorRegion?.getBoundingClientRect().height;

  return typeof editorHeight === "number" && editorHeight > 0
    ? Math.round(editorHeight)
    : undefined;
}

function getMaxAllowedRootImageHeight(
  resizeElement: HTMLElement,
  maxHeightPx?: number,
) {
  const measuredEditorHeight = getMeasuredEditorHeight(resizeElement);

  if (typeof maxHeightPx === "number" && maxHeightPx > 0) {
    return Math.min(MAX_HEIGHT, maxHeightPx);
  }

  if (typeof measuredEditorHeight === "number") {
    return Math.min(MAX_HEIGHT, measuredEditorHeight);
  }

  return MAX_HEIGHT;
}

function constrainRootImageHeight(height: number, maxAllowedHeight: number) {
  return Math.min(maxAllowedHeight, Math.max(MIN_HEIGHT, height));
}

export function useRootImageActions(
  slideId: string,
  options: UseRootImageActionsOptions = {},
) {
  const { image, layoutType, maxHeightPx } = options;

  const setSlides = usePresentationState((s) => s.setSlides);
  const startRootImageGeneration = usePresentationState(
    (s) => s.startRootImageGeneration,
  );
  const rootImageGeneration = usePresentationState(
    (s) => s.rootImageGeneration,
  );
  const { saveImmediately } = useDebouncedSave();

  const editor = useEditorRef();

  const size = useMemo(
    () => ({
      w: image?.size?.w ?? undefined,
      h: image?.size?.h ?? undefined,
    }),
    [image?.size?.h, image?.size?.w],
  );

  const computedGen = useMemo(
    () => (slideId ? rootImageGeneration[slideId] : undefined),
    [rootImageGeneration, slideId],
  );
  const matchingComputedGen = useMemo(() => {
    if (!computedGen) {
      return undefined;
    }

    const imageQuery = image?.query?.trim();
    return !imageQuery || computedGen.query.trim() === imageQuery
      ? computedGen
      : undefined;
  }, [computedGen, image?.query]);
  const computedImageUrl = useMemo(() => {
    // If it's an embed, return the embed URL directly
    if (image?.embedType) {
      return image.url;
    }
    // Otherwise, use the generated or existing image URL
    return matchingComputedGen?.url ?? image?.url;
  }, [matchingComputedGen?.url, image?.url, image?.embedType]);

  // Get crop settings from image or use defaults
  const cropSettings: ImageCropSettings = useMemo(
    () =>
      image
        ? getRootImageCropSettings(image)
        : {
            objectFit: "cover",
            objectPosition: { x: 50, y: 50 },
            zoom: 1,
          },
    [image],
  );

  // Derived styles
  const imageStyles: React.CSSProperties = useMemo(
    () =>
      image
        ? getRootImageObjectStyles(image)
        : {
            objectFit: cropSettings.objectFit,
            objectPosition: `${cropSettings.objectPosition.x}% ${cropSettings.objectPosition.y}%`,
            transform: `scale(${cropSettings.zoom ?? 1})`,
            transformOrigin: `${cropSettings.objectPosition.x}% ${cropSettings.objectPosition.y}%`,
            height: "100%",
            width: "100%",
            display: "block",
          },
    [cropSettings, image],
  );

  const sizeStyle: React.CSSProperties = useMemo(() => {
    if (image) {
      return getRootImageSizeStyle(image, layoutType);
    }

    if (!size.h && !size.w) {
      if (layoutType === "vertical") {
        return { height: BASE_HEIGHT, width: "100%" } as const;
      }
      return { width: BASE_WIDTH_PERCENTAGE, height: "auto" } as const;
    }
    if (layoutType === "vertical") {
      return { height: size.h ?? BASE_HEIGHT, width: "100%" } as const;
    }
    return { width: size.w ?? BASE_WIDTH_PERCENTAGE, height: "auto" } as const;
  }, [image, layoutType, size.h, size.w]);

  const updateCropSettings = useCallback(
    (settings: ImageCropSettings) => {
      const { slides } = usePresentationState.getState();
      const updatedSlides = slides.map((slide: PlateSlide) => {
        if (slide.id === slideId) {
          return {
            ...slide,
            rootImage: {
              ...slide.rootImage!,
              cropSettings: settings,
            },
          };
        }
        return slide;
      });
      setSlides(updatedSlides);
      setTimeout(() => {
        void saveImmediately();
      }, 100);
    },
    [saveImmediately, setSlides, slideId],
  );

  const replaceImageUrl = useCallback(
    (url: string, query: string) => {
      const { slides } = usePresentationState.getState();
      const resetCrop: ImageCropSettings = {
        objectFit: "cover",
        objectPosition: { x: 50, y: 50 },
        zoom: 1,
      };
      const updatedSlides = slides.map((slide: PlateSlide) => {
        if (slide.id === slideId) {
          return {
            ...slide,
            rootImage: {
              ...(slide.rootImage ?? { query }),
              url,
              cropSettings: resetCrop,
            },
          };
        }
        return slide;
      });
      setSlides(updatedSlides);
      void saveImmediately();
    },
    [saveImmediately, setSlides, slideId],
  );

  const removeRootImage = useCallback(
    (matchUrls?: string[]) => {
      const { slides, clearRootImageGeneration } =
        usePresentationState.getState();
      const updatedSlides = slides.map((slide: PlateSlide) => {
        if (slide.id === slideId) {
          if (!slide.rootImage) return slide;
          if (matchUrls && !matchUrls.includes(slide.rootImage.url ?? "")) {
            return slide;
          }
          const { rootImage: _rootImage, ...rest } = slide as PlateSlide & {
            rootImage?: PlateSlide["rootImage"];
          };
          if (slideId) {
            clearRootImageGeneration(slideId);
          }
          return rest as PlateSlide;
        }
        return slide;
      });
      setSlides(updatedSlides);
    },
    [setSlides, slideId],
  );

  const removeRootImageFromSlide = useCallback(() => {
    // For charts (no URL), remove without URL matching
    if (image?.chartType && !image?.url) {
      removeRootImage();
    } else {
      const urls = [image?.url, computedImageUrl].filter((u): u is string =>
        Boolean(u),
      );
      removeRootImage(urls);
    }
  }, [computedImageUrl, image?.url, image?.chartType, removeRootImage]);

  const updateRootImageSize = useCallback(
    (newSize: { w?: string; h?: number }) => {
      const { slides } = usePresentationState.getState();
      const updatedSlides = slides.map((slide: PlateSlide) => {
        if (slide.id === slideId) {
          return {
            ...slide,
            rootImage: {
              ...slide.rootImage!,
              size: {
                ...slide.rootImage?.size,
                ...newSize,
              },
            },
          };
        }
        return slide;
      });
      setSlides(updatedSlides);
      void saveImmediately();
    },
    [setSlides, slideId],
  );

  const onResize = useCallback<ResizeCallback>(
    (_e, _direction, ref, d) => {
      if (layoutType !== "vertical") return;

      const nextHeight = (size?.h ?? BASE_HEIGHT) + d.height;
      const constrainedHeight = constrainRootImageHeight(
        nextHeight,
        getMaxAllowedRootImageHeight(ref, maxHeightPx),
      );

      ref.style.height = `${constrainedHeight}px`;
    },
    [layoutType, maxHeightPx, size?.h],
  );

  // Resizable handler logic moved here
  const onResizeStop = useCallback<ResizeCallback>(
    (_e, _direction, ref, d) => {
      if (layoutType === "vertical") {
        const nextHeight = (size?.h ?? BASE_HEIGHT) + d.height;
        const constrainedHeight = constrainRootImageHeight(
          nextHeight,
          getMaxAllowedRootImageHeight(ref, maxHeightPx),
        );
        updateRootImageSize({ h: constrainedHeight });
      } else {
        const parentElementRect = ref.parentElement!.getBoundingClientRect();
        const parentWidth = parentElementRect.width;
        const width = parseFloat(size?.w ?? BASE_WIDTH_PERCENTAGE);
        const originalWidth = parentWidth * (width / 100);
        const changeInWidth = d.width;
        const newWidth = originalWidth + changeInWidth;
        const newWidthPercentage = (newWidth / parentWidth) * 100;
        // Enforce min/max width percentage constraints
        const constrainedWidthPercentage = Math.max(
          MIN_WIDTH_PERCENTAGE,
          Math.min(MAX_WIDTH_PERCENTAGE, newWidthPercentage),
        );
        const nextWidth = `${constrainedWidthPercentage}%`;
        updateRootImageSize({ w: nextWidth });
      }
    },
    [layoutType, maxHeightPx, size?.h, size?.w, updateRootImageSize],
  );

  // Drag-and-drop logic moved here
  const id = useId();
  const dragElement = useMemo(() => {
    // If it's a chart, create a chart drag element
    if (image?.chartType && image?.chartData) {
      return {
        id: id,
        type: image.chartType,
        data: image.chartData,
        variant: image.chartOptions?.variant,
        children: [{ text: "" }],
      };
    }
    // Otherwise, create an image drag element
    return {
      id: id,
      type: ImagePlugin.key,
      url: computedImageUrl,
      query: image?.query,
      cropSettings: cropSettings,
      children: [{ text: "" }],
    };
  }, [
    computedImageUrl,
    cropSettings,
    id,
    image?.query,
    image?.chartType,
    image?.chartData,
    image?.chartOptions?.variant,
  ]);

  const onDragEnd = useCallback(
    (_item: DragItemNode, monitor: DragSourceMonitor) => {
      const dropResult: { droppedInLayoutZone: boolean } =
        monitor.getDropResult()!;
      if (monitor.didDrop() && !dropResult?.droppedInLayoutZone) {
        // Remove the entire root image (including layout) when dragging to editor
        removeRootImageFromSlide();
      }
      editor.setOption(DndPlugin, "isDragging", false);
    },
    [editor, removeRootImageFromSlide],
  );

  const { isDragging, handleRef } = useDraggable({
    element: dragElement,
    drag: { end: onDragEnd },
  });

  return {
    // Derived data
    computedGen: matchingComputedGen,
    computedImageUrl,
    cropSettings,
    imageStyles,
    sizeStyle,
    isDragging,
    handleRef,

    // Actions
    startRootImageGeneration,
    updateCropSettings,
    replaceImageUrl,
    removeRootImage,
    removeRootImageFromSlide,
    updateRootImageSize,
    onResize,
    onResizeStop,
    dragId: id,
  };
}
