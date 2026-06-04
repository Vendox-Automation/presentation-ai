"use client";

import { type InfographicOptions } from "@antv/infographic";
import { Network, X } from "lucide-react";
import { useEffect, useRef, useState, type SyntheticEvent } from "react";

import {
  PRESENTATION_PORTAL_CONTENT_CLASS,
  PRESENTATION_PORTAL_OVERLAY_CLASS,
} from "@/components/presentation/overlay-layers";
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaContent,
  CredenzaDescription,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import {
  buildInfographicDataFromParsed,
  parseInfographicTemplate,
  updateInfographicSyntaxWithParsedData,
  type InfographicPaletteThemeColors,
} from "../utils/infographic-utils";
import { InfographicDataEditor } from "./infographic-data-editor";
import { InfographicDataPreview } from "./infographic-data-editor/preview";
import { type EditableInfographicData } from "./infographic-data-editor/types";
import {
  createEditableInfographicData,
  toParsedInfographicData,
} from "./infographic-data-editor/utils";

const stopEditorEventPropagation = (event: SyntheticEvent) => {
  const targetElement = getEventTargetElement(event.target);

  if (targetElement?.closest(INFOGRAPHIC_PREVIEW_INTERACTIVE_SELECTOR)) {
    return;
  }

  event.stopPropagation();
};

const INFOGRAPHIC_PREVIEW_INTERACTIVE_SELECTOR =
  "[data-infographic-preview-interactive='true']";

function getEventTargetElement(target: EventTarget | null): Element | null {
  if (target instanceof Element) return target;
  if (target instanceof Node) return target.parentElement;

  return null;
}

interface InfographicDataEditorDialogProps {
  data?: Partial<InfographicOptions>;
  isDark: boolean;
  onApply: (update: {
    data: Partial<InfographicOptions>;
    syntax: string;
  }) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  syntax: string;
  themeColors: InfographicPaletteThemeColors | null;
}

export function InfographicDataEditorDialog({
  data,
  isDark,
  onApply,
  onOpenChange,
  open,
  syntax,
  themeColors,
}: InfographicDataEditorDialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [localData, setLocalData] = useState<EditableInfographicData>(() =>
    createEditableInfographicData({ options: data, syntax }),
  );

  useEffect(() => {
    if (!open) return;
    setLocalData((current) =>
      createEditableInfographicData({
        options: data,
        previousData: current,
        syntax,
      }),
    );
  }, [data, open, syntax]);

  const handleCancel = () => {
    setLocalData(createEditableInfographicData({ options: data, syntax }));
    onOpenChange(false);
  };

  const handleSave = () => {
    const parsed = toParsedInfographicData(localData);
    const nextSyntax = updateInfographicSyntaxWithParsedData(syntax, parsed);
    const nextInfographicData = buildInfographicDataFromParsed(parsed);
    const template =
      data?.template ?? parseInfographicTemplate(syntax) ?? undefined;

    onApply({
      syntax: nextSyntax,
      data: {
        ...(data ?? {}),
        template,
        data: nextInfographicData,
      },
    });
    onOpenChange(false);
  };

  return (
    <Credenza modal={false} open={open} onOpenChange={onOpenChange}>
      <CredenzaContent
        ref={contentRef}
        overlayClassName={PRESENTATION_PORTAL_OVERLAY_CLASS}
        shouldHaveClose={false}
        onPointerDown={stopEditorEventPropagation}
        onMouseDown={stopEditorEventPropagation}
        onClick={stopEditorEventPropagation}
        onKeyDown={stopEditorEventPropagation}
        onInteractOutside={(event) => {
          const target = getEventTargetElement(event.target);
          if (
            target?.closest(
              [
                ".antv-infographic-toolbar-floating",
                ".icon-picker-panel",
                "[data-radix-popper-content-wrapper]",
              ].join(", "),
            )
          ) {
            event.preventDefault();
          }
        }}
        className={`${PRESENTATION_PORTAL_CONTENT_CLASS} ignore-click-outside/toolbar pointer-events-auto flex h-[92dvh] max-h-[92dvh] w-screen max-w-none flex-col overflow-hidden rounded-t-xl p-0 sm:rounded-xl md:h-[calc(100dvh-3rem)] md:max-h-[calc(100dvh-3rem)] md:rounded-xl`}
      >
        <CredenzaHeader className="shrink-0 border-b px-4 py-3 sm:px-5 sm:py-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <CredenzaTitle className="flex items-center gap-2">
                <Network className="size-5" />
                Edit Infographic Data
              </CredenzaTitle>
              <CredenzaDescription className="line-clamp-2">
                Add, remove, reorder, and edit the data driving this
                infographic.
              </CredenzaDescription>
            </div>
            <Button
              variant="ghost"
              className="size-9 p-0"
              onClick={handleCancel}
              aria-label="Close infographic data editor"
            >
              <X className="size-4" />
            </Button>
          </div>
        </CredenzaHeader>

        <div className="grid min-h-0 flex-1 grid-rows-[minmax(220px,34dvh)_minmax(0,1fr)] overflow-hidden lg:grid-cols-[minmax(340px,0.95fr)_minmax(460px,1.05fr)] lg:grid-rows-none">
          <section className="min-h-0 border-b bg-muted/20 p-3 sm:p-4 lg:border-r lg:border-b-0 lg:p-5">
            <InfographicDataPreview
              data={localData}
              isDark={isDark}
              onDataChange={setLocalData}
              options={data}
              syntax={syntax}
              toolbarPortalContainerRef={contentRef}
              themeColors={themeColors}
            />
          </section>

          <section className="min-h-0 overflow-auto p-3 sm:p-4 lg:p-5">
            <InfographicDataEditor data={localData} onChange={setLocalData} />
          </section>
        </div>

        <CredenzaFooter className="shrink-0 border-t px-4 py-3 sm:px-5 sm:py-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
