"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Clipboard,
  Edit,
  LayoutGrid,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PlateController } from "platejs/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import {
  clonePresentationTemplate,
  deletePresentationTemplate,
  fetchPresentationTemplates,
} from "@/app/_actions/notebook/presentation/presentationTemplateActions";
import { ThemeBackground } from "@/components/notebook/presentation/components/theme/ThemeBackground";
import { type PlateSlide } from "@/components/notebook/presentation/utils/parser";
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaContent,
  CredenzaFooter,
  CredenzaHeader,
  CredenzaTitle,
} from "@/components/ui/credenza";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type ThemeName,
  type ThemeProperties,
} from "@/lib/presentation/themes";
import { usePresentationState } from "@/states/presentation-state";

// Dynamically import the static editor component to avoid bundling it on dashboard initial load
const StaticPresentationEditor = dynamic(
  () =>
    import("@/components/notebook/presentation/editor/presentation-editor-static"),
  {
    loading: () => (
      <div className="w-137.5 aspect-video flex items-center justify-center bg-muted rounded-xl border border-border animate-pulse">
        <Sparkles className="size-6 text-muted-foreground/30 animate-spin" />
      </div>
    ),
    ssr: false,
  },
);

interface PresentationTemplatesProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemplateId?: string | null;
}

interface TemplateItem {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  content: unknown;
}

// Local scaled preview slide component using ResizeObserver
function ScaledTemplateSlide({ slide }: { slide: PlateSlide }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [scaledHeight, setScaledHeight] = useState<number | undefined>(
    undefined,
  );
  const scale = 0.75; // Increased scale to fit nicely in the bigger modal
  const slideWidth = 1000;

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const updateHeight = () => {
      const height = el.scrollHeight;
      setScaledHeight(height * scale);
    };

    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    updateHeight();

    return () => observer.disconnect();
  }, [scale]);

  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-(--presentation-background) shadow-xs hover:shadow-md transition-shadow duration-200"
      style={{
        width: `${slideWidth * scale}px`,
        height: scaledHeight ? `${scaledHeight}px` : "auto",
      }}
    >
      <div
        ref={contentRef}
        style={{
          width: `${slideWidth}px`,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <StaticPresentationEditor initialContent={slide} id={slide.id} />
      </div>
    </div>
  );
}

