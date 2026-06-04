"use client";

import {
  ChartNoAxesColumnIncreasing,
  Loader2,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { generateInfographicImageAction } from "@/app/_actions/apps/image-studio/generate-infographic";
import { type RootImage } from "@/components/notebook/presentation/utils/parser";
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
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_IMAGE_MODEL,
  getAvailableImageModels,
  type ImageModelList,
} from "@/constants/image-models";
import { useDebouncedSave } from "@/hooks/presentation/useDebouncedSave";
import { usePresentationState } from "@/states/presentation-state";

const LAYOUTS = [
  "Timeline",
  "Process",
  "Comparison",
  "Hierarchy",
  "Cycle",
  "Roadmap",
  "Matrix",
] as const;

type InfographicGenerationResponse = {
  image?: {
    id: string;
    prompt: string;
    url: string;
  };
  error?: string;
};

export function InfographicGenerationPanel() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.isAdmin === true;
  const availableImageModels = useMemo(
    () => getAvailableImageModels(isAdmin),
    [isAdmin],
  );
  const { saveImmediately } = useDebouncedSave();
  const closeInfographicGenerationEditor = usePresentationState(
    (s) => s.closeInfographicGenerationEditor,
  );
  const currentSlideId = usePresentationState((s) => s.currentSlideId);
  const slides = usePresentationState((s) => s.slides);
  const setSlides = usePresentationState((s) => s.setSlides);
  const imageModel = usePresentationState((s) => s.imageModel);
  const setImageModel = usePresentationState((s) => s.setImageModel);
  const boundUpdateElement = usePresentationState((s) => s.boundUpdateElement);

  const currentSlide = slides.find((slide) => slide.id === currentSlideId);
  const existingPrompt = currentSlide?.rootImage?.query ?? "";
  const [prompt, setPrompt] = useState(existingPrompt);

  const [layout, setLayout] = useState<(typeof LAYOUTS)[number]>("Timeline");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<
    InfographicGenerationResponse["image"] | null
  >(null);

  const selectedModel = useMemo(
    () =>
      availableImageModels.some((model) => model.value === imageModel)
        ? imageModel
        : DEFAULT_IMAGE_MODEL,
    [availableImageModels, imageModel],
  );

  const applyGeneratedImage = (url: string, query: string) => {
    if (boundUpdateElement) {
      boundUpdateElement({
        id: "",
        provider: "infographic",
        query,
        url,
      });
      void saveImmediately();
      return;
    }

    if (!currentSlideId) return;

    setSlides((existingSlides) =>
      existingSlides.map((slide) =>
        slide.id === currentSlideId
          ? {
              ...slide,
              rootImage: {
                ...(slide.rootImage ?? { query: "" }),
                query,
                url,
                embedType: "infographic",
                imageSource: "generate",
                chartType: undefined,
                chartData: undefined,
                chartOptions: undefined,
                paletteDropMutable: false,
              } satisfies RootImage,
            }
          : slide,
      ),
    );
    void saveImmediately();
  };

  const handleGenerate = async () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) return;

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const result = await generateInfographicImageAction({
        prompt: trimmedPrompt,
        layout,
        model: selectedModel,
      });

      if (!result.success || !result.image) {
        throw new Error(result.error ?? "Failed to generate infographic");
      }

      setGeneratedImage(result.image);
      applyGeneratedImage(result.image.url, trimmedPrompt);
      toast.success("Infographic added to slide");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to generate infographic",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col border-l bg-background">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <ChartNoAxesColumnIncreasing className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">AI Infographics</h2>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={closeInfographicGenerationEditor}
          className="size-8 rounded-full p-0"
        >
          <X className="size-5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-5 p-6">
          {(() => {
            const previewUrl =
              generatedImage?.url ?? currentSlide?.rootImage?.url;
            return previewUrl ? (
              <div className="group relative overflow-hidden rounded-md border bg-muted/30 animate-in fade-in duration-300">
                {/** biome-ignore lint/performance/noImgElement: Generated infographic preview — URL is already persisted externally */}
                <img
                  src={previewUrl}
                  alt="Infographic preview"
                  className="aspect-video w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 flex items-end justify-end bg-linear-to-t from-black/40 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <span className="rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                    Preview
                  </span>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-md border bg-muted/30">
                <div className="flex flex-col items-center justify-center gap-4 px-6 py-9 text-center">
                  {/** biome-ignore lint/performance/noImgElement: Project placeholder SVG is reused as requested */}
                  <img
                    src="/placeholder.svg"
                    alt=""
                    className="h-24 w-32 rounded-md object-cover"
                  />
                  <div className="space-y-1">
                    <h3 className="text-xl font-semibold">
                      Create an infographic
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Describe the content and layout you want for your
                      infographic
                    </p>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="space-y-2">
            <Label htmlFor="infographic-prompt">Prompt</Label>
            <div className="rounded-md border border-primary/70 focus-within:ring-2 focus-within:ring-primary/20">
              <Textarea
                id="infographic-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Describe the process, timeline, or comparison you'd like to visualize (e.g., The 5 stages of business growth)..."
                className="min-h-26 resize-none border-0 text-base shadow-none focus-visible:ring-0"
              />
              <div className="flex justify-end px-3 pb-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-primary"
                  onClick={() =>
                    setPrompt((currentPrompt) =>
                      currentPrompt.trim()
                        ? `${currentPrompt.trim()}. Include a crisp title, clear stage labels, concise data callouts, directional flow, and presentation-grade visual hierarchy.`
                        : currentPrompt,
                    )
                  }
                  disabled={!prompt.trim() || isGenerating}
                >
                  Enhance prompt
                  <WandSparkles className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Layout</Label>
            <Select
              value={layout}
              onValueChange={(value) =>
                setLayout(value as (typeof LAYOUTS)[number])
              }
            >
              <SelectTrigger className="h-10 rounded-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LAYOUTS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Model</Label>
            <Select
              value={selectedModel}
              onValueChange={(value) => setImageModel(value as ImageModelList)}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableImageModels.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            className="h-12 w-full rounded-full text-base font-semibold"
            onClick={handleGenerate}
            disabled={
              !prompt.trim() ||
              isGenerating ||
              (!currentSlideId && !boundUpdateElement)
            }
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Generating
              </>
            ) : (
              <>
                <Sparkles className="mr-2 size-4" />
                Generate
              </>
            )}
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
