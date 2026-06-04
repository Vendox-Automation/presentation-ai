"use client";

import { useMemo } from "react";
import { useWatch, type Control } from "react-hook-form";

import { type PreviewTab } from "@/components/notebook/presentation/components/theme/create-theme/create-theme-types";
import { testSlides } from "@/components/notebook/presentation/components/theme/create-theme/test-slide";
import { type ThemeFormValues } from "@/components/notebook/presentation/components/theme/types";
import { type ThemeProperties } from "@/lib/presentation/themes";
import { type PlateSlide } from "../../../utils/parser";

interface UsePreviewDataProps {
  control: Control<ThemeFormValues>;
  previewTab: PreviewTab;
  currentSlides: PlateSlide[];
}

export function usePreviewData({
  control,
  previewTab,
  currentSlides,
}: UsePreviewDataProps) {
  // Use useWatch to properly subscribe to form changes
  const values = useWatch({ control });

  const previewThemeData: ThemeProperties = useMemo(
    () =>
      ({
        name: values.name || "Preview Theme",
        description: values.description || "",
        colors: values.colors,
        fonts: values.fonts as ThemeProperties["fonts"],
        borderRadius: values.borderRadius,
        transitions: values.transitions,
        shadows: values.shadows,
        background: values.background,
        mode: values.mode ?? "light",
      }) as ThemeProperties,
    [JSON.stringify(values)],
  );

  const slidesToDisplay = useMemo(() => {
    if (previewTab === "test") {
      return testSlides;
    }
    return currentSlides.length > 0 ? currentSlides : testSlides;
  }, [previewTab, currentSlides]);

  return {
    previewThemeData,
    slidesToDisplay,
  };
}
