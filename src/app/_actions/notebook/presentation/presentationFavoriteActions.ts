"use server";

import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function addPresentationToFavorites(documentId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "Unauthorized" };
  }

  await db.favoriteDocument.upsert({
    where: {
      userId_documentId: {
        userId: session.user.id,
        documentId,
      },
    },
    update: {},
    create: {
      userId: session.user.id,
      documentId,
    },
  });

  return { success: true };
}

export async function removePresentationFromFavorites(documentId: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, message: "Unauthorized" };
  }

  await db.favoriteDocument.deleteMany({
    where: {
      userId: session.user.id,
      documentId,
    },
  });

  return { success: true };
}
