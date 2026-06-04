import { useEffect, useMemo, useRef, useState } from "react";

import PresentationEditorStaticView from "@/components/notebook/presentation/editor/presentation-editor-static";
import { parseSlideXml } from "@/components/notebook/presentation/utils/parser";
import { baseWidths } from "@/hooks/presentation/scaling";
import { cn } from "@/lib/utils";

function getStablePreviewId(input: string, index: number): string {
  let hash = 0;

  for (let position = 0; position < input.length; position += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(position);
    hash |= 0;
  }

  return `preview-${index}-${Math.abs(hash).toString(36)}`;
}

export default function EditingSlide({ slides = [] }: { slides: string[] }) {
  return (
    <div
      className={cn(
        "scrollbar-thumb-rounded-full scrollbar-thin flex max-w-80 flex-col gap-2 overflow-y-auto scrollbar-thumb-muted-foreground scrollbar-track-transparent",
        slides?.length > 1 ? "h-80" : "h-55",
      )}
    >
      <h3 className="text-lg font-bold">
        Editing {slides?.length > 1 ? "slides" : "slide"}
      </h3>
      <div className="flex h-max w-full flex-col gap-2">
        {slides?.map((slideString, index) => (
          <MemoizedEditingSlide
            key={getStablePreviewId(slideString, index)}
            slideString={slideString}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

export function MemoizedEditingSlide({
  slideString,
  index,
}: {
  slideString: string;
  index: number;
}) {
  const previewId = useMemo(
    () => getStablePreviewId(slideString, index),
    [index, slideString],
  );
  const slide = useMemo(() => {
    const parsed = parseSlideXml(slideString);
    return parsed[0];
  }, [slideString]);

  // Static, one-time scaling to fit available width
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    // Compute scale once based on current container width and a fixed base width
    const baseWidth = baseWidths.M;
    const containerWidth = container.clientWidth || baseWidth;
    const staticScale = Math.max(0.1, containerWidth / baseWidth);
    setScale(staticScale);

    // Measure unscaled height once and set the container's layout height
    const unscaledHeight = content.offsetHeight || 0;
    setHeight(
      Math.max(0, Math.ceil(unscaledHeight * staticScale)) || undefined,
    );
  }, []);

  return (
    <div className="group relative overflow-hidden rounded-md border border-muted bg-card">
      <div className="absolute top-1 left-2 z-10 rounded-sm bg-muted px-1 py-0.5 text-xs font-medium text-muted-foreground">
        {index + 1}
      </div>
      <div
        ref={containerRef}
        className="pointer-events-none w-full overflow-hidden"
        style={{
          height: height ?? undefined,
          aspectRatio: height === undefined ? "16/9" : undefined,
        }}
      >
        <div
          ref={contentRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: baseWidths.M,
          }}
        >
          <PresentationEditorStaticView
            initialContent={slide}
            className="min-h-55 w-full border"
            id={previewId}
          />
        </div>
      </div>
    </div>
  );
}
