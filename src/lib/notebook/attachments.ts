export type NotebookAttachment = {
  fileAssetId?: string;
  name: string;
  mimeType?: string;
  processingStatus?: string | null;
  ragId?: string | null;
  url: string;
};

export type NotebookAttachmentWithRagId = NotebookAttachment & {
  ragId?: string | null;
};

export type NotebookSelectedChunk = {
  chunkId: string;
  ragId: string;
  slideNumber?: number | null;
  content?: string;
};

export function getNotebookAttachmentId(
  attachment: NotebookAttachment,
): string {
  return attachment.fileAssetId ?? attachment.url;
}

export function getNotebookAttachmentSignature(
  attachments: NotebookAttachment[],
): string {
  return attachments.map(getNotebookAttachmentId).join(",");
}

export function getNotebookAttachmentRagId({
  attachment,
  attachments,
  extractorRagIds,
  index,
}: {
  attachment: NotebookAttachmentWithRagId;
  attachments: NotebookAttachmentWithRagId[];
  extractorRagIds: string[];
  index: number;
}): string | null {
  if (attachment.ragId) {
    return attachment.ragId;
  }

  if (extractorRagIds.length === attachments.length) {
    return extractorRagIds[index] ?? null;
  }

  return null;
}

export function mergeNotebookAttachments(
  attachments: NotebookAttachment[],
): NotebookAttachment[] {
  const attachmentsById = new Map<string, NotebookAttachment>();

  for (const attachment of attachments) {
    attachmentsById.set(getNotebookAttachmentId(attachment), attachment);
  }

  return [...attachmentsById.values()];
}

export function getNotebookAttachmentContext(
  attachments: NotebookAttachmentWithRagId[],
): {
  attachments: NotebookAttachment[];
  ragIds: string[];
  currentRagId: string | null;
} {
  const normalizedAttachments = attachments.map(
    ({ fileAssetId, name, mimeType, processingStatus, ragId, url }) => ({
      fileAssetId,
      name,
      mimeType,
      processingStatus,
      ragId,
      url,
    }),
  );
  const ragIds = attachments.flatMap((attachment) =>
    attachment.ragId ? [attachment.ragId] : [],
  );

  return {
    attachments: mergeNotebookAttachments(normalizedAttachments),
    ragIds,
    currentRagId: ragIds[0] ?? null,
  };
}

const IMAGE_EXTENSION_PATTERN =
  /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)(?:$|[?#])/i;
const _PDF_EXTENSION_PATTERN = /\.pdf(?:$|[?#])/i;

export function isNotebookImageAttachment(
  attachment: NotebookAttachment,
): boolean {
  if (attachment.mimeType?.startsWith("image/")) {
    return true;
  }

  if (IMAGE_EXTENSION_PATTERN.test(attachment.name)) {
    return true;
  }

  return IMAGE_EXTENSION_PATTERN.test(attachment.url);
}
