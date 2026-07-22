"use server";

import { utapi } from "@/app/api/uploadthing/core";
import { env } from "@/env";
import { requireOptionalIntegration } from "@/lib/env/optional-integrations";
import { dataUrlToBuffer, generateOpenRouterImage } from "@/lib/openrouter-image";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { UTFile } from "uploadthing/server";

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

    // Create a UTFile from the generated image
    const utFile = new UTFile([new Uint8Array(dataUrlToBuffer(dataUrl))], filename);

    // Upload to UploadThing
    const uploadResult = await utapi.uploadFiles([utFile]);

    if (!uploadResult[0]?.data?.ufsUrl) {
      console.error("Upload error:", uploadResult[0]?.error);
      throw new Error("Failed to upload image to UploadThing");
    }

    const permanentUrl = uploadResult[0].data.ufsUrl;
    console.log(`Uploaded slide image to: ${permanentUrl}`);

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
