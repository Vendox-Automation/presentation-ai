"use client";

import {
  type Infographic,
  type InfographicOptions,
  type ParsedInfographicOptions,
} from "@antv/infographic";
import debounce from "lodash.debounce";
import { type PlateEditor } from "platejs/react";
import {
  useEffect,
  useMemo,
  type MutableRefObject,
  type RefObject,
} from "react";

import { type TAntvInfographicElement } from "@/components/notebook/presentation/editor/plugins/antv-infographic-plugin";
import { syncInfographicSyntaxWithData } from "@/components/notebook/presentation/editor/utils/infographic-utils";
import { findInfographicEntryById } from "@/hooks/presentation/infographic/findInfographicNode";
import {
  cloneSerializableOptions,
  getSerializableOptionsKey,
  pickSerializableOptions,
  toSerializableOptionsFromParsed,
} from "./infographic-options";

type MutationSyncParams = {
  infographicRef: RefObject<Infographic | null>;
  editor: PlateEditor;
  elementRef: RefObject<TAntvInfographicElement>;
  skipNextRenderRef?: MutableRefObject<boolean>;
  syntax: string;
};

export function useAntvInfographicMutationSync({
  infographicRef,
  editor,
  elementRef,
  skipNextRenderRef,
  syntax,
}: MutationSyncParams) {
  const debouncedSave = useMemo(
    () =>
      debounce((options: Partial<InfographicOptions>) => {
        const stableData = cloneSerializableOptions(options);
        let currentElement: TAntvInfographicElement | undefined;
        let path: ReturnType<typeof editor.api.findPath>;

        try {
          path = editor.api.findPath(elementRef.current);
          currentElement = elementRef.current;
        } catch {
          const elementId =
            typeof elementRef.current.id === "string"
              ? elementRef.current.id
              : "";
          const entry = findInfographicEntryById(editor, elementId);
          currentElement = entry?.[0];
          path = entry?.[1];
        }

        if (!path || !currentElement) {
          return;
        }

        const syncedSyntax = syncInfographicSyntaxWithData(
          currentElement.syntax ?? "",
          stableData,
        );
        const nextSyntax = syncedSyntax || currentElement.syntax;
        const currentDataKey = getSerializableOptionsKey(currentElement.data);
        const nextDataKey = getSerializableOptionsKey(stableData);

        if (
          currentDataKey === nextDataKey &&
          nextSyntax === currentElement.syntax
        ) {
          return;
        }

        const update: Partial<TAntvInfographicElement> = { data: stableData };

        if (nextSyntax !== currentElement.syntax) {
          update.syntax = nextSyntax;
        }

        if (skipNextRenderRef) {
          skipNextRenderRef.current = true;
        }

        editor.tf.setNodes(update, { at: path });
      }, 1000),
    [editor, elementRef, skipNextRenderRef],
  );

  // Cancel any pending debounced save when syntax changes externally
  // (e.g., template conversion). This prevents stale data from reverting the change.
  useEffect(() => {
    debouncedSave.cancel();
  }, [syntax, debouncedSave]);

  useEffect(() => {
    return () => {
      debouncedSave.flush();
      debouncedSave.cancel();
    };
  }, [debouncedSave]);

  useEffect(() => {
    const instance = infographicRef.current;
    if (!instance) return;

    const handleOptionsChange = () => {
      const internalEditor = (instance as unknown as { editor?: unknown })
        .editor as
        | {
            state?: { getOptions?: () => Partial<ParsedInfographicOptions> };
          }
        | undefined;
      const parsedOptions = internalEditor?.state?.getOptions?.();
      const options = parsedOptions
        ? toSerializableOptionsFromParsed(parsedOptions)
        : pickSerializableOptions(instance.getOptions());
      debouncedSave(options);
    };

    instance.on("options:change", handleOptionsChange);

    return () => {
      instance.off("options:change", handleOptionsChange);
    };
  }, [infographicRef, debouncedSave]);
}
