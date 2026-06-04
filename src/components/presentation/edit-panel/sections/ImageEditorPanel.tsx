"use client";

import {
  Clapperboard,
  Globe,
  ImageIcon,
  Images,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import {
  ErrorDisplay,
  GenerateControls,
} from "@/components/notebook/presentation/editor/custom-elements/image-editor";
import { CropModal } from "@/components/notebook/presentation/editor/custom-elements/image-editor/CropModal";
import { EmbedControls } from "@/components/notebook/presentation/editor/custom-elements/image-editor/EmbedControls";
import { GeneratedImagesGrid } from "@/components/notebook/presentation/editor/custom-elements/image-editor/GeneratedImagesGrid";
import { GifSearchControls } from "@/components/notebook/presentation/editor/custom-elements/image-editor/GifSearchControls";
import { ImageSearchControls } from "@/components/notebook/presentation/editor/custom-elements/image-editor/ImageSearchControls";
import { useImageDimensions } from "@/components/notebook/presentation/editor/custom-elements/image-editor/useImageDimensions";
import { YourImagesControls } from "@/components/notebook/presentation/editor/custom-elements/image-editor/YourImagesControls";
import { type ImageCropSettings } from "@/components/notebook/presentation/utils/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useDebouncedSave } from "@/hooks/presentation/useDebouncedSave";
import { getPresentationTitleSearchQuery } from "@/lib/presentation/title-search-query";
import {
  usePresentationState,
  type ImageEditorMode,
} from "@/states/presentation-state";
import { ChartEditorControls } from "./ChartEditorControls";

// Define tab options with icons
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
  { value: "embed", label: "Embed", icon: <Globe className="size-4" /> },
];

