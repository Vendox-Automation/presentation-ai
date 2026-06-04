"use client";

import { useCompletion } from "@ai-sdk/react";
import { type PlateEditor } from "platejs/react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import { type TAntvInfographicElement } from "@/components/notebook/presentation/editor/plugins/antv-infographic-plugin";
import { findInfographicEntryById } from "@/hooks/presentation/infographic/findInfographicNode";
import {
  buildInfographicLayoutInstruction,
  getInfographicOrientationForSlideLayout,
} from "@/lib/presentation/infographic-layout";
import { useInfographicStreamingState } from "@/states/infographic-streaming-state";
import { usePresentationState } from "@/states/presentation-state";

type GenerationParams = {
  editor: PlateEditor;
  element: TAntvInfographicElement;
  setHasError: Dispatch<SetStateAction<boolean>>;
  canResumeLoadingGeneration?: boolean;
};

type GenerationTarget = {
  mode: "prompt" | "text";
  value: string;
};

type ActiveGenerationRequest = {
  elementId: string;
  requestKey: string;
  mode: GenerationTarget["mode"];
};

const DEFAULT_GENERATION_PROMPT = "Generate an infographic";

function hashGenerationInput(input: string): string {
  let hash = 0;

  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(36);
}

function resolveGenerationTarget(
  element: TAntvInfographicElement,
): GenerationTarget {
  const sourceText = element.sourceText?.trim();

  if (sourceText) {
    return { mode: "text", value: sourceText };
  }

  const generationPrompt = element.generationPrompt?.trim();

  if (generationPrompt) {
    return { mode: "prompt", value: generationPrompt };
  }

  return { mode: "prompt", value: DEFAULT_GENERATION_PROMPT };
}

