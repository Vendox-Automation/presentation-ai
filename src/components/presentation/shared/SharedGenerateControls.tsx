"use client";

import { AlertTriangle, Check, Loader2, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import { type Image as GeneratedImage } from "@/app/_actions/apps/image-studio/fetch";
import { generateImageAction } from "@/app/_actions/apps/image-studio/generate";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_IMAGE_MODEL,
  getAvailableImageModels,
  type ImageAspectRatio,
  type ImageModelList,
} from "@/constants/image-models";
import {
  buildPresentationThemedImagePrompt,
  resolvePresentationImageTheme,
} from "@/lib/presentation/image-generation-theme-prompt";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";

interface SharedGenerateControlsProps {
  onImageSelect: (url: string, prompt: string) => void;
  initialPrompt?: string;
  className?: string;
  onImagesGenerated?: (images: GeneratedImage[]) => void;
  // showGallery prop removed as requested
}

const ART_STYLES = [
  { id: "none", label: "None", value: "" },
  {
    id: "photorealistic",
    label: "Photorealistic",
    value: "photorealistic, highly detailed, 8k",
  },
  {
    id: "illustration",
    label: "Illustration",
    value: "illustration, vector art, flat style",
  },
  {
    id: "3d-render",
    label: "3D Render",
    value: "3d render, unreal engine 5, octane render",
  },
  { id: "abstract", label: "Abstract", value: "abstract, artistic, colorful" },
  {
    id: "watercolor",
    label: "Watercolor",
    value: "watercolor painting, artistic, soft colors",
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    value: "cyberpunk, neon lights, futuristic",
  },
  { id: "anime", label: "Anime", value: "anime style, studio ghibli, vibrant" },
  {
    id: "oil-painting",
    label: "Oil Painting",
    value: "oil painting, textured, canvas",
  },
];

const ASPECT_RATIOS = [
  { label: "1:1 (Square)", value: "1:1" },
  { label: "4:3 (Standard)", value: "4:3" },
  { label: "3:4 (Portrait)", value: "3:4" },
  { label: "16:9 (Widescreen)", value: "16:9" },
  { label: "9:16 (Mobile)", value: "9:16" },
];

const IMAGE_COUNTS = [1, 2, 3, 4];

