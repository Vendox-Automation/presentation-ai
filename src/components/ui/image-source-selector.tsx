"use client";

import { Clapperboard, Image, Wand2 } from "lucide-react";
import { useSession } from "next-auth/react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DEFAULT_IMAGE_MODEL,
  getAvailableImageModels,
  type ImageModelList,
} from "@/constants/image-models";
import { type PresentationStockImageProvider } from "@/states/presentation-state";

interface ImageSourceSelectorProps {
  imageSource: "automatic" | "ai" | "stock" | "gif";
  imageModel: ImageModelList;
  stockImageProvider: PresentationStockImageProvider;
  onImageSourceChange: (source: "automatic" | "ai" | "stock" | "gif") => void;
  onImageModelChange: (model: ImageModelList) => void;
  onStockImageProviderChange: (
    provider: PresentationStockImageProvider,
  ) => void;
  className?: string;
  showLabel?: boolean;
}

export function ImageSourceSelector({
  imageSource,
  imageModel,
  stockImageProvider,
  onImageSourceChange,
  onImageModelChange,
  onStockImageProviderChange,
  className,
  showLabel = true,
}: ImageSourceSelectorProps) {
  const { data: session } = useSession();
  const imageModels = getAvailableImageModels(session?.user?.isAdmin === true);

  return (
    <div className={className}>
      {showLabel && (
        <Label className="mb-2 block text-sm font-medium">Image Source</Label>
      )}
      <Select
        value={
          imageSource === "ai"
            ? imageModel || DEFAULT_IMAGE_MODEL
            : imageSource === "stock"
              ? `stock-${stockImageProvider}`
              : imageSource === "gif"
                ? "gif"
                : "automatic"
        }
        onValueChange={(value) => {
          if (value === "automatic") {
            onImageSourceChange("automatic");
          } else if (value === "gif") {
            onImageSourceChange("gif");
          } else if (value.startsWith("stock-")) {
            // Handle stock image selection
            const provider = value.replace(
              "stock-",
              "",
            ) as PresentationStockImageProvider;
            onImageSourceChange("stock");
            onStockImageProviderChange(provider);
          } else {
            // Handle AI model selection
            onImageSourceChange("ai");
            onImageModelChange(value as ImageModelList);
          }
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select image generation method" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="automatic" className="font-medium">
              Automatic
            </SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel className="flex items-center gap-1 text-primary/80">
              <Wand2 size={10} />
              AI Generation
            </SelectLabel>
            {imageModels.map((model) => (
              <SelectItem key={model.value} value={model.value}>
                {model.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel className="flex items-center gap-1 text-primary/80">
              <Image size={10} />
              Stock & Web Images
            </SelectLabel>
            <SelectItem value="stock-unsplash">Unsplash</SelectItem>
            <SelectItem value="stock-pixabay">Pixabay</SelectItem>
            <SelectItem value="stock-google">Web Search</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel className="flex items-center gap-1 text-primary/80">
              <Clapperboard size={10} />
              Animated
            </SelectLabel>
            <SelectItem value="gif">GIFs from Giphy</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