export function useAntvInfographicGeneration({
  editor,
  element,
  setHasError,
  canResumeLoadingGeneration = false,
}: GenerationParams) {
  const [syntax, setSyntax] = useState<string>("");
  const isMountedRef = useRef(false);
  const activeRequestRef = useRef<ActiveGenerationRequest | null>(null);
  const elementId = typeof element.id === "string" ? element.id : "";
  const generationTarget = useMemo(
    () => resolveGenerationTarget(element),
    [element.generationPrompt, element.sourceText],
  );
  const generationRequestKey = useMemo(() => {
    if (!elementId) {
      return "";
    }

    return `${elementId}:${generationTarget.mode}:${
      element.slideLayoutType ?? "unspecified"
    }:${hashGenerationInput(generationTarget.value)}`;
  }, [
    element.slideLayoutType,
    elementId,
    generationTarget.mode,
    generationTarget.value,
  ]);
  const layoutInstruction = useMemo(
    () => buildInfographicLayoutInstruction(element.slideLayoutType),
    [element.slideLayoutType],
  );
  const requestedOrientation = useMemo(
    () => getInfographicOrientationForSlideLayout(element.slideLayoutType),
    [element.slideLayoutType],
  );
  const isInfographicComplete = useInfographicStreamingState((state) =>
    elementId ? state.completedInfographicIds[elementId] === true : false,
  );
  const isReadyToGenerate =
    generationTarget.mode === "text" ||
    isInfographicComplete ||
    canResumeLoadingGeneration;
  const hasStartedRequest = useInfographicStreamingState((state) =>
    generationRequestKey
      ? state.startedGenerationRequests[generationRequestKey] === true
      : false,
  );

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const updateInfographicNode = useCallback(
    (
      targetElementIds: string[],
      update: Partial<TAntvInfographicElement>,
    ): boolean => {
      const candidateIds = [...new Set(targetElementIds.filter(Boolean))];

      if (candidateIds.length === 0) {
        return false;
      }

      for (const candidateId of candidateIds) {
        const entry = findInfographicEntryById(editor, candidateId);
        const path = entry?.[1];

        if (!path) {
          continue;
        }

        editor.tf.setNodes(update, { at: path });

        // Ensure global state has the updated content for serialization
        const slideId = editor.id;
        if (slideId && typeof slideId === "string") {
          usePresentationState.getState().updateSlide(slideId, {
            content: editor.children,
          });
        }

        return true;
      }

      return false;
    },
    [editor],
  );

  const handleGenerationFinish = useCallback(
    (completion: string) => {
      const activeRequest = activeRequestRef.current;

      if (!activeRequest) {
        return;
      }

      if (isMountedRef.current) {
        setSyntax(completion);
        setHasError(false);
      }

      const didUpdateNode = updateInfographicNode(
        [activeRequest.elementId, elementId],
        {
          syntax: completion,
          isLoading: false,
        },
      );

      console.info("[infographic-api] generation response applied", {
        elementId: activeRequest.elementId,
        didUpdateNode,
        requestKey: activeRequest.requestKey,
        syntaxLength: completion.length,
      });

      if (!didUpdateNode && isMountedRef.current) {
        setHasError(true);
      }

    },
    [elementId, setHasError, updateInfographicNode],
  );

  const handleGenerationError = useCallback(() => {
    const activeRequest = activeRequestRef.current;

    if (!activeRequest) {
      return;
    }

    updateInfographicNode([activeRequest.elementId, elementId], {
      isLoading: false,
    });

    if (isMountedRef.current) {
      setHasError(true);
    }

  }, [elementId, setHasError, updateInfographicNode]);

  const {
    completion: syntaxFromPrompt,
    complete: startForPrompt,
    isLoading: isGeneratingFromPrompt,
  } = useCompletion({
    api: "/api/presentation/prompt-to-diagram",
    id: elementId ? `${elementId}:prompt-to-diagram` : undefined,
    onFinish(_prompt, completion) {
      handleGenerationFinish(completion);
    },
    onError() {
      handleGenerationError();
    },
  });

  const {
    completion: syntaxFromText,
    complete: startForText,
    isLoading: isGeneratingFromText,
  } = useCompletion({
    api: "/api/presentation/text-to-diagram",
    id: elementId ? `${elementId}:text-to-diagram` : undefined,
    onFinish(_prompt, completion) {
      handleGenerationFinish(completion);
    },
    onError() {
      handleGenerationError();
    },
  });

  const isGenerating = isGeneratingFromPrompt || isGeneratingFromText;

  useEffect(() => {
    if (element.isLoading) {
      setHasError(false);
      return;
    }

    activeRequestRef.current = null;
  }, [element.isLoading, setHasError]);

  useEffect(() => {
    if (!elementId || !generationRequestKey) {
      return;
    }

    if (
      !isMountedRef.current ||
      !element.isLoading ||
      element.syntax.trim().length > 0 ||
      !isReadyToGenerate ||
      isGenerating ||
      hasStartedRequest
    ) {
      return;
    }

    const didStartRequest = useInfographicStreamingState
      .getState()
      .tryStartGenerationRequest(generationRequestKey);

    if (!didStartRequest) {
      return;
    }

    activeRequestRef.current = {
      elementId,
      requestKey: generationRequestKey,
      mode: generationTarget.mode,
    };
    setSyntax("");
    setHasError(false);

    console.info("[infographic-api] starting generation request", {
      elementId,
      inputLength: generationTarget.value.length,
      mode: generationTarget.mode,
      requestKey: generationRequestKey,
    });

    if (generationTarget.mode === "text") {
      void startForText(generationTarget.value, {
        body: {
          slideLayoutType: element.slideLayoutType,
          requestedOrientation,
          layoutInstruction,
        },
      });
      return;
    }

    void startForPrompt(generationTarget.value, {
      body: {
        slideLayoutType: element.slideLayoutType,
        requestedOrientation,
        layoutInstruction,
      },
    });
  }, [
    element.isLoading,
    element.slideLayoutType,
    element.syntax,
    elementId,
    generationRequestKey,
    generationTarget.mode,
    generationTarget.value,
    isGenerating,
    isReadyToGenerate,
    layoutInstruction,
    requestedOrientation,
    hasStartedRequest,
    setHasError,
    startForPrompt,
    startForText,
  ]);

  useEffect(() => {
    if (!isMountedRef.current) {
      return;
    }

    if (activeRequestRef.current?.mode === "text") {
      if (syntaxFromText) {
        setSyntax(syntaxFromText);
      }

      return;
    }

    if (syntaxFromPrompt) {
      setSyntax(syntaxFromPrompt);
    }
  }, [syntaxFromPrompt, syntaxFromText]);

  return { syntax };
}