export function SharedGenerateControls({
  onImageSelect,
  initialPrompt = "",
  className,
  onImagesGenerated,
}: SharedGenerateControlsProps) {
  const { data: session } = useSession();
  const imageModels = useMemo(
    () => getAvailableImageModels(session?.user?.isAdmin === true),
    [session?.user?.isAdmin],
  );
  const {
    imageModel,
    setImageModel,
    generatedImageCache,
    setGeneratedImageCache,
    theme,
    customThemeData,
  } = usePresentationState();
  const [newPrompt, setNewPrompt] = useState(initialPrompt);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // New state for enhanced controls
  const [selectedStyle, setSelectedStyle] = useState(ART_STYLES[0]?.id);
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>("16:9");
  const [imageCount, setImageCount] = useState(1);

  const buildStyledPrompt = () => {
    const styleSuffix =
      ART_STYLES.find((s) => s.id === selectedStyle)?.value || "";
    return styleSuffix
      ? `${newPrompt.trim()}, ${styleSuffix}`
      : newPrompt.trim();
  };

  const buildFullPrompt = () => {
    const styledPrompt = buildStyledPrompt();
    const currentTheme = resolvePresentationImageTheme(theme, customThemeData);

    return buildPresentationThemedImagePrompt(styledPrompt, currentTheme);
  };

  // Get cached images for current prompt
  const cacheKey = newPrompt.trim() ? buildFullPrompt() : "";
  const lastGeneratedImages = cacheKey
    ? (generatedImageCache[cacheKey] ?? [])
    : [];

  // Update prompt when initialPrompt changes
  useEffect(() => {
    if (initialPrompt) {
      setNewPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const handleGenerateClick = async () => {
    if (!newPrompt.trim()) return;

    setLocalError(null);
    setIsGenerating(true);

    try {
      const fullPrompt = buildFullPrompt();

      // Generate multiple images sequentially (or parallel if backend supports, here sequential for safety)
      const promises = Array(imageCount)
        .fill(null)
        .map(() =>
          generateImageAction(
            fullPrompt,
            imageModels.some((model) => model.value === imageModel)
              ? imageModel
              : DEFAULT_IMAGE_MODEL,
            aspectRatio,
          ),
        );

      const results = await Promise.all(promises);

      const successfulImages: GeneratedImage[] = [];
      let firstError: string | undefined;

      for (const result of results) {
        if (result.success && "image" in result && result.image) {
          successfulImages.push(result.image as unknown as GeneratedImage);
        } else if (!firstError && "error" in result) {
          firstError = result.error;
        }
      }

      if (successfulImages.length > 0) {
        setGeneratedImageCache(fullPrompt, successfulImages);
        onImagesGenerated?.(successfulImages);
      } else {
        setLocalError(firstError ?? "Failed to generate images");
      }
    } catch (error) {
      setLocalError(
        error instanceof Error ? error.message : "Failed to generate image",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn("flex h-full flex-col space-y-4", className)}>
      {localError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{localError}</AlertDescription>
        </Alert>
      )}

      {/* Prompt Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          Prompt
        </Label>
        <Textarea
          placeholder="Describe the image you want to create..."
          className="min-h-20 resize-none text-base"
          value={newPrompt}
          onChange={(e) => setNewPrompt(e.target.value)}
          disabled={isGenerating}
        />

        {/* Generate Button - Moved up */}
        <Button
          variant="default"
          className="h-10 w-full bg-linear-to-r from-primary to-primary/90 text-base shadow-lg shadow-primary/20 transition-all hover:from-primary/90 hover:to-primary"
          onClick={handleGenerateClick}
          disabled={isGenerating || !newPrompt.trim()}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate
            </>
          )}
        </Button>
      </div>

      {/* Results & Loading State - Only render container when there's content */}
      {(isGenerating || lastGeneratedImages.length > 0) && (
        <div className="flex min-h-0 flex-1 flex-col">
          {isGenerating ? (
            <div className="flex h-48 animate-in flex-col items-center justify-center rounded-lg border bg-muted/30 duration-300 zoom-in-95 fade-in">
              <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
              <p className="animate-pulse text-center text-sm text-muted-foreground">
                Dreaming up your image...
                <br />
                <span className="text-xs opacity-70">
                  This typically takes 5-10 seconds
                </span>
              </p>
            </div>
          ) : (
            <ScrollArea className="-mx-2 flex-1 px-2">
              <div className="grid grid-cols-2 gap-2 pb-4">
                {lastGeneratedImages.map((img) => (
                  <div
                    key={img.id}
                    className={cn(
                      "group relative animate-in overflow-hidden rounded-lg border-2 border-primary shadow-md duration-300 zoom-in-95 fade-in",
                      aspectRatio === "16:9" && "aspect-video",
                      aspectRatio === "1:1" && "aspect-square",
                      aspectRatio === "4:3" && "aspect-4/3",
                      aspectRatio === "3:4" && "aspect-3/4",
                      aspectRatio === "9:16" && "aspect-9/16",
                    )}
                  >
                    {/** biome-ignore lint/performance/noImgElement: Without this it is not possible to show image links */}
                    <img
                      src={img.url}
                      alt={img.prompt}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-full shadow-lg"
                        onClick={() =>
                          onImageSelect(img.url, buildStyledPrompt())
                        }
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      )}

      <Separator />

      {/* Settings Section - Push down */}
      <div className="space-y-4 pt-1">
        <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Style & Settings
        </h4>

        <div className="grid grid-cols-2 gap-4">
          {/* Art Style */}
          <div className="col-span-2 space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Art style
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {ART_STYLES.slice(0, 6).map((style) => (
                <Button
                  key={style.id}
                  variant={selectedStyle === style.id ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 justify-start px-2 text-xs",
                    selectedStyle === style.id &&
                      "bg-primary text-primary-foreground",
                  )}
                  onClick={() => setSelectedStyle(style.id)}
                >
                  {style.label}
                </Button>
              ))}
              <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="More" />
                </SelectTrigger>
                <SelectContent>
                  {ART_STYLES.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      {style.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Aspect ratio
            </Label>
            <Select
              value={aspectRatio}
              onValueChange={(v) => setAspectRatio(v as ImageAspectRatio)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASPECT_RATIOS.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Count */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Image count
            </Label>
            <Select
              value={imageCount.toString()}
              onValueChange={(v) => setImageCount(parseInt(v, 10))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_COUNTS.map((count) => (
                  <SelectItem key={count} value={count.toString()}>
                    {count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div className="col-span-2 space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">
              Model
            </Label>
            <Select
              value={imageModel}
              onValueChange={(v) => setImageModel(v as ImageModelList)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {imageModels.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
