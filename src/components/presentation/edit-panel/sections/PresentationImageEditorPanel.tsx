"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  Clapperboard,
  ImageIcon,
  Images,
  Loader2,
  Scissors,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { CropModal } from "@/components/notebook/presentation/editor/custom-elements/image-editor/CropModal";
import { GeneratedImagesGrid } from "@/components/notebook/presentation/editor/custom-elements/image-editor/GeneratedImagesGrid";
import { UploadedImagesGrid } from "@/components/notebook/presentation/editor/custom-elements/image-editor/UploadedImagesGrid";
import { getPresentationImageCropStyles } from "@/components/notebook/presentation/editor/custom-elements/presentation-image-layout";
import { PALETTE_DROP_MUTABLE_KEY } from "@/components/notebook/presentation/editor/utils/paletteDrop";
import { type ImageCropSettings } from "@/components/notebook/presentation/utils/types";
import { useUploadFile } from "@/components/plate/hooks/use-upload-file";
import { SharedGenerateControls } from "@/components/presentation/shared/SharedGenerateControls";
import { SharedGifSearchControls } from "@/components/presentation/shared/SharedGifSearchControls";
import { SharedImageSearchControls } from "@/components/presentation/shared/SharedImageSearchControls";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { getPresentationTitleSearchQuery } from "@/lib/presentation/title-search-query";
import {
  usePresentationState,
  type ImageEditorMode,
  type PresentationStockImageProvider,
} from "@/states/presentation-state";

// Define tab options with icons (excluding embed since this is for presentation images)
const TAB_OPTIONS: {
  value: ImageEditorMode;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "generate",
    label: "AI Generate",
    icon: <ImageIcon className="size-4" />,
  },
  {
    value: "your-images",
    label: "Uploaded Images",
    icon: <Images className="size-4" />,
  },
  {
    value: "generated-images",
    label: "Generated Images",
    icon: <Sparkles className="size-4" />,
  },
  { value: "search", label: "Search", icon: <Search className="size-4" /> },
  { value: "gif", label: "GIFs", icon: <Clapperboard className="size-4" /> },
];

