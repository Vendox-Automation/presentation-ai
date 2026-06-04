"use server";

import { z } from "zod";

import { auth } from "@/server/auth";
import { db } from "@/server/db";

const uploadedImagesInputSchema = z.object({
  limit: z.number().int().min(1).max(60).default(30),
  page: z.number().int().min(1).default(1),
});

export async function getUploadedImages(input?: {
  limit?: number;
  page?: number;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { limit, page } = uploadedImagesInputSchema.parse(input ?? {});

  const images = await db.fileAsset.findMany({
    where: {
      userId,
      deletedAt: null,
      mimeType: {
        startsWith: "image/",
      },
      visibility: "VISIBLE",
    },
    select: {
      id: true,
      name: true,
      url: true,
      mimeType: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  return images.map((image) => ({
    ...image,
    createdAt: image.createdAt.toISOString(),
  }));
}
