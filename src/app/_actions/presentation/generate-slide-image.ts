"use server";

import { env } from "@/env";
import { requireOptionalIntegration } from "@/lib/env/optional-integrations";
import { dataUrlToBuffer, generateOpenRouterImage } from "@/lib/openrouter-image";
import { saveGeneratedImage } from "@/lib/image-storage";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

const DEFAULT_SLIDE_IMAGE_MODEL = "google/gemini-2.5-flash-image";

export async function generateSlideImageAction(
  prompt: string,
  imageModel: string = DEFAULT_SLIDE_IMAGE_MODEL,
) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      error: "You must be logged in to generate images",
    };
  }

  // Admin only feature
  if (!session.user.isAdmin) {
    return {
      success: false,
      error: "This feature is only available for admin users",
    };
  }

  try {
    const openRouterConfig = requireOptionalIntegration({
      integration: "OpenRouter",
      envVar: "OPENROUTER_API_KEY",
      value: env.OPENROUTER_API_KEY,
      feature: "slide image generation",
    });

    if (!openRouterConfig.ok) {
      return {
        success: false,
        error: openRouterConfig.error,
      };
    }

    console.log(`Generating slide image with model: ${imageModel}`);

    const { dataUrl } = await generateOpenRouterImage({
      model: imageModel,
      prompt,
      aspectRatio: "16:9",
    });

    // Generate a filename
    const filename = `slide_${Date.now()}.png`;
    const permanentUrl = await saveGeneratedImage(
      dataUrlToBuffer(dataUrl),
      filename,
    );
    console.log(`Saved slide image to: ${permanentUrl}`);

    // Store in database
    const generatedImage = await db.generatedImage.create({
      data: {
        url: permanentUrl,
        prompt: prompt,
        userId: session.user.id,
      },
    });

    return {
      success: true,
      image: generatedImage,
    };
  } catch (error) {
    console.error("Error generating slide image:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate slide image",
    };
  }
}
