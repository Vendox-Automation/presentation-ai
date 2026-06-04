"use client";

import { type TElement } from "platejs";
import { useEditorRef } from "platejs/react";
import React from "react";

import { type RootImage as RootImageType } from "@/components/notebook/presentation/utils/parser";
import { SharedImageSearchControls } from "@/components/presentation/shared/SharedImageSearchControls";
import { useDebouncedSave } from "@/hooks/presentation/useDebouncedSave";
import {
  usePresentationState,
  type PresentationStockImageProvider,
} from "@/states/presentation-state";

interface ImageSearchControlsProps {
  element: TElement & RootImageType;
  slideId?: string;
  isRootImage: boolean;
  onPick?: () => void;
  initialQuery?: string;
  initialQueryKey?: string;
}

export function ImageSearchControls({
  element,
  slideId,
  isRootImage,
  onPick,
  initialQuery,
  initialQueryKey,
}: ImageSearchControlsProps) {
  const editor = useEditorRef(slideId);
  const setSlides = usePresentationState((s) => s.setSlides);
  const { saveImmediately } = useDebouncedSave();

  const handleSelect = React.useCallback(
    (url: string, provider: PresentationStockImageProvider) => {
      const { clearRootImageGeneration } = usePresentationState.getState();
      if (isRootImage) {
        if (slideId) clearRootImageGeneration(slideId);
        setSlides((slides) =>
          slides.map((slide) =>
            slide.id === slideId
              ? {
                  ...slide,
                  rootImage: {
                    ...slide.rootImage!,
                    url: url,
                    imageSource: "search",
                    stockImageProvider: provider,
                  },
                }
              : slide,
          ),
        );
        void saveImmediately();
      } else {
        editor.tf.setNodes({
          ...element,
          url: url,
          imageSource: "search",
          stockImageProvider: provider,
        });
        void saveImmediately();
      }
      onPick?.();
    },
    [isRootImage, setSlides, slideId, editor, element, onPick, saveImmediately],
  );

  return (
    <SharedImageSearchControls
      onImageSelect={handleSelect}
      initialQuery={initialQuery}
      initialQueryKey={initialQueryKey ?? slideId}
      disableTrendingFallback={true}
      className="h-full"
    />
  );
}
