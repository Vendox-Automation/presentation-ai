import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getUserCustomThemes } from "@/app/_actions/presentation/theme-actions";
import {
  themes as builtInThemes,
  type ThemeProperties,
} from "@/lib/presentation/themes";
import { usePresentationState } from "@/states/presentation-state";

interface CustomTheme {
  id: string;
  name: string;
  description?: string;
  themeData: ThemeProperties;
  isPublic: boolean;
  logoUrl?: string;
  userId: string;
  user?: {
    name: string;
  };
  isFavorite?: boolean;
  likeCount?: number;
  isLiked?: boolean;
}

/**
 * Custom hook containing theme modal state and logic
 */
export function useThemeModalState(
  isOpen: boolean,
  initialPreviewTheme?: {
    id: string;
    data: ThemeProperties;
  },
) {
  const {
    theme: currentThemeId,
    customThemeData,
    setTheme,
  } = usePresentationState();

  const [activeTab, setActiveTab] = useState("allweone-themes");
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [selectedThemeData, setSelectedThemeData] =
    useState<ThemeProperties | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Initialize selected theme from current theme when opening
  useEffect(() => {
    if (!isOpen) {
      setHasInitialized(false);
      return;
    }

    if (hasInitialized) return;

    if (initialPreviewTheme) {
      setSelectedThemeId(initialPreviewTheme.id);
      setSelectedThemeData(initialPreviewTheme.data);
      setHasInitialized(true);
      return;
    }

    // Try to find the current theme in built-ins first
    if (
      typeof currentThemeId === "string" &&
      builtInThemes[currentThemeId as keyof typeof builtInThemes]
    ) {
      setSelectedThemeId(currentThemeId);
      setSelectedThemeData(
        builtInThemes[currentThemeId as keyof typeof builtInThemes],
      );
    } else if (currentThemeId === "auto" && customThemeData) {
      setSelectedThemeId(currentThemeId);
      setSelectedThemeData(customThemeData);
    } else {
      const keys = Object.keys(builtInThemes);
      if (keys.length > 0) {
        const firstKey = keys[0]!;
        setSelectedThemeId(firstKey);
        setSelectedThemeData(
          builtInThemes[firstKey as keyof typeof builtInThemes],
        );
      }
    }
    setHasInitialized(true);
  }, [
    isOpen,
    hasInitialized,
    currentThemeId,
    customThemeData,
    initialPreviewTheme,
  ]);

  // Fetch user themes with React Query
  const { data: userThemes = [], isLoading: isLoadingUserThemes } = useQuery({
    queryKey: ["userThemes"],
    queryFn: async () => {
      const result = await getUserCustomThemes();
      return result.success ? (result.themes as CustomTheme[]) : [];
    },
    enabled: isOpen,
  });

  const handlePreviewTheme = (id: string, theme: ThemeProperties) => {
    setSelectedThemeId(id);
    setSelectedThemeData(theme);
  };

  const handleApplyTheme = () => {
    if (selectedThemeId && selectedThemeData) {
      setTheme(
        selectedThemeId,
        builtInThemes[selectedThemeId as keyof typeof builtInThemes]
          ? undefined
          : selectedThemeData,
      );
    }
  };

  return {
    activeTab,
    setActiveTab,
    selectedThemeId,
    selectedThemeData,
    userThemes,
    isLoadingUserThemes,
    handlePreviewTheme,
    handleApplyTheme,
  };
}
