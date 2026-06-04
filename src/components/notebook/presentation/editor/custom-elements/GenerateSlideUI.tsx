"use client";

import { Loader2, Sparkles, X } from "lucide-react";
import { m as motion } from "motion/react";
import { useSession } from "next-auth/react";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  DEFAULT_IMAGE_MODEL,
  getAvailableImageModels,
  type ImageModelList,
} from "@/constants/image-models";
import { useSlideGeneration } from "../context/SlideGenerationContext";

interface GenerateSlideUIProps {
  slideId: string;
  onClose: () => void;
}

type ContentType = "Slide" | "Infograph";
type ImageStyle = "3D" | "Sketch" | "Flat";
type TextDensity = "Minimal" | "Balanced" | "Detailed";

const IMAGE_STYLES: ImageStyle[] = ["3D", "Sketch", "Flat"];

const TEXT_DENSITIES: TextDensity[] = ["Minimal", "Balanced", "Detailed"];

export function GenerateSlideUI({ slideId, onClose }: GenerateSlideUIProps) {
  const { data: session } = useSession();
  const imageModels = useMemo(
    () => getAvailableImageModels(session?.user?.isAdmin === true),
    [session?.user?.isAdmin],
  );
  const [prompt, setPrompt] = useState("");
  const [contentType, setContentType] = useState<ContentType>("Slide");
  const [imageModel, setImageModel] =
    useState<ImageModelList>(DEFAULT_IMAGE_MODEL);
  const [imageStyle, setImageStyle] = useState<ImageStyle>("3D");
  const [textDensity, setTextDensity] = useState<TextDensity>("Balanced");
  const { isGenerating, generatingSlideId, generateSlide, cancelGeneration } =
    useSlideGeneration();

  // Check if we're generating for THIS slide
  const isGeneratingThisSlide = isGenerating && generatingSlideId === slideId;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!prompt.trim() || isGeneratingThisSlide) return;

      generateSlide(slideId, prompt.trim(), {
        slideType: contentType === "Infograph" ? "image" : "standard",
        imageStyle,
        textDensity,
        imageModel: imageModels.some((model) => model.value === imageModel)
          ? imageModel
          : DEFAULT_IMAGE_MODEL,
      });
    },
    [
      prompt,
      isGeneratingThisSlide,
      generateSlide,
      slideId,
      contentType,
      imageStyle,
      textDensity,
      imageModel,
      imageModels,
    ],
  );

  const handleCancel = useCallback(() => {
    if (isGeneratingThisSlide) {
      cancelGeneration();
    }
    onClose();
  }, [isGeneratingThisSlide, cancelGeneration, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  return (
    <div
      data-slate-void="true"
      contentEditable={false}
      className="pointer-events-auto select-none"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mt-6 px-6 sm:px-10 lg:px-16"
      >
        {!isGeneratingThisSlide ? (
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 text-card-foreground shadow-sm dark:bg-slate-950 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Generate Slide
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Describe what you want on this slide and AI will generate it
                    for you.
                  </p>
                </div>
                <Tabs
                  value={contentType}
                  onValueChange={(value) =>
                    setContentType(value as ContentType)
                  }
                  className="w-full sm:w-auto"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="Slide">Standard Slide</TabsTrigger>
                    <TabsTrigger value="Infograph">Infographic</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {contentType === "Infograph" && (
                <div className="flex flex-wrap items-center gap-4 py-3 border-y border-border/50">
                  <div className="flex flex-col space-y-2 flex-1 min-w-35">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Model
                    </Label>
                    <Select
                      value={imageModel}
                      onValueChange={(value) =>
                        setImageModel(value as ImageModelList)
                      }
                    >
                      <SelectTrigger className="h-9">
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

                  <div className="flex flex-col space-y-2 flex-1 min-w-35">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Style
                    </Label>
                    <Select
                      value={imageStyle}
                      onValueChange={(value) =>
                        setImageStyle(value as ImageStyle)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {IMAGE_STYLES.map((style) => (
                          <SelectItem key={style} value={style}>
                            {style}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col space-y-2 flex-1 min-w-35">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Text Density
                    </Label>
                    <Select
                      value={textDensity}
                      onValueChange={(value) =>
                        setTextDensity(value as TextDensity)
                      }
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEXT_DENSITIES.map((density) => (
                          <SelectItem key={density} value={density}>
                            {density}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="E.g., A comparison between Q1 and Q2 marketing strategies..."
                rows={4}
                className="resize-none focus-visible:ring-1"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={handleCancel}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button type="submit" disabled={!prompt.trim()}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-border/50 bg-muted/20 backdrop-blur-sm">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h3 className="font-medium text-lg mb-2">
              Generating your slide...
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
              AI is currently designing the layout, writing the content, and
              sourcing the perfect images.
            </p>
            <Button variant="outline" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel Generation
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