export function PresentationTemplates({
  isOpen,
  onClose,
  initialTemplateId,
}: PresentationTemplatesProps) {
  const { setSelectedDbTemplate, setCurrentPresentation } =
    usePresentationState();
  const router = useRouter();
  const { push } = router;
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(
    null,
  );
  const isTemplatePreviewOnly = Boolean(initialTemplateId);

  // Fetch templates
  const { data: templatesData, isLoading } = useQuery({
    queryKey: ["presentationTemplates"],
    queryFn: async () => {
      const result = await fetchPresentationTemplates();
      return result;
    },
    enabled: isOpen,
  });

  // Automatically select template for preview when initialTemplateId is passed
  useEffect(() => {
    if (isOpen && initialTemplateId && templatesData?.templates) {
      const match = templatesData.templates.find(
        (t) => t.id === initialTemplateId,
      ) as TemplateItem | undefined;
      if (match) {
        setSelectedTemplate(match);
      }
    }
  }, [isOpen, initialTemplateId, templatesData]);

  // Reset selected template view on modal close
  useEffect(() => {
    if (!isOpen) {
      setSelectedTemplate(null);
    }
  }, [isOpen]);

  // Clone template mutation (Edit Copy)
  const cloneTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return clonePresentationTemplate(templateId);
    },
    onSuccess: (data) => {
      if (data.success && data.presentation) {
        setCurrentPresentation(data.presentation.id, data.presentation.title);
        toast.success("Template cloned successfully");
        onClose();
        // Navigate directly to the presentation editor
        push(`/presentation/${data.presentation.id}`);
      } else {
        toast.error(data.message || "Failed to clone template");
      }
    },
    onError: (error) => {
      console.error("Error cloning template:", error);
      toast.error("Failed to clone template");
    },
  });

  const handleEditCopy = (templateId: string) => {
    cloneTemplateMutation.mutate(templateId);
  };

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return deletePresentationTemplate(templateId);
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        toast.success("Template deleted successfully");
        if (selectedTemplate?.id === variables) {
          setSelectedTemplate(null);
        }
        queryClient.invalidateQueries({ queryKey: ["presentationTemplates"] });
      } else {
        toast.error(data.message || "Failed to delete template");
      }
    },
    onError: (error) => {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    },
  });

  const handleDeleteTemplate = (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this template?")) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const handleUseTemplate = (template: TemplateItem) => {
    const typedContent = template.content as {
      slides?: unknown[];
      theme?: string;
      customization?: {
        themeData?: ThemeProperties;
        generatedThemeData?: ThemeProperties;
      } | null;
    } | null;
    if (!typedContent?.slides || !Array.isArray(typedContent.slides)) {
      toast.error("Template does not have valid slide content.");
      return;
    }

    setSelectedDbTemplate({
      id: template.id,
      title: template.title,
      slides: typedContent.slides as unknown as PlateSlide[],
    });

    const customData =
      typedContent.customization?.themeData ||
      typedContent.customization?.generatedThemeData;

    if (typedContent.theme || customData) {
      usePresentationState
        .getState()
        .setTheme(typedContent.theme || "mystique", customData || null);

      if (typedContent.theme === "auto" && customData) {
        usePresentationState.getState().setGeneratedThemeData(customData);
      }
    }

    toast.success("Template applied to creation box");
    onClose();
  };

  const typedContent = selectedTemplate?.content as {
    slides?: unknown[];
    theme?: string;
    customization?: {
      themeData?: ThemeProperties;
      generatedThemeData?: ThemeProperties;
    } | null;
  } | null;
  const slides = (typedContent?.slides || []) as PlateSlide[];
  const templateTheme = typedContent?.theme as ThemeName | undefined;
  const templateThemeData =
    typedContent?.customization?.themeData ||
    typedContent?.customization?.generatedThemeData;

  return (
    <Credenza open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <CredenzaContent className="max-h-[90dvh] flex flex-col overflow-hidden sm:max-w-6xl p-0">
        <CredenzaHeader className="p-6 border-b border-border">
          {selectedTemplate ? (
            <div className="flex flex-col gap-2">
              {!isTemplatePreviewOnly && (
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="size-3.5" />
                  <span>Back to Templates</span>
                </button>
              )}
              <CredenzaTitle className="text-xl font-bold truncate">
                {selectedTemplate.title}
              </CredenzaTitle>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-[#052b5e] dark:text-primary">
                <LayoutGrid className="size-5" />
                <CredenzaTitle className="text-lg font-bold">
                  Explore templates
                </CredenzaTitle>
              </div>
              <p className="text-sm text-muted-foreground">
                Professionally designed templates to help you get started
                quickly
              </p>
            </div>
          )}
        </CredenzaHeader>

        <div className="flex-1 overflow-y-auto min-h-0 relative bg-muted/5">
          {isLoading ? (
            isTemplatePreviewOnly ? (
              <div className="flex min-h-96 items-center justify-center p-6">
                <Skeleton className="aspect-video w-full max-w-3xl rounded-xl" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 md:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-card p-0 shadow-xs overflow-hidden"
                  >
                    <Skeleton className="aspect-video w-full rounded-none" />
                    <div className="p-4 flex flex-col gap-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : selectedTemplate ? (
            <div className="flex flex-col min-h-full">
              {slides.length > 0 ? (
                <PlateController>
                  <ThemeBackground
                    themeOverride={templateTheme || "mystique"}
                    themeDataOverride={templateThemeData}
                    suppressThemeUpdates={true}
                    className="flex flex-col items-center justify-start min-h-full flex-1"
                  >
                    <div className="flex flex-col items-center gap-10 w-full px-4 sm:px-12 py-10">
                      {selectedTemplate.description && (
                        <div className="max-w-3xl text-center text-foreground font-medium text-sm leading-relaxed px-6 py-4 bg-background/80 backdrop-blur-md rounded-2xl border border-border shadow-sm">
                          {selectedTemplate.description}
                        </div>
                      )}
                      {slides.map((slide, index) => (
                        <div
                          key={slide.id || index}
                          className="relative flex flex-col items-center w-full max-w-200 overflow-hidden sm:overflow-visible"
                        >
                          <span className="absolute -left-2 sm:-left-14 top-4 text-xs font-bold text-muted-foreground bg-background rounded-full border border-border size-8 flex items-center justify-center shadow-sm z-10">
                            {index + 1}
                          </span>
                          <div className="w-full overflow-x-auto scrollbar-none flex justify-center pb-4">
                            <ScaledTemplateSlide slide={slide} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ThemeBackground>
                </PlateController>
              ) : (
                <div className="flex flex-1 w-full items-center justify-center h-64">
                  <Sparkles className="size-16 text-muted-foreground/30 animate-pulse" />
                </div>
              )}
            </div>
          ) : isTemplatePreviewOnly ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Sparkles className="size-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                Template preview unavailable
              </h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                This template could not be loaded for preview.
              </p>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : templatesData?.templates && templatesData.templates.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 md:grid-cols-3">
              {templatesData.templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template as TemplateItem)}
                  className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md flex flex-col"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.currentTarget.click();
                    }
                  }}
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-muted shrink-0">
                    {template.thumbnailUrl ? (
                      <Image
                        src={template.thumbnailUrl}
                        alt={template.title}
                        className="size-full object-contain transition-all duration-300 group-hover:scale-105"
                        width={320}
                        height={180}
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Sparkles className="size-10 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {template.title}
                    </h3>
                    {template.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {template.description}
                      </p>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTemplate(template.id, e)}
                      disabled={deleteTemplateMutation.isPending}
                      className="absolute top-2 right-2 p-1.5 bg-background/80 hover:bg-destructive text-destructive hover:text-destructive-foreground rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-sm disabled:opacity-50"
                      title="Delete Template"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Sparkles className="size-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                No Templates Available
              </h3>
              <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                We&apos;re working on bringing you a collection of beautiful,
                professionally designed templates. Stay tuned!
              </p>
              <Button variant="outline" onClick={onClose}>
                Got it
              </Button>
            </div>
          )}
        </div>

        <CredenzaFooter className="p-4 border-t border-border flex flex-col-reverse sm:flex-row justify-end gap-2 shrink-0">
          {selectedTemplate ? (
            <>
              {isAdmin && (
                <Button
                  variant="destructive"
                  onClick={(e) => handleDeleteTemplate(selectedTemplate.id, e)}
                  disabled={deleteTemplateMutation.isPending}
                  className="w-full sm:w-auto mr-auto gap-2"
                >
                  <Trash2 className="size-4" />
                  <span>Delete Template</span>
                </Button>
              )}
              {!isTemplatePreviewOnly && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedTemplate(null)}
                  className="w-full sm:w-auto"
                >
                  Back to List
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => handleEditCopy(selectedTemplate.id)}
                disabled={cloneTemplateMutation.isPending}
                className="w-full sm:w-auto gap-2"
              >
                {cloneTemplateMutation.isPending ? (
                  <Sparkles className="size-4 animate-spin" />
                ) : (
                  <Edit className="size-4" />
                )}
                <span>Edit a copy</span>
              </Button>
              <Button
                onClick={() => handleUseTemplate(selectedTemplate)}
                className="w-full sm:w-auto gap-2"
              >
                <Clipboard className="size-4" />
                <span>Use for generation</span>
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto ml-auto"
            >
              Close
            </Button>
          )}
        </CredenzaFooter>
      </CredenzaContent>
    </Credenza>
  );
}
