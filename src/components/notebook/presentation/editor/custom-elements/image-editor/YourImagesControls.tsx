"use client";

import { type TElement } from "platejs";
import { useEditorRef } from "platejs/react";

import { useDebouncedSave } from "@/hooks/presentation/useDebouncedSave";
import { usePresentationState } from "@/states/presentation-state";
import { type RootImage as RootImageType } from "../../../utils/parser";
import { UploadedImagesGrid } from "./UploadedImagesGrid";

interface YourImagesControlsProps {
  element: TElement & RootImageType;
  slideId?: string;
  isRootImage: boolean;
  onPick?: () => void;
}

export function YourImagesControls({
  element,
  slideId,
  isRootImage,
  onPick,
}: YourImagesControlsProps) {
  const editor = useEditorRef(slideId);
  const { saveImmediately } = useDebouncedSave();

  const handleImageSelect = (url: string, name: string) => {
    const { setSlides, clearRootImageGeneration } =
      usePresentationState.getState();
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
                  query: name,
                  embedType: undefined,
                  imageSource: "upload",
                  chartType: undefined,
                  chartData: undefined,
                },
              }
            : slide,
        ),
      );
      void saveImmediately();
    } else {
      editor.tf.setNodes(
        { url: url, query: name, embedType: undefined, imageSource: "upload" },
        { at: editor.api.findPath(element) },
      );
      void saveImmediately();
    }
    onPick?.();
  };

  return (
    <div className="flex h-full flex-col gap-y-4">
      <UploadedImagesGrid
        onImageSelect={(image) => handleImageSelect(image.url, image.name)}
      />
    </div>
  );
}
