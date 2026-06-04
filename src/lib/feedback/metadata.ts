export const PRESENTATION_GENERATION_FEEDBACK_SOURCE =
  "presentation_generation";

export const GLOBAL_FEEDBACK_SOURCE = "global";

export type FeedbackMetadataValue = string | number | boolean | null;

export type FeedbackMetadataMap = Record<string, FeedbackMetadataValue>;

export type ParsedFeedbackMetadata = Partial<FeedbackMetadataMap> & {
  source?: string;
  reaction?: string;
  presentationId?: string;
  presentationTitle?: string;
  hasDetailedFeedback?: boolean;
};

export function parseFeedbackMetadata(
  metadata: string,
): ParsedFeedbackMetadata {
  try {
    const parsed = JSON.parse(metadata);

    if (!isFeedbackMetadataRecord(parsed)) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

export function getFeedbackSource(
  metadata: ParsedFeedbackMetadata,
):
  | typeof GLOBAL_FEEDBACK_SOURCE
  | typeof PRESENTATION_GENERATION_FEEDBACK_SOURCE {
  return metadata.source === PRESENTATION_GENERATION_FEEDBACK_SOURCE
    ? PRESENTATION_GENERATION_FEEDBACK_SOURCE
    : GLOBAL_FEEDBACK_SOURCE;
}

function isFeedbackMetadataRecord(
  value: unknown,
): value is ParsedFeedbackMetadata {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  return Object.values(value).every(isFeedbackMetadataValue);
}

function isFeedbackMetadataValue(
  value: unknown,
): value is FeedbackMetadataValue {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}
