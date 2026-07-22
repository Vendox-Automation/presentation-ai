import { env } from "@/env";
import { createLogger } from "@/lib/observability/logger";
import { ChatOpenAI } from "@langchain/openai";

const modelLogger = createLogger("model-picker");
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL_ID = "openai/gpt-4o-mini";

/**
 * All text generation goes through OpenRouter, which exposes an
 * OpenAI-compatible Chat Completions API. `modelProviderOrModel` is kept as
 * the first argument for call-site compatibility; only its value as a model
 * id is used, since OpenRouter is the sole provider.
 */
function resolveModelId(modelProviderOrModel: string, modelId?: string): string {
  const candidate = modelId || modelProviderOrModel;
  return candidate?.trim() || DEFAULT_MODEL_ID;
}

export function assertModelIsConfigured(
  modelProviderOrModel: string,
  modelId?: string,
) {
  const selectedModel = resolveModelId(modelProviderOrModel, modelId);

  if (!env.OPENROUTER_API_KEY?.trim()) {
    modelLogger.error("Model configuration failed", undefined, {
      provider: "openrouter",
      modelId: selectedModel,
      reason: "missing_openrouter_api_key",
    });
    throw new Error(
      `OPENROUTER_API_KEY is required when using the OpenRouter model "${selectedModel}".`,
    );
  }

  modelLogger.info("Model configuration validated", {
    provider: "openrouter",
    modelId: selectedModel,
  });
}

// eslint-disable-next-line @typescript-eslint/require-await
export async function ensureModelIsReady(
  _modelProviderOrModel: string,
  _modelId?: string,
) {
  // No-op: OpenRouter is a hosted API with nothing to warm up locally.
}

/**
 * Centralized model picker for LangChain-based presentation routes.
 * All text models are served through OpenRouter.
 */
export function modelPicker(modelProviderOrModel: string, modelId?: string) {
  const selectedModel = resolveModelId(modelProviderOrModel, modelId);

  modelLogger.info("Creating OpenRouter model client", {
    provider: "openrouter",
    modelId: selectedModel,
  });

  return new ChatOpenAI({
    model: selectedModel,
    apiKey: env.OPENROUTER_API_KEY,
    configuration: {
      baseURL: OPENROUTER_BASE_URL,
    },
  });
}