export function PresentationImageEditorPanel() {
  const presentationImageEditorInitialMode = usePresentationState(
    (s) => s.presentationImageEditorInitialMode,
  );
  const closePresentationImageEditor = usePresentationState(
    (s) => s.closePresentationImageEditor,
  );
  const boundUpdateElement = usePresentationState((s) => s.boundUpdateElement);
  const presentationImageEditorElement = usePresentationState(
    (s) => s.presentationImageEditorElement,
  );
  const presentationImageEditorFrame = usePresentationState(
    (s) => s.presentationImageEditorFrame,
  );
  const currentPresentationTitle = usePresentationState(
    (s) => s.currentPresentationTitle,
  );
  const setPaletteDropTarget = usePresentationState(
    (s) => s.setPaletteDropTarget,
  );
  const initialMode = presentationImageEditorInitialMode ?? "generate";
  const initialSearchQuery = getPresentationTitleSearchQuery(
    currentPresentationTitle,
  );

  const [modeState, setModeState] = useState<{
    mode: ImageEditorMode;
    sourceMode: ImageEditorMode;
  }>(() => ({ mode: initialMode, sourceMode: initialMode }));
  const currentMode =
    modeState.sourceMode === initialMode ? modeState.mode : initialMode;
  const editorElementKey = getImageEditorElementKey(
    presentationImageEditorElement,
  );
  const [currentElementState, setCurrentElementState] = useState<{
    element: Record<string, unknown> | null;
    key: string;
  }>(() => ({
    element: presentationImageEditorElement,
    key: editorElementKey,
  }));
  const currentElement =
    currentElementState.key === editorElementKey
      ? currentElementState.element
      : presentationImageEditorElement;
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const currentImageUrl =
    typeof currentElement?.url === "string" ? currentElement.url : undefined;
  const currentImageQuery =
    typeof currentElement?.query === "string"
      ? currentElement.query
      : typeof currentElement?.prompt === "string"
        ? currentElement.prompt
        : "";
  const currentCropSettings = getImageCropSettings(
    currentElement?.cropSettings,
  );
  const previewFrame = getImagePreviewFrame(presentationImageEditorFrame);

  // Upload file hook
  const { uploadFile, isUploading, progress } = useUploadFile({
    onUploadComplete: (file) => {
      if (!file.ufsUrl) {
        toast.error("Uploaded image URL was not returned");
        return;
      }

      if (boundUpdateElement) {
        setPaletteDropTarget(null);
        boundUpdateElement({
          url: file.ufsUrl,
          query: "",
          imageSource: "upload",
          [PALETTE_DROP_MUTABLE_KEY]: false,
        });
        setCurrentElementState(({ element }) => ({
          key: editorElementKey,
          element: {
            ...(element ?? {}),
            url: file.ufsUrl,
            query: "",
            prompt: "",
            imageSource: "upload",
          },
        }));
      }
      void queryClient.invalidateQueries({
        queryKey: ["presentation-uploaded-images"],
      });
    },
    onUploadError: (error) => {
      toast.error("Failed to upload image");
      console.error(error);
    },
  });

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void uploadFile(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageSelect = (
    url: string,
    prompt?: string,
    imageSource?: "generate" | "search" | "gif" | "upload",
    stockImageProvider?: PresentationStockImageProvider,
  ) => {
    if (boundUpdateElement) {
      setPaletteDropTarget(null);
      boundUpdateElement({
        url,
        query: prompt ?? "",
        imageSource,
        ...(stockImageProvider ? { stockImageProvider } : {}),
        [PALETTE_DROP_MUTABLE_KEY]: false,
      });
      setCurrentElementState(({ element }) => ({
        key: editorElementKey,
        element: {
          ...(element ?? {}),
          url,
          query: prompt ?? "",
          prompt: prompt ?? "",
          imageSource,
          ...(stockImageProvider ? { stockImageProvider } : {}),
        },
      }));
    }
  };

  const handleCropSave = (settings: ImageCropSettings) => {
    if (!boundUpdateElement) return;

    setPaletteDropTarget(null);
    boundUpdateElement({
      cropSettings: settings,
      [PALETTE_DROP_MUTABLE_KEY]: false,
    });
    setCurrentElementState(({ element }) => ({
      key: editorElementKey,
      element: {
        ...(element ?? {}),
        cropSettings: settings,
      },
    }));
    setIsCropModalOpen(false);
  };

  const handleModeChange = (value: string) => {
    setModeState({ mode: value as ImageEditorMode, sourceMode: initialMode });
  };

  // Get current tab info
  const currentTab = TAB_OPTIONS.find((t) => t.value === currentMode);

  if (!presentationImageEditorInitialMode) {
    return null;
  }

  // Render content based on current mode
  const renderCurrentImagePreview = () => {
    if (!currentImageUrl) {
      return null;
    }

    return (
      <div className="space-y-3">
        <div
          className="relative mx-auto flex items-center justify-center overflow-hidden rounded-md border bg-muted shadow"
          style={{
            aspectRatio: `${previewFrame.width} / ${previewFrame.height}`,
            maxWidth: previewFrame.width,
            width: "100%",
          }}
        >
          <Image
            unoptimized
            width={400}
            height={300}
            src={currentImageUrl}
            alt={currentImageQuery}
            className="size-full"
            style={getPresentationImageCropStyles(currentCropSettings)}
          />
        </div>
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setIsCropModalOpen(true)}
          >
            <Scissors className="size-4" />
            Crop
          </Button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (currentMode) {
      case "generate":
        return (
          <div className="flex h-full flex-col">
            <div className="flex-none space-y-1 px-6 py-4">
              <h3 className="leading-none font-medium">Generate Image</h3>
              <p className="text-sm text-muted-foreground">
                Create unique images using AI.
              </p>
            </div>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-6">
              {renderCurrentImagePreview()}
              <SharedGenerateControls
                onImageSelect={(url, prompt) =>
                  handleImageSelect(url, prompt, "generate")
                }
                initialPrompt={currentImageQuery}
              />
            </div>
          </div>
        );
      case "your-images":
        return (
          <div className="flex h-full flex-col">
            <div className="flex flex-none items-start justify-between gap-3 px-6 py-4">
              <div className="min-w-0 space-y-1">
                <h3 className="leading-none font-medium">Uploaded Images</h3>
                <p className="text-sm text-muted-foreground">
                  Select from your uploaded images.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUploadClick}
                disabled={isUploading}
                className="shrink-0 gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {Math.trunc(progress)}%
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    Upload
                  </>
                )}
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-6">
              <UploadedImagesGrid
                onImageSelect={(image) =>
                  handleImageSelect(image.url, image.name, "upload")
                }
              />
            </div>
          </div>
        );
      case "generated-images":
        return (
          <div className="flex h-full flex-col">
            <div className="flex-none space-y-1 px-6 py-4">
              <h3 className="leading-none font-medium">Generated Images</h3>
              <p className="text-sm text-muted-foreground">
                Select from your AI-generated images.
              </p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-6">
              <GeneratedImagesGrid
                onImageSelect={(image) =>
                  handleImageSelect(image.url, image.prompt, "generate")
                }
              />
            </div>
          </div>
        );
      case "search":
        return (
          <div className="flex h-full flex-col">
            <div className="flex-none space-y-1 px-6 py-4">
              <h3 className="leading-none font-medium">Search Images</h3>
              <p className="text-sm text-muted-foreground">
                Find images from Unsplash, Pixabay, or live web results.
              </p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-6">
              <SharedImageSearchControls
                onImageSelect={(url, provider) =>
                  handleImageSelect(url, undefined, "search", provider)
                }
                initialQuery={initialSearchQuery}
                initialQueryKey={currentPresentationTitle ?? undefined}
                disableTrendingFallback={true}
                className="h-full"
              />
            </div>
          </div>
        );
      case "gif":
        return (
          <div className="flex h-full flex-col">
            <div className="flex-none space-y-1 px-6 py-4">
              <h3 className="leading-none font-medium">Search GIFs</h3>
              <p className="text-sm text-muted-foreground">
                Find animated GIFs from Giphy.
              </p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-6">
              <SharedGifSearchControls
                onGifSelect={(url) => handleImageSelect(url, undefined, "gif")}
                className="h-full"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex size-full flex-col border-l bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h2 className="text-sm font-semibold">Image Editor</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={closePresentationImageEditor}
          className="size-8 rounded-full p-0"
        >
          <X className="size-5" />
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        aria-label="presentation image editor panel control"
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Mode Selector Dropdown */}
      <div className="px-6 py-3">
        <Select value={currentMode} onValueChange={handleModeChange}>
          <SelectTrigger className="h-11 w-full rounded-xl">
            <SelectValue>
              {currentTab && (
                <div className="flex items-center gap-2">
                  {currentTab.icon}
                  <span>{currentTab.label}</span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {TAB_OPTIONS.map((tab) => (
              <SelectItem
                key={tab.value}
                value={tab.value}
                className="cursor-pointer rounded-lg"
              >
                <div className="flex items-center gap-2">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Content Area */}
      <div className="min-h-0 flex-1 overflow-hidden">{renderContent()}</div>

      {currentImageUrl ? (
        <CropModal
          open={isCropModalOpen}
          onOpenChange={setIsCropModalOpen}
          imageUrl={currentImageUrl}
          initialCropSettings={currentCropSettings}
          onSave={handleCropSave}
          imageDimensions={{
            height: previewFrame.height,
            scale: 1,
            width: previewFrame.width,
          }}
        />
      ) : null}
    </div>
  );
}

function getImagePreviewFrame(
  value: { height: number; width: number } | null,
): { height: number; width: number } {
  if (
    value &&
    Number.isFinite(value.height) &&
    Number.isFinite(value.width) &&
    value.height > 0 &&
    value.width > 0
  ) {
    return value;
  }

  return { height: 450, width: 800 };
}

function getImageEditorElementKey(
  element: Record<string, unknown> | null,
): string {
  if (typeof element?.id === "string") {
    return element.id;
  }

  return "";
}

function getImageCropSettings(value: unknown): ImageCropSettings {
  if (
    typeof value === "object" &&
    value !== null &&
    "objectPosition" in value
  ) {
    const cropSettings = value as Partial<ImageCropSettings>;
    const objectPosition = cropSettings.objectPosition;

    return {
      objectFit: cropSettings.objectFit ?? "cover",
      objectPosition: {
        x: objectPosition?.x ?? 50,
        y: objectPosition?.y ?? 50,
      },
      zoom: cropSettings.zoom ?? 1,
    };
  }

  return {
    objectFit: "cover",
    objectPosition: { x: 50, y: 50 },
    zoom: 1,
  };
}