export function ImageEditorPanel() {
  const { saveImmediately } = useDebouncedSave();

  const slides = usePresentationState((s) => s.slides);
  const setSlides = usePresentationState((s) => s.setSlides);
  const imageEditorInitialMode = usePresentationState(
    (s) => s.imageEditorInitialMode,
  );
  const closeImageEditor = usePresentationState((s) => s.closeImageEditor);
  const currentSlideId = usePresentationState((s) => s.currentSlideId);
  const currentPresentationTitle = usePresentationState(
    (s) => s.currentPresentationTitle,
  );
  const setPaletteDropTarget = usePresentationState(
    (s) => s.setPaletteDropTarget,
  );

  // Get current slide data from state
  const currentSlide = slides.find((s) => s.id === currentSlideId);
  const slideId = currentSlide?.id ?? "";
  const initialMode = imageEditorInitialMode ?? "generate";

  const rootImage = currentSlide?.rootImage;
  const layoutType = currentSlide?.layoutType ?? "left";
  const initialSearchQuery = getPresentationTitleSearchQuery(
    currentPresentationTitle,
  );

  // Create a synthetic element from rootImage for compatibility with existing controls
  const element = {
    type: "rootImage" as const,
    children: [] as never[],
    query: rootImage?.query ?? "",
    url: rootImage?.url,
    embedType: rootImage?.embedType,
    cropSettings: rootImage?.cropSettings,
    imageSource: rootImage?.imageSource,
    size: rootImage?.size,
  };

  // Local state for current tab
  const [currentMode, setCurrentMode] = useState<ImageEditorMode>(
    initialMode ?? (element.embedType ? "embed" : "generate"),
  );

  // Sync mode when imageEditorInitialMode changes
  useEffect(() => {
    if (imageEditorInitialMode) {
      setCurrentMode(imageEditorInitialMode);
    }
  }, [imageEditorInitialMode]);

  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  // Use the custom hook for dimension calculations
  const imageDimensions = useImageDimensions({
    element,
    slideId,
    layoutType,
  });

  const handleEmbedChange = (embedType: string, url: string) => {
    setPaletteDropTarget(null);
    setSlides((slides) =>
      slides.map((slide) =>
        slide.id === slideId
          ? {
              ...slide,
              rootImage: {
                ...slide.rootImage!,
                // When embed type is "image", keep it as undefined to treat as regular root image
                embedType: embedType === "image" ? undefined : embedType,
                url,
                chartType: undefined,
                chartData: undefined,
                paletteDropMutable: false,
              },
            }
          : slide,
      ),
    );
    void saveImmediately();
  };

  const handleClearEmbed = () => {
    setPaletteDropTarget(null);
    setSlides((slides) =>
      slides.map((slide) =>
        slide.id === slideId
          ? {
              ...slide,
              rootImage: {
                ...slide.rootImage!,
                embedType: undefined,
                url: undefined,
                paletteDropMutable: false,
              },
            }
          : slide,
      ),
    );
    void saveImmediately();
    setCurrentMode("generate");
  };

  const handleCropSave = (settings: ImageCropSettings) => {
    setPaletteDropTarget(null);
    setSlides((slides) =>
      slides.map((slide) =>
        slide.id === slideId
          ? {
              ...slide,
              rootImage: {
                ...slide.rootImage!,
                cropSettings: settings,
                paletteDropMutable: false,
              },
            }
          : slide,
      ),
    );
    void saveImmediately();
    setIsCropModalOpen(false);
  };

  const handleGeneratedImageSelect = (url: string, prompt: string) => {
    const { clearRootImageGeneration } = usePresentationState.getState();

    setPaletteDropTarget(null);
    if (slideId) {
      clearRootImageGeneration(slideId);
    }

    setSlides((slides) =>
      slides.map((slide) =>
        slide.id === slideId
          ? {
              ...slide,
              rootImage: {
                ...slide.rootImage!,
                url,
                query: prompt,
                embedType: undefined,
                imageSource: "generate",
                chartType: undefined,
                chartData: undefined,
                paletteDropMutable: false,
              },
            }
          : slide,
      ),
    );
    void saveImmediately();
  };

  const handleModeChange = (value: string) => {
    setCurrentMode(value as ImageEditorMode);
  };

  // Get current tab info
  const currentTab = TAB_OPTIONS.find((t) => t.value === currentMode);

  if (!imageEditorInitialMode) {
    return null;
  }

  // Render content based on current mode
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
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              <GenerateControls
                element={element}
                slideId={slideId}
                isRootImage={true}
                onOpenCrop={() => setIsCropModalOpen(true)}
                imageDimensions={imageDimensions}
              />
            </div>
          </div>
        );
      case "your-images":
        return (
          <div className="flex h-full flex-col">
            <div className="flex-none space-y-1 px-6 py-4">
              <h3 className="leading-none font-medium">Uploaded Images</h3>
              <p className="text-sm text-muted-foreground">
                Select from your uploaded images.
              </p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pb-6">
              <YourImagesControls
                element={element}
                slideId={slideId}
                isRootImage={true}
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
                  handleGeneratedImageSelect(image.url, image.prompt)
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
              <ImageSearchControls
                element={element}
                slideId={slideId}
                isRootImage={true}
                initialQuery={initialSearchQuery}
                initialQueryKey={currentPresentationTitle ?? undefined}
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
              <GifSearchControls
                element={element}
                slideId={slideId}
                isRootImage={true}
              />
            </div>
          </div>
        );
      case "embed":
        return (
          <ScrollArea className="h-full">
            <div className="space-y-6 p-6">
              <div className="space-y-1">
                <h3 className="leading-none font-medium">Embed Content</h3>
                <p className="text-sm text-muted-foreground">
                  Embed videos, tweets, or other content.
                </p>
              </div>
              <EmbedControls
                embedType={element.embedType}
                embedUrl={element.url}
                onEmbedChange={handleEmbedChange}
                onClearEmbed={handleClearEmbed}
                imageDimensions={imageDimensions}
                element={element}
                slideId={slideId}
                isRootImage={true}
                onOpenCrop={() => setIsCropModalOpen(true)}
                cropSettings={{
                  objectFit: element.cropSettings?.objectFit ?? "cover",
                  objectPosition: {
                    x: element.cropSettings?.objectPosition.x ?? 50,
                    y: element.cropSettings?.objectPosition.y ?? 50,
                  },
                  zoom: element.cropSettings?.zoom ?? 1,
                }}
                onCropSettingsChange={handleCropSave}
              />
            </div>
          </ScrollArea>
        );
      case "chart":
        return (
          <div className="flex h-full flex-col">
            <div className="flex-none space-y-1 px-6 py-4">
              <h3 className="leading-none font-medium">Edit Chart</h3>
              <p className="text-sm text-muted-foreground">
                Customize your chart data and appearance.
              </p>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <ChartEditorControls slideId={slideId} />
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
        <h2 className="text-sm font-semibold">Image Studio</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeImageEditor}
          className="size-8 rounded-full p-0"
        >
          <X className="size-5" />
        </Button>
      </div>

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
      <div className="min-h-0 flex-1 overflow-hidden">
        <ErrorDisplay error={undefined} localError={null} />
        {renderContent()}
      </div>

      {element.url && (
        <CropModal
          open={isCropModalOpen}
          onOpenChange={setIsCropModalOpen}
          imageUrl={element.url}
          initialCropSettings={{
            objectFit: element.cropSettings?.objectFit ?? "cover",
            objectPosition: {
              x: element.cropSettings?.objectPosition.x ?? 50,
              y: element.cropSettings?.objectPosition.y ?? 50,
            },
            zoom: element.cropSettings?.zoom ?? 1,
          }}
          onSave={handleCropSave}
          imageDimensions={imageDimensions}
        />
      )}
    </div>
  );
}
