import "server-only";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { UTFile } from "uploadthing/server";
import { utapi } from "@/app/api/uploadthing/lib";
import { env } from "@/env";

const LOCAL_STORAGE_DIR = path.join(
  process.cwd(),
  "public",
  "generated-images",
);

/**
 * Persists a generated image buffer and returns a publicly reachable URL.
 * Uses UploadThing when configured; otherwise falls back to writing the
 * file under public/generated-images so local dev works without a token.
 */
export async function saveGeneratedImage(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  if (env.UPLOADTHING_TOKEN) {
    const utFile = new UTFile([new Uint8Array(buffer)], filename);
    const uploadResult = await utapi.uploadFiles([utFile]);
    const url = uploadResult[0]?.data?.ufsUrl;

    if (!url) {
      throw new Error("Failed to upload generated image");
    }

    return url;
  }

  await mkdir(LOCAL_STORAGE_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_STORAGE_DIR, filename), buffer);
  return `/generated-images/${filename}`;
}
