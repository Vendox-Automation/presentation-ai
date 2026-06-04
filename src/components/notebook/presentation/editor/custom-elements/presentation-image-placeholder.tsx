"use client";

import { ImageIcon, Loader2, Search, Sparkles, Upload } from "lucide-react";
import { type TImageElement } from "platejs";
import { useEditorReadOnly, useEditorRef } from "platejs/react";
import type React from "react";
import { useRef } from "react";
import { toast } from "sonner";

import { useUploadFile } from "@/components/plate/hooks/use-upload-file";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import {
  usePresentationState,
  type ImageEditorMode,
} from "@/states/presentation-state";

export interface PresentationImagePlaceholderProps {
  className?: string;
  element: TImageElement & { query?: string; id?: string };
  imageNotFound?: boolean;
  onOpenEditor?: (mode: ImageEditorMode) => void;
}

export function PresentationImagePlaceholder({
  className,
  element,
  imageNotFound = false,
  onOpenEditor,
}: PresentationImagePlaceholderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editor = useEditorRef();
  const readOnly = useEditorReadOnly();
  const openPresentationImageEditor = usePresentationState(
    (s) => s.openPresentationImageEditor,
  );

  const { uploadFile, isUploading, progress } = useUploadFile({
    onUploadComplete: (file) => {
      // Update the element's URL in the editor
      editor.tf.setNodes(
        {
          url: file.ufsUrl,
        } as Partial<TImageElement>,
        { at: [], match: (n) => n === element },
      );
    },
    onUploadError: (error) => {
      toast.error("Failed to upload image");
      console.error(error);
    },
  });
  const uploadProgress = Math.trunc(progress);

  const handleUploadClick = () => {
    if (!readOnly && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && !readOnly) {
      void uploadFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleOpenEditor = (mode: ImageEditorMode) => {
    if (readOnly) return;
    if (onOpenEditor) {
      onOpenEditor(mode);
    } else if (element.id) {
      // Create a bound updateElement function that captures the current editor and element
      const boundUpdateElement = (props: Record<string, unknown>) => {
        editor.tf.setNodes(props as Partial<TImageElement>, {
          at: [],
          match: (n) => n.id === element.id,
        });
      };
      // Open the presentation image editor panel with the element ID, slide ID, and bound function
      openPresentationImageEditor(mode, boundUpdateElement, element);
    }
  };

  if (readOnly) {
    return (
      <div
        className={cn(
          "flex w-full items-center justify-center bg-muted/30 p-8",
          className,
        )}
      >
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <ImageIcon className="size-8" />
          <span className="text-sm">No image</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex size-full items-center justify-center rounded-[inherit] border bg-background",
        className,
      )}
    >
      <Empty className="w-full bg-card">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ImageIcon />
          </EmptyMedia>
          <EmptyTitle className="text-primary">
            {imageNotFound ? "Image not found" : "No image yet"}
          </EmptyTitle>
          <EmptyDescription>
            {imageNotFound
              ? "Try uploading, generating, or searching for another image"
              : "Upload or generate an image"}
          </EmptyDescription>
        </EmptyHeader>

        <EmptyContent className="flex-row gap-3 text-primary">
          <Button
            variant="outline"
            onClick={handleUploadClick}
            className="gap-2"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Upload
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => handleOpenEditor("generate")}
            className="gap-2"
          >
            <Sparkles className="size-4" />
            AI Image
          </Button>

          <Button
            variant="outline"
            onClick={() => handleOpenEditor("search")}
            className="gap-2"
          >
            <Search className="size-4" />
            Search
          </Button>
        </EmptyContent>
      </Empty>

      {/* Hidden file input */}
      <input
        aria-label="presentation image placeholder control"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
