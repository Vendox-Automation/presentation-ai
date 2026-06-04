"use client";

import { type Value } from "platejs";
import { Plate, type PlateEditor } from "platejs/react";
import { useCallback, useMemo, useRef, type CSSProperties } from "react";

import { Editor } from "@/components/plate/ui/editor";
import ImageGenerationModel from "@/components/plate/ui/image-generation-model";
import { cn } from "@/lib/utils";
import { type PlateSlide } from "../../utils/parser";
import RootImage from "../custom-elements/root-image";
import LayoutImageDrop from "../dnd/components/LayoutImageDrop";
import { useEditorSurfaceDrop } from "../dnd/hooks/useEditorSurfaceDrop";
import { usePresentModeEditorScale } from "../hooks/usePresentModeEditorScale";
import { useRootImageHeight } from "../hooks/useRootImageHeight";
import { getAlignmentClass, getAlignmentStyle } from "../utils/alignment-utils";

interface EditablePlateProps {
  editor: PlateEditor;
  className?: string;
  id?: string;
  readOnly: boolean;
  isPreview: boolean;
  isGenerating: boolean;
  isPresenting: boolean;
  initialContent?: PlateSlide;
  onFocusSlide: (slideId: string) => void;
  onDebouncedChange: (value: Value) => void;
}

export function EditablePlate({
  editor,
  className,
  id,
  readOnly,
  isPreview,
  isGenerating,
  isPresenting,
  initialContent,
  onFocusSlide,
  onDebouncedChange,
}: EditablePlateProps) {
  const isReadOnlyMode = readOnly || isPresenting;
  const editorRegionRef = useRef<HTMLDivElement | null>(null);
  const { isEditorSurfaceDropActive, setEditorSurfaceDropRef } =
    useEditorSurfaceDrop({
      disabled: isReadOnlyMode || isPreview || isGenerating,
      editor,
    });
  // Use extracted hook for root image height calculations
  const {
    editorRef,
    shouldCapRootImage,
    maxRootImageHeight,
    presentingRootImageHeight,
    presentingMaxRootImageHeight,
  } = useRootImageHeight({
    isPresenting,
    initialContent,
  });

  // Use extracted utility for alignment style
  const alignmentStyle = useMemo(
    () =>
      getAlignmentStyle(
        isPresenting,
        initialContent?.alignment,
        initialContent?.layoutType,
      ),
    [isPresenting, initialContent?.alignment, initialContent?.layoutType],
  );
  const shouldUsePresentModeEditorScale =
    isPresenting &&
    (initialContent?.formatCategory ?? "presentation") !== "social";
  const presentModeEditorScale = usePresentModeEditorScale({
    isPresenting: shouldUsePresentModeEditorScale,
    initialContent,
    editorRef,
    regionRef: editorRegionRef,
  });

  const setEditorRegionRefs = useCallback(
    (node: HTMLDivElement | null) => {
      editorRegionRef.current = node;
      setEditorSurfaceDropRef(node);
    },
    [setEditorSurfaceDropRef],
  );

  const presentModeStageStyle: CSSProperties | undefined =
    shouldUsePresentModeEditorScale
      ? {
          height: presentModeEditorScale.shouldScroll
            ? `${presentModeEditorScale.scaledContentHeight}px`
            : "100%",
          minHeight: presentModeEditorScale.shouldScroll ? undefined : "100%",
          position: "relative",
          width: "100%",
        }
      : undefined;

  const presentModeEditorStyle: CSSProperties | undefined =
    shouldUsePresentModeEditorScale
      ? {
          left: `${presentModeEditorScale.leftOffset}px`,
          position: "absolute",
          top: `${presentModeEditorScale.topOffset}px`,
          transform: `scale(${presentModeEditorScale.contentScale})`,
          transformOrigin: "top left",
          width: presentModeEditorScale.logicalWidth
            ? `${presentModeEditorScale.logicalWidth}px`
            : "100%",
        }
      : undefined;

  return (
    <Plate
      editor={editor}
      onValueChange={({ value }) => {
        if (isReadOnlyMode || isGenerating) return;
        onDebouncedChange(value);
      }}
      readOnly={isGenerating || isReadOnlyMode}
    >
      {!isReadOnlyMode && <LayoutImageDrop slideId={initialContent?.id ?? ""} />}
      <div
        ref={setEditorRegionRefs}
        data-presentation-editor-region="true"
        className={cn(
          "flex flex-1 flex-col transition-shadow",
          shouldUsePresentModeEditorScale ? "min-h-0" : "min-h-max",
          shouldUsePresentModeEditorScale &&
            (presentModeEditorScale.shouldScroll
              ? "overflow-visible"
              : "overflow-clip"),
          isEditorSurfaceDropActive && "ring-2 ring-primary/60 ring-inset",
        )}
      >
        <div
          className={cn(
            !shouldUsePresentModeEditorScale &&
              "flex min-h-max flex-1 flex-col",
          )}
          style={presentModeStageStyle}
        >
          <Editor
            ref={editorRef}
            className={cn(
              className,
              "@container/presentation-slide-content flex flex-1 flex-col overflow-clip border-none bg-transparent! py-8 outline-hidden",
              isReadOnlyMode && "px-4 md:px-8",
              isPresenting && shouldCapRootImage && "self-start",
              getAlignmentClass(initialContent?.alignment),
            )}
            id={id}
            variant="ghost"
            readOnly={isPreview || isGenerating || isReadOnlyMode}
            style={{
              ...alignmentStyle,
              ...presentModeEditorStyle,
            }}
            onFocus={() =>
              initialContent?.id && onFocusSlide(initialContent.id)
            }
          />
        </div>
      </div>

      {initialContent?.rootImage &&
        initialContent.layoutType !== undefined &&
        initialContent.layoutType !== "background" &&
        initialContent.layoutType !== "none" && (
          <RootImage
            image={initialContent.rootImage}
            layoutType={initialContent.layoutType}
            slideId={initialContent.id}
            maxHeightPx={
              shouldCapRootImage
                ? maxRootImageHeight
                : presentingMaxRootImageHeight
            }
            heightPx={presentingRootImageHeight}
          />
        )}
      {!isReadOnlyMode && <ImageGenerationModel />}
    </Plate>
  );
}
