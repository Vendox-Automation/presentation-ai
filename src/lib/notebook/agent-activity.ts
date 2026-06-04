import { type UIMessage } from "ai";

import { isWebSearchToolName } from "@/lib/ai/tool-names";
import {
  getToolInputArgs,
  getToolName,
  getToolOutput,
  getToolState,
  isToolPart,
} from "@/lib/ai/uiMessageParts";

type NotebookAgentToolCallState = "call" | "partial-call" | "result";

export interface NotebookAgentToolCall {
  id: string;
  toolName: string;
  state: NotebookAgentToolCallState;
  args?: Record<string, unknown>;
  result?: unknown;
}

export interface NotebookAgentAttachmentContext {
  fileAssetId?: string;
  fileName: string | null;
  fileUrl: string;
  processingStatus?: string | null;
  ragId?: string | null;
}

export interface NotebookAgentSelectedChunk {
  chunkId: string;
  ragId?: string;
  slideNumber?: number | null;
  content?: string;
}

export const NOTEBOOK_AGENT_ACTIVITY_TOOL_NAMES = {
  USER_INPUT: "__agent.user_input",
  ASSISTANT_OUTPUT: "__agent.assistant_output",
  STEP_START: "__agent.step_start",
  SOURCE: "__agent.source",
  REASONING: "__agent.reasoning",
  DOCUMENT_CONTEXT: "__agent.document_context",
} as const;

export function isNotebookAgentActivityEvent(toolName: string): boolean {
  return toolName.startsWith("__agent.");
}

export function parseNotebookAgentToolResult(result: unknown): unknown {
  if (typeof result !== "string") {
    return result;
  }

  try {
    return JSON.parse(result) as unknown;
  } catch {
    return result;
  }
}

export function collectNotebookAgentToolCalls(
  messages: UIMessage[],
): NotebookAgentToolCall[] {
  const toolCallMap = new Map<string, NotebookAgentToolCall>();

  messages.forEach((message, messageIndex) => {
    message.parts?.forEach((part, partIndex) => {
      if (!isToolPart(part)) {
        return;
      }

      const state = getToolState(part);
      const toolCallId =
        part.toolCallId ?? `${getToolName(part)}-${messageIndex}-${partIndex}`;
      const existing = toolCallMap.get(toolCallId);

      if (existing?.state === "result" && state !== "result") {
        return;
      }

      const result = getToolOutput(part);
      const parsedResult =
        result === undefined
          ? existing?.result
          : parseNotebookAgentToolResult(result);

      toolCallMap.set(toolCallId, {
        id: toolCallId,
        toolName: getToolName(part),
        state,
        args: getToolInputArgs(part),
        result: parsedResult,
      });
    });
  });

  return Array.from(toolCallMap.values());
}

function isLikelyFileName(value: string): boolean {
  return /.+\.[a-z0-9]{2,8}$/i.test(value.trim());
}

function isLikelyOpaqueFileName(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  if (isLikelyFileName(trimmed)) {
    return false;
  }

  return trimmed.length >= 20;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getLikelyUploadedFileNames(
  toolCalls: NotebookAgentToolCall[],
): string[] {
  const fileNames: string[] = [];

  for (const call of toolCalls) {
    if (call.toolName !== NOTEBOOK_AGENT_ACTIVITY_TOOL_NAMES.USER_INPUT) {
      continue;
    }

    const parsed = parseNotebookAgentToolResult(call.result);
    if (!isRecord(parsed)) {
      continue;
    }

    const text = parsed.text;
    if (typeof text !== "string") {
      continue;
    }

    const normalized = text.trim();
    if (!isLikelyFileName(normalized)) {
      continue;
    }

    fileNames.push(normalized);
  }

  return fileNames;
}

export function withNotebookAgentDocumentContext(
  toolCalls: NotebookAgentToolCall[],
  attachments: NotebookAgentAttachmentContext[],
): NotebookAgentToolCall[] {
  if (attachments.length === 0) {
    return toolCalls;
  }

  const nextCalls = [...toolCalls];
  const existingIds = new Set(nextCalls.map((call) => call.id));
  const fallbackFileNames = getLikelyUploadedFileNames(toolCalls);
  let fallbackFileNameIndex = 0;

  for (const [attachmentIndex, attachment] of attachments.entries()) {
    const fileIdentity =
      attachment.ragId ??
      attachment.fileAssetId ??
      attachment.fileUrl ??
      attachment.fileName ??
      `attachment-${attachmentIndex}`;
    const id = `event-document-context-${fileIdentity}`;

    if (existingIds.has(id)) {
      continue;
    }

    const normalizedStoredFileName = attachment.fileName?.trim() ?? "";
    const shouldUseFallbackFileName =
      !normalizedStoredFileName ||
      normalizedStoredFileName === attachment.ragId ||
      isLikelyOpaqueFileName(normalizedStoredFileName);
    const fallbackFileName = shouldUseFallbackFileName
      ? fallbackFileNames[fallbackFileNameIndex]
      : undefined;

    if (fallbackFileName) {
      fallbackFileNameIndex += 1;
    }

    const displayFileName =
      fallbackFileName ??
      (shouldUseFallbackFileName ? "Document" : normalizedStoredFileName);

    nextCalls.push({
      id,
      toolName: NOTEBOOK_AGENT_ACTIVITY_TOOL_NAMES.DOCUMENT_CONTEXT,
      state: "result",
      args: {
        fileName: displayFileName,
      },
      result: {
        ragId: attachment.ragId ?? null,
        fileAssetId: attachment.fileAssetId ?? null,
        fileName: displayFileName,
        fileUrl: attachment.fileUrl,
        processingStatus: attachment.processingStatus ?? null,
      },
    });
    existingIds.add(id);
  }

  return nextCalls;
}

export type NotebookAgentSearchResult = {
  query: string;
  results: unknown[];
};

export function deriveNotebookAgentSearchResults(
  toolCalls: NotebookAgentToolCall[],
): {
  webSearchResults: NotebookAgentSearchResult[];
  documentSearchResults: NotebookAgentSearchResult[];
} {
  const webSearchResults: NotebookAgentSearchResult[] = [];
  const documentSearchResults: NotebookAgentSearchResult[] = [];

  for (const call of toolCalls) {
    if (call.state !== "result") {
      continue;
    }

    const parsed = parseNotebookAgentToolResult(call.result) as
      | { query?: string; results?: unknown[] }
      | undefined;

    const query =
      typeof call.args?.query === "string"
        ? call.args.query
        : typeof parsed?.query === "string"
          ? parsed.query
          : "Search";
    const results = Array.isArray(parsed?.results) ? parsed.results : [];

    if (call.toolName === "searchDocuments") {
      documentSearchResults.push({ query, results });
      continue;
    }

    if (isWebSearchToolName(call.toolName)) {
      webSearchResults.push({ query, results });
    }
  }

  return {
    webSearchResults,
    documentSearchResults,
  };
}
