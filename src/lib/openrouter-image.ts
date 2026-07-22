import { env } from "@/env";

const OPENROUTER_IMAGES_URL = "https://openrouter.ai/api/v1/images";

export type OpenRouterAspectRatio =
  | "16:9"
  | "1:1"
  | "4:3"
  | "3:4"
  | "9:16";

interface OpenRouterImageResponse {
  data?: Array<{
    b64_json?: string;
    media_type?: string;
  }>;
}

export async function generateOpenRouterImage({
  model,
  prompt,
  aspectRatio,
}: {
  model: string;
  prompt: string;
  aspectRatio?: OpenRouterAspectRatio;
}): Promise<{ dataUrl: string }> {
  const response = await fetch(OPENROUTER_IMAGES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      ...(aspectRatio ? { aspect_ratio: aspectRatio } : {}),
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `OpenRouter image generation failed (${response.status}): ${errorBody || response.statusText}`,
    );
  }

  const result = (await response.json()) as OpenRouterImageResponse;
  const image = result.data?.[0];

  if (!image?.b64_json) {
    throw new Error("OpenRouter did not return image data");
  }

  const mediaType = image.media_type ?? "image/png";
  return { dataUrl: `data:${mediaType};base64,${image.b64_json}` };
}

export function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.substring(dataUrl.indexOf(",") + 1);
  return Buffer.from(base64, "base64");
}
