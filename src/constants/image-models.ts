// OpenRouter image-generation model slugs. Browse the current catalog at
// https://openrouter.ai/models?output_modalities=image to add more.
export type ImageModelList =
  | "google/gemini-2.5-flash-image"
  | "google/gemini-3.1-flash-image"
  | "google/gemini-3-pro-image"
  | "openai/gpt-image-2";

export const DEFAULT_IMAGE_MODEL: ImageModelList =
  "google/gemini-2.5-flash-image";

export type ImageModelOption = {
  value: ImageModelList;
  label: string;
  adminOnly?: boolean;
};

const IMAGE_MODELS: ImageModelOption[] = [
  {
    value: "google/gemini-2.5-flash-image",
    label: "Nano Banana (fast)",
  },
  {
    value: "google/gemini-3.1-flash-image",
    label: "Nano Banana 2",
    adminOnly: true,
  },
  {
    value: "google/gemini-3-pro-image",
    label: "Nano Banana Pro",
    adminOnly: true,
  },
  {
    value: "openai/gpt-image-2",
    label: "GPT Image 2",
    adminOnly: true,
  },
];

export const getAvailableImageModels = (isAdmin: boolean): ImageModelOption[] =>
  IMAGE_MODELS.filter((model) => isAdmin || !model.adminOnly);

export type ImageAspectRatio = "16:9" | "1:1" | "4:3" | "3:4" | "9:16";
