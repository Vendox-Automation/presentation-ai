"use client";

import { createLogger } from "@/lib/observability/logger";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import { usePresentationState } from "@/states/presentation-state";
import { Bot } from "lucide-react";
import { useEffect, useRef } from "react";

const modelPickerLogger = createLogger("client:model-picker");

const MODELS_CACHE_KEY = "presentation-selected-model";

function getSavedModelId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = localStorage.getItem(MODELS_CACHE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as { modelId?: string };
    return parsed.modelId ?? null;
  } catch {
    return null;
  }
}

function saveModelId(modelId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      MODELS_CACHE_KEY,
      JSON.stringify({ modelProvider: "openrouter", modelId }),
    );
  } catch {
    // Ignore localStorage errors.
  }
}

// OpenRouter model slugs (provider/model). Browse the full catalog at
// https://openrouter.ai/models to add more.
const OPENROUTER_MODELS = [
  {
    id: "openai/gpt-4o-mini",
    label: "GPT-4o-mini",
    description: "Fast model for everyday presentation drafts",
  },
  {
    id: "openai/gpt-4o",
    label: "GPT-4o",
    description: "Balanced model for higher quality drafts",
  },
  {
    id: "openai/gpt-4.1-mini",
    label: "GPT-4.1-mini",
    description: "Efficient model for structured generation",
  },
  {
    id: "openai/gpt-4.1",
    label: "GPT-4.1",
    description: "Stronger model for complex presentations",
  },
  {
    id: "openai/gpt-5-mini",
    label: "GPT-5-mini",
    description: "Faster, cost-efficient GPT-5 model",
  },
  {
    id: "openai/gpt-5",
    label: "GPT-5",
    description: "Flagship GPT-5 reasoning model",
  },
  {
    id: "anthropic/claude-sonnet-4.5",
    label: "Claude Sonnet 4.5",
    description: "Anthropic's balanced model for structured writing",
  },
  {
    id: "google/gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    description: "Google's flagship reasoning model",
  },
  {
    id: "google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    description: "Fast, low-cost Google model",
  },
] as const;

function getModelOption(modelId: string) {
  return (
    OPENROUTER_MODELS.find((model) => model.id === modelId) ??
    OPENROUTER_MODELS[0]
  );
}

export function ModelPicker({
  shouldShowLabel = true,
}: {
  shouldShowLabel?: boolean;
}) {
  const { setModelProvider, modelId, setModelId } = usePresentationState();
  const hasRestoredFromStorage = useRef(false);

  useEffect(() => {
    if (!hasRestoredFromStorage.current) {
      const savedModelId = getSavedModelId();
      if (savedModelId) {
        modelPickerLogger.info("Restoring previously selected model", {
          modelId: savedModelId,
        });
        setModelProvider("openrouter");
        setModelId(savedModelId);
      }
      hasRestoredFromStorage.current = true;
    }
  }, [setModelId, setModelProvider]);

  const handleModelChange = (value: string) => {
    const selectedModel = getModelOption(value);
    modelPickerLogger.info("Selected OpenRouter model", {
      modelId: selectedModel.id,
    });
    setModelProvider("openrouter");
    setModelId(selectedModel.id);
    saveModelId(selectedModel.id);
  };

  const currentModel = getModelOption(modelId);

  return (
    <div className="min-w-0">
      {shouldShowLabel && (
        <label className="block text-xs font-medium text-muted-foreground">
          Text model
        </label>
      )}
      <Select value={currentModel.id} onValueChange={handleModelChange}>
        <SelectTrigger className="h-8 w-auto max-w-full gap-2 overflow-hidden rounded-full border-border bg-background px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-accent sm:h-9 sm:px-3.5 sm:text-sm">
          <div className="flex min-w-0 items-center gap-2">
            <Bot className="h-4 w-4 flex-shrink-0" />
            <span className="truncate text-sm">{currentModel.label}</span>
          </div>
        </SelectTrigger>
        <SelectContent className="w-80 max-w-[calc(100vw-1rem)]">
          <SelectGroup>
            <SelectLabel>OpenRouter Models</SelectLabel>
            {OPENROUTER_MODELS.map((model) => (
              <SelectItem
                key={model.id}
                value={model.id}
                className="overflow-hidden"
              >
                <div className="flex min-w-0 max-w-full items-center gap-3">
                  <Bot className="h-4 w-4 flex-shrink-0" />
                  <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <span className="truncate text-sm">{model.label}</span>
                    <span className="line-clamp-2 whitespace-normal break-words text-xs leading-snug text-muted-foreground">
                      {model.description}
                    </span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
