"use client";

import {
  BrushSelect,
  ClickSelect,
  DblClickEditText,
  DragCanvas,
  DragElement,
  HotkeyHistory,
  Infographic,
  ResetViewBox,
  ResizeElement,
  SelectHighlight,
  ZoomWheel,
  type IInteraction,
  type InfographicOptions,
  type IPlugin,
  type ParsedInfographicOptions,
} from "@antv/infographic";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import { InfographicFloatingToolbar } from "@/components/notebook/presentation/editor/custom-elements/infographic/InfographicFloatingToolbar";
import {
  enforceInfographicCardBackground,
  useInfographicCardBackground,
} from "@/components/notebook/presentation/editor/utils/infographic-card-background";
import {
  applyThemeToData,
  applyThemeToSyntax,
  parseInfographicTemplate,
  syncInfographicSyntaxWithData,
  updateInfographicSyntaxWithParsedData,
  type InfographicPaletteThemeColors,
} from "@/components/notebook/presentation/editor/utils/infographic-utils";
import { registerLucideIconLoader } from "@/hooks/presentation/infographic/infographic-icon-loader";
import {
  pickSerializableOptions,
  toSerializableOptionsFromParsed,
} from "@/hooks/presentation/infographic/infographic-options";
import {
  InfographicSelectionPlugin,
  type InfographicSelectionPayload,
} from "@/hooks/presentation/infographic/InfographicSelectionPlugin";
import { cn } from "@/lib/utils";
import { type EditableInfographicData } from "./types";
import {
  createEditableInfographicData,
  toInfographicOptionsData,
  toParsedInfographicData,
} from "./utils";

registerLucideIconLoader();

interface InfographicDataPreviewProps {
  data: EditableInfographicData;
  isDark: boolean;
  onDataChange: (data: EditableInfographicData) => void;
  options?: Partial<InfographicOptions>;
  toolbarPortalContainerRef?: RefObject<HTMLElement | null>;
  syntax: string;
  themeColors: InfographicPaletteThemeColors | null;
}

type PreviewState = "error" | "loading" | "ready";
const PREVIEW_DATA_DEBOUNCE_MS = 450;

type InfographicEditorInstance = {
  editor?: {
    state?: { getOptions?: () => Partial<ParsedInfographicOptions> };
  };
};

function buildPreviewPayload({
  data,
  isDark,
  options,
  syntax,
  themeColors,
}: InfographicDataPreviewProps): Partial<InfographicOptions> | string {
  const template = parseInfographicTemplate(syntax) ?? options?.template;
  const nextData = toInfographicOptionsData(data);

  if (options && Object.keys(options).length > 0) {
    return applyThemeToData(
      {
        ...options,
        template,
        data: nextData,
      },
      isDark,
      themeColors,
    );
  }

  const parsed = toParsedInfographicData(data);
  const nextSyntax = updateInfographicSyntaxWithParsedData(syntax, parsed);
  return applyThemeToSyntax(
    syncInfographicSyntaxWithData(nextSyntax, { data: nextData, template }),
    isDark,
    themeColors,
  );
}

