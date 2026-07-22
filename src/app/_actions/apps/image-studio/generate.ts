"use server";

import {
  DEFAULT_IMAGE_MODEL,
  type ImageAspectRatio,
  type ImageModelList,
} from "@/constants/image-models";
import { requireOptionalIntegration } from "@/lib/env/optional-integrations";
import { env } from "@/env";
import { dataUrlToBuffer, generateOpenRouterImage } from "@/lib/openrouter-image";
import { saveGeneratedImage } from "@/lib/image-storage";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

async function persistGeneratedImage(
  imageBuffer: Buffer,
  prompt: string,
  userId: string,
  filePrefix: string,
) {
  const filename = `${filePrefix}_${Date.now()}.png`;
  const url = await saveGeneratedImage(imageBuffer, filename);

  return db.generatedImage.create({
    data: {
      url,
      prompt,
      userId,
    },
  });
}

async function generateOpenRouterImageAndPersist(
  prompt: string,
  model: ImageModelList,
  userId: string,
  aspectRatio: ImageAspectRatio,
) {
  const openRouterConfig = requireOptionalIntegration({
    integration: "OpenRouter",
    envVar: "OPENROUTER_API_KEY",
    value: env.OPENROUTER_API_KEY,
    feature: "AI image generation",
  });

  if (!openRouterConfig.ok) {
    return {
      success: false,
      error: openRouterConfig.error,
    };
  }

  const { dataUrl } = await generateOpenRouterImage({
    model,
    prompt,
    aspectRatio,
  });

  const image = await persistGeneratedImage(
    dataUrlToBuffer(dataUrl),
    prompt,
    userId,
    "image",
  );

  return {
    success: true,
    image,
  };
}

export async function generateImageAction(
  prompt: string,
  model: ImageModelList = DEFAULT_IMAGE_MODEL,
  aspectRatio: ImageAspectRatio = "16:9",
) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in to generate images",
    };
  }

  try {
    const actualModel = session.user.isAdmin ? model : DEFAULT_IMAGE_MODEL;
    return await generateOpenRouterImageAndPersist(
      prompt,
      actualModel,
      session.user.id,
      aspectRatio,
    );
  } catch (error) {
    console.error("Error generating image:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate image",
    };
  }
}
