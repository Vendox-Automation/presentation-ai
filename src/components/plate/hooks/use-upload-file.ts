// @ts-nocheck
import * as React from "react";
import { toast } from "sonner";
import {
  type ClientUploadedFileData,
  type UploadFilesOptions,
} from "uploadthing/types";
import * as z from "zod";

import { type OurFileRouter } from "@/app/api/uploadthing/core";
import { useBaseDocumentFileContext } from "@/components/files/base-document-file-context";
import { useProjectEditorUploadContext } from "@/components/files/project-editor-upload-context";
import { uploadFiles } from "@/hooks/globals/useUploadthing";
import {
  editorUploadAttachmentPayloadSchema,
  type EditorUploadAttachmentPayload,
} from "@/lib/files/project-editor-upload";

export type UploadedFile<T = unknown> = ClientUploadedFileData<T>;

interface UseUploadFileProps extends Partial<
  Pick<
    UploadFilesOptions<OurFileRouter["editorUploader"]>,
    "headers" | "input" | "onUploadBegin" | "onUploadProgress" | "skipPolling"
  >
> {
  onUploadComplete?: (file: UploadedFile) => void;
  onUploadError?: (error: unknown) => void;
}

export function useUploadFile({
  onUploadComplete,
  onUploadError,
  ...props
}: UseUploadFileProps = {}) {
  const { baseDocumentId, baseDocumentType } = useBaseDocumentFileContext();
  const { projectAttachmentContext, onAttachmentCreated } =
    useProjectEditorUploadContext();
  const [uploadedFile, setUploadedFile] = React.useState<UploadedFile>();
  const [uploadingFile, setUploadingFile] = React.useState<File>();
  const [progress, setProgress] = React.useState<number>(0);
  const [isUploading, setIsUploading] = React.useState(false);

  async function uploadThing(file: File) {
    setIsUploading(true);
    setUploadingFile(file);

    try {
      const res = await uploadFiles("editorUploader", {
        ...props,
        input:
          props.input ||
          (projectAttachmentContext
            ? {
                projectAttachmentContext,
              }
            : baseDocumentId && baseDocumentType
              ? {
                  baseDocumentId,
                  baseDocumentType,
                }
              : {}),
        files: [file],
        onUploadProgress: ({ progress }) => {
          setProgress(Math.min(progress, 100));
        },
      });

      const nextUploadedFile = res[0];
      setUploadedFile(nextUploadedFile);

      const uploadedAttachment = getEditorUploadAttachmentPayload(
        nextUploadedFile?.serverData,
      );
      if (uploadedAttachment) {
        onAttachmentCreated?.(uploadedAttachment);
      }

      onUploadComplete?.(nextUploadedFile ?? ({} as UploadedFile));

      return nextUploadedFile;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      const message =
        errorMessage.length > 0
          ? errorMessage
          : "Something went wrong, please try again later.";

      toast.error(message);

      // Note: We don't call onUploadError here because we'll fall back to mock upload
      // The toast already notifies the user of the original error

      // Mock upload for unauthenticated users
      // toast.info('User not logged in. Mocking upload process.');
      const mockUploadedFile = {
        key: "mock-key-0",
        appUrl: `https://mock-app-url.com/${file.name}`,
        name: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
      } as UploadedFile;

      // Simulate upload progress
      let progress = 0;

      const simulateProgress = async () => {
        while (progress < 100) {
          await new Promise((resolve) => setTimeout(resolve, 50));
          progress += 2;
          setProgress(Math.min(progress, 100));
        }
      };

      await simulateProgress();

      setUploadedFile(mockUploadedFile);

      return mockUploadedFile;
    } finally {
      setProgress(0);
      setIsUploading(false);
      setUploadingFile(undefined);
    }
  }

  return {
    isUploading,
    progress,
    uploadedFile,
    uploadFile: uploadThing,
    uploadingFile,
  };
}

function getEditorUploadAttachmentPayload(
  serverData: unknown,
): EditorUploadAttachmentPayload | undefined {
  if (!serverData || typeof serverData !== "object") {
    return undefined;
  }

  const attachment = (serverData as { attachment?: unknown }).attachment;
  const parsedAttachment =
    editorUploadAttachmentPayloadSchema.safeParse(attachment);

  if (!parsedAttachment.success) {
    return undefined;
  }

  return parsedAttachment.data;
}

export function showErrorToast(error: unknown) {
  toast.error(getErrorMessage(error));
}

export function getErrorMessage(err: unknown) {
  const unknownError = "Something went wrong, please try again later.";

  if (err instanceof z.ZodError) {
    const errors = err.issues.map((issue) => {
      return issue.message;
    });

    return errors.join("\n");
  } else if (err instanceof Error) {
    return err.message;
  } else {
    return unknownError;
  }
}
