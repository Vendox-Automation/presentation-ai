"use client";

import { closestCenter, DndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Presentation } from "lucide-react";

import { calculateHeightFromRatio } from "@/config/slideFormats";
import { usePresentationNavigation } from "@/hooks/presentation/usePresentationNavigation";
import { usePresentationSlides } from "@/hooks/presentation/usePresentationSlides";
import { usePresentingLoadingGate } from "@/hooks/presentation/usePresentingLoadingGate";
import { usePresentModeOrientation } from "@/hooks/presentation/usePresentModeOrientation";
import { useSlideChangeWatcher } from "@/hooks/presentation/useSlideChangeWatcher";
import { useSlideContentScaling } from "@/hooks/presentation/useSlideContentScaling";
import { useSlideOperations } from "@/hooks/presentation/useSlideOperations";
import { usePresentationState } from "@/states/presentation-state";
import { Button } from "../../ui/button";
import { Skeleton } from "../../ui/skeleton";
import { PresentModeHeader } from "../present-mode/PresentModeHeader";
import { PresentModePhoneOverlay } from "../present-mode/PresentModePhoneOverlay";
import { PresentModeProgressBar } from "../present-mode/PresentModeProgressBar";
import { PresentationThumbnailCaptureManager } from "./PresentationThumbnailCaptureManager";
import { SlideItem } from "./SlideItem";

interface SlidesContainerProps {
  isGeneratingPresentation: boolean;
  isReadOnly?: boolean;
}

export const SlidesContainer = ({
  isGeneratingPresentation,
  isReadOnly = false,
}: SlidesContainerProps) => {
  const isPresenting = usePresentationState((s) => s.isPresenting);
  const isPresentingLoading = usePresentationState(
    (s) => s.isPresentingLoading,
  );
  const zoomLevel = usePresentationState((s) => s.zoomLevel);
  const presentingScaleLocks = usePresentationState(
    (s) => s.presentingScaleLocks,
  );
  const setIsPresentingLoading = usePresentationState(
    (s) => s.setIsPresentingLoading,
  );
  const currentPresentationTitle = usePresentationState(
    (s) => s.currentPresentationTitle,
  );
  const shouldShowExitHeader = usePresentationState(
    (s) => s.shouldShowExitHeader,
  );

  // Use slideIds for rendering to prevent re-renders when slide content changes
  const { slideIds, items, sensors, handleDragStart, handleDragEnd } =
    usePresentationSlides();
  const { addFirstSlide } = useSlideOperations();

  // Use the slide change watcher to automatically save changes (disabled during generation)
  useSlideChangeWatcher({
    debounceDelay: 600,
    enabled: !isGeneratingPresentation && !isReadOnly,
  });

  // Handle presentation navigation (keyboard and mouse)
  usePresentationNavigation();
  const { isPhoneViewport } = usePresentModeOrientation(isPresenting);

  const slidesCount = slideIds.length;
  const generatingPlaceholderScaling = useSlideContentScaling(
    "M",
    false,
    "presentation",
    { type: "ratio", value: "16:9" },
    undefined,
    zoomLevel,
  );
  const generatingPlaceholderWidth = Math.round(
    generatingPlaceholderScaling.slideWidth *
      Math.max(generatingPlaceholderScaling.scale, 0.1),
  );
  const generatingPlaceholderHeight = Math.round(
    (calculateHeightFromRatio(generatingPlaceholderScaling.slideWidth, {
      type: "ratio",
      value: "16:9",
    }).minHeightPx ?? 0) * Math.max(generatingPlaceholderScaling.scale, 0.1),
  );

  usePresentingLoadingGate({
    isPresenting,
    isPresentingLoading,
    slideIds,
    presentingScaleLocks,
    setIsPresentingLoading,
    clearDelayMs: 150,
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {!isReadOnly && <PresentationThumbnailCaptureManager />}
        <PresentModeHeader
          presentationTitle={currentPresentationTitle}
          showHeader={isPresenting && shouldShowExitHeader}
        />
        {isGeneratingPresentation && slidesCount === 0 && (
          <div className="flex w-full justify-center">
            <div
              className="relative max-w-full"
              style={{
                width: `${generatingPlaceholderWidth}px`,
                height: `${generatingPlaceholderHeight}px`,
              }}
            >
              <Skeleton className="h-full w-full rounded-md" />
            </div>
          </div>
        )}
        {!isGeneratingPresentation &&
          !isPresenting &&
          slidesCount === 0 &&
          !isReadOnly && (
            <div className="mx-auto w-full max-w-5xl">
              <div className="relative flex aspect-video w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-background/85 p-8 text-center shadow">
                <div className="absolute inset-5 rounded-xl border border-dashed border-border/50" />
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <span className="rounded-full border border-border/70 bg-muted/70 p-3">
                    <Presentation className="size-6 text-muted-foreground" />
                  </span>
                  <div className="space-y-1">
                    <p className="text-base font-semibold">
                      No slides yet
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Start this presentation by adding your first slide.
                    </p>
                  </div>
                  <Button
                    onClick={() => addFirstSlide()}
                    className="gap-2"
                    size="sm"
                  >
                    <Plus className="size-4" />
                    Add first slide
                  </Button>
                </div>
              </div>
            </div>
          )}
        {slideIds.map((slideId) => (
          <SlideItem
            key={slideId}
            slideId={slideId}
            isGeneratingPresentation={isGeneratingPresentation}
            slidesCount={slidesCount}
            isReadOnly={isReadOnly}
          />
        ))}

        {isPresenting && (
          <PresentModePhoneOverlay
            slideIds={slideIds}
            isPhoneViewport={isPhoneViewport}
          />
        )}
        {isPresenting && <PresentModeProgressBar slideIds={slideIds} />}
      </SortableContext>
    </DndContext>
  );
};
