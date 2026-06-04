"use client";

import { createStaticEditor as createSlateEditor } from "platejs/static";
import { useEffect, useMemo } from "react";

import { cn } from "@/lib/utils";
import { normalizePresentationValue } from "../../utils/normalizePresentationSlate";
import { type PlateSlide } from "../../utils/parser";
import { EditorStatic } from "../custom-elements/static/editor-static";
import RootImageStatic from "../custom-elements/static/root-image-static";
import { PresentationEditorBaseKit } from "../plugins/presentation-editor-base-kit";
import { PresentationStaticCustomKit } from "../plugins/static-custom-kit";
import { getAlignmentClass } from "../utils/alignment-utils";

interface StaticPlateProps {
  initialContent?: PlateSlide;
  className?: string;
  id?: string;
}

export function StaticPlate({
  initialContent,
  className,
  id,
}: StaticPlateProps) {
  const slideId = initialContent?.id ?? id;
  const normalizedContent = useMemo(
    () => normalizePresentationValue(initialContent?.content),
    [initialContent?.content],
  );

  const editor = useMemo(
    () =>
      createSlateEditor({
        plugins: [...PresentationEditorBaseKit, ...PresentationStaticCustomKit],
        value: normalizedContent,
        id: slideId,
      }),
    [normalizedContent, slideId],
  );

  useEffect(() => {
    editor.tf.setValue(normalizedContent);
  }, [editor, normalizedContent]);

  return (
    <>
      <EditorStatic
        className={cn(
          className,
          "@container/presentation-slide-content flex flex-1 flex-col overflow-clip border-none bg-transparent! px-8 py-8 outline-hidden",
          getAlignmentClass(initialContent?.alignment),
        )}
        id={id}
        editor={editor}
        value={normalizedContent}
      />

      {initialContent?.rootImage &&
        initialContent.layoutType !== undefined &&
        initialContent.layoutType !== "background" &&
        initialContent.layoutType !== "none" && (
          <RootImageStatic
            image={initialContent.rootImage}
            layoutType={initialContent.layoutType}
            slideId={initialContent.id}
          />
        )}
    </>
  );
}
