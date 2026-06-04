import { useEffect, useRef, useState } from "react";

import StaticPresentationEditor from "@/components/notebook/presentation/editor/presentation-editor-static";
import { type PlateSlide } from "@/components/notebook/presentation/utils/parser";
import { usePresentationState } from "@/states/presentation-state";
import { SlideThumbnail } from "../sidebar/SlideThumbnail";

export default function Compare({
  left,
  right,
  shouldReplaceTheSlides = false,
}: {
  left: PlateSlide[];
  right: PlateSlide[];
  shouldReplaceTheSlides?: boolean;
}) {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (scrollStopTimerRef.current) {
        clearTimeout(scrollStopTimerRef.current);
      }
    };
  }, []);

  const handleScroll: React.UIEventHandler<HTMLDivElement> = () => {
    if (!isScrolling) setIsScrolling(true);
    if (scrollStopTimerRef.current) clearTimeout(scrollStopTimerRef.current);
    scrollStopTimerRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  };

  return (
    <div
      className="scrollbar-thumb-rounded-full relative scrollbar-thin h-full max-h-55 w-full max-w-95 overflow-x-clip overflow-y-auto p-2 scrollbar-thumb-muted-foreground scrollbar-track-transparent"
      onScroll={handleScroll}
    >
      <div
        className={`pointer-events-none absolute inset-0 z-10 bg-linear-to-b from-transparent to-background transition-opacity duration-150 ${isScrolling ? "opacity-0" : "opacity-100"}`}
      />

      <div className="flex h-max gap-2">
        <button
          type="button"
          className="group w-1/2 cursor-pointer"
          onClick={() => {
            const { slides, setSlides } = usePresentationState.getState();
            if (shouldReplaceTheSlides) {
              setSlides(left);
              return;
            }
            const updatedSlides = slides.map((slide) => {
              const leftSlide = left.find((s) => s.id === slide.id);
              if (leftSlide) {
                console.log("leftSlide", leftSlide);
                return leftSlide;
              }
              return slide;
            });
            setSlides(updatedSlides);
          }}
        >
          <h3 className="text-lg font-bold">Original</h3>

          <div className="pointer-events-none shrink space-y-2 rounded-md group-hover:outline group-hover:outline-primary">
            {left.map((slide, index) => (
              <SlideThumbnail
                key={slide.id}
                index={index}
                isActive={false}
                onClick={() => {}}
              >
                <StaticPresentationEditor
                  initialContent={slide}
                  className="min-h-75 border"
                  id={`preview-${slide.id}`}
                />
              </SlideThumbnail>
            ))}
          </div>
        </button>
        <button
          type="button"
          className="group w-1/2 cursor-pointer"
          onClick={() => {
            const { slides, setSlides } = usePresentationState.getState();
            if (shouldReplaceTheSlides) {
              setSlides(right);
              return;
            }
            const updatedSlides = slides.map((slide) => {
              const rightSlide = right.find((s) => s.id === slide.id);
              if (rightSlide) {
                return rightSlide;
              }
              return slide;
            });
            setSlides(updatedSlides);
          }}
        >
          <h3 className="text-lg font-bold">Modified</h3>
          <div className="shrink space-y-2 rounded-md group-hover:outline group-hover:outline-primary">
            {right.map((slide, index) => (
              <SlideThumbnail
                key={slide.id}
                index={index}
                isActive={false}
                onClick={() => {}}
              >
                <StaticPresentationEditor
                  initialContent={slide}
                  className="min-h-75 border"
                  id={`preview-${slide.id}`}
                />
              </SlideThumbnail>
            ))}
          </div>
        </button>
      </div>
    </div>
  );
}
