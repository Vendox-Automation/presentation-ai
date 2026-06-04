"use client";

import StaticPresentationEditor from "@/components/notebook/presentation/editor/presentation-editor-static";
import { type PlateSlide } from "@/components/notebook/presentation/utils/parser";
import { useSlideContentScaling } from "@/hooks/presentation/useSlideContentScaling";
import { DEFAULT_PRESENTATION_SLIDE_ASPECT_RATIO } from "@/lib/presentation/aspect-ratio";

interface SlidePreviewProps {
  slide: PlateSlide;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function SlidePreview({ slide, containerRef }: SlidePreviewProps) {
  const formatCategory = slide.formatCategory ?? "presentation";
  const aspectRatio =
    slide.aspectRatio ?? DEFAULT_PRESENTATION_SLIDE_ASPECT_RATIO;
  const slideWidth = slide.width ?? "M";

  const scalingConfig = useSlideContentScaling(
    slideWidth as "S" | "M" | "L",
    false, // not presenting
    formatCategory,
    aspectRatio,
    containerRef,
  );

  const { contentRef, scaledHeight } = scalingConfig;
  const scaledWidth = Math.round(
    scalingConfig.slideWidth * Math.max(scalingConfig.scale, 0.1),
  );

  return (
    <div className="flex w-full justify-center pb-6">
      <div
        style={{
          height: scaledHeight ? `${scaledHeight}px` : undefined,
          width: `${scaledWidth}px`,
        }}
        className="relative max-w-full"
      >
        <div
          ref={contentRef}
          className="relative origin-[top_left]"
          style={{
            width: `${scalingConfig.slideWidth}px`,
            transform: `scale(${scalingConfig.scale})`,
            fontSize: "16px",
          }}
        >
          <div className="relative">
            <StaticPresentationEditor
              initialContent={slide}
              className="rounded-md"
              id={slide.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