export function InfographicDataPreview(props: InfographicDataPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const infographicRef = useRef<Infographic | null>(null);
  const frameRef = useRef<number | null>(null);
  const isRenderingRef = useRef(false);
  const skipNextRenderRef = useRef(false);
  const latestSyncPropsRef = useRef({
    data: props.data,
    onDataChange: props.onDataChange,
    syntax: props.syntax,
  });
  const [selectionPayload, setSelectionPayload] =
    useState<InfographicSelectionPayload | null>(null);
  const [previewState, setPreviewState] = useState<PreviewState>("loading");
  const [renderRevision, setRenderRevision] = useState(0);
  const [debouncedData, setDebouncedData] = useState(props.data);
  const cardBackgroundRefreshKey = `${props.isDark}:${props.themeColors?.cardBackground ?? ""}`;

  useInfographicCardBackground(containerRef, cardBackgroundRefreshKey);

  const payload = useMemo(
    () =>
      buildPreviewPayload({
        data: debouncedData,
        isDark: props.isDark,
        onDataChange: props.onDataChange,
        options: props.options,
        syntax: props.syntax,
        themeColors: props.themeColors,
      }),
    [
      debouncedData,
      props.isDark,
      props.onDataChange,
      props.options,
      props.syntax,
      props.themeColors,
    ],
  );

  const forcePreviewRender = () => {
    skipNextRenderRef.current = false;
    setRenderRevision((current) => current + 1);
  };

  useEffect(() => {
    latestSyncPropsRef.current = {
      data: props.data,
      onDataChange: props.onDataChange,
      syntax: props.syntax,
    };
  }, [props.data, props.onDataChange, props.syntax]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedData(props.data);
    }, PREVIEW_DATA_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [props.data]);

  useEffect(() => {
    if (!containerRef.current) return;
    setPreviewState("loading");

    if (!infographicRef.current) {
      const plugins: IPlugin[] = [
        new InfographicSelectionPlugin(setSelectionPayload),
        new ResizeElement(),
        new ResetViewBox(),
      ];

      const instance = new Infographic({
        container: containerRef.current,
        width: "100%",
        height: "100%",
        editable: true,
        plugins,
        interactions: [
          new DragCanvas({ trigger: ["Space"] }),
          new DblClickEditText(),
          new BrushSelect(),
          new ClickSelect(),
          new DragElement(),
          new HotkeyHistory(),
          new ZoomWheel(),
          new SelectHighlight(),
        ] satisfies IInteraction[],
      });

      const handleOptionsChange = () => {
        if (isRenderingRef.current) return;

        const parsedOptions = (
          instance as unknown as InfographicEditorInstance
        ).editor?.state?.getOptions?.();
        const nextOptions = parsedOptions
          ? toSerializableOptionsFromParsed(parsedOptions)
          : pickSerializableOptions(instance.getOptions());

        const syncProps = latestSyncPropsRef.current;
        skipNextRenderRef.current = true;
        syncProps.onDataChange(
          createEditableInfographicData({
            options: nextOptions,
            previousData: syncProps.data,
            syntax: syncProps.syntax,
          }),
        );
      };

      instance.on("options:change", handleOptionsChange);
      infographicRef.current = instance;
    }

    if (skipNextRenderRef.current) {
      skipNextRenderRef.current = false;
      setPreviewState("ready");
      return;
    }

    try {
      isRenderingRef.current = true;
      infographicRef.current.render(payload);
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        if (containerRef.current) {
          enforceInfographicCardBackground(containerRef.current);
        }
        isRenderingRef.current = false;
        setPreviewState("ready");
      });
    } catch (error) {
      isRenderingRef.current = false;
      console.error("Failed to render infographic preview:", error);
      setPreviewState("error");
    }

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [payload, renderRevision]);

  useEffect(() => {
    return () => {
      if (infographicRef.current) {
        infographicRef.current.destroy();
        infographicRef.current = null;
      }
    };
  }, []);

  return (
    <div
      className="relative h-full min-h-0 overflow-hidden rounded-lg border bg-background"
      data-infographic-preview-interactive="true"
    >
      {previewState === "loading" && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/70">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}
      {selectionPayload && (
        <InfographicFloatingToolbar
          onDataMutation={forcePreviewRender}
          payload={selectionPayload}
          portalContainer={props.toolbarPortalContainerRef?.current}
        />
      )}
      {previewState === "error" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
          Preview unavailable for this data shape.
        </div>
      )}
      <div
        ref={containerRef}
        className={cn(
          "h-full min-h-0 w-full p-4 transition-opacity",
          previewState === "ready" ? "opacity-100" : "opacity-30",
        )}
      />
    </div>
  );
}
