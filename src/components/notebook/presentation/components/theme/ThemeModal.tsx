"use client";

import { useState, type ReactNode } from "react";

import { ThemeModalContent } from "@/components/notebook/presentation/components/theme/ThemeModalContent";
import { ThemeModalPreview } from "@/components/notebook/presentation/components/theme/ThemeModalPreview";
import { useThemeModalState } from "@/components/notebook/presentation/components/theme/useThemeModalState";
import { Button } from "@/components/ui/button";
import {
  Credenza,
  CredenzaContent,
  CredenzaTitle,
  CredenzaTrigger,
} from "@/components/ui/credenza";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { type ThemeProperties } from "@/lib/presentation/themes";

interface ThemeModalProps {
  children?: ReactNode;
  initialPreviewTheme?: {
    id: string;
    data: ThemeProperties;
  };
}

/**
 * Theme selection modal with preview panel
 */
export function ThemeModal({ children, initialPreviewTheme }: ThemeModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    activeTab,
    setActiveTab,
    selectedThemeId,
    selectedThemeData,
    userThemes,
    isLoadingUserThemes,
    handlePreviewTheme,
    handleApplyTheme,
  } = useThemeModalState(isOpen, initialPreviewTheme);

  const onApplyTheme = () => {
    handleApplyTheme();
    setIsOpen(false);
  };

  return (
    <Credenza open={isOpen} onOpenChange={setIsOpen}>
      <CredenzaTrigger asChild>
        {children ? children : <Button variant="link">More Themes</Button>}
      </CredenzaTrigger>
      <CredenzaContent
        shouldHaveClose={false}
        className="flex h-[min(92dvh,56rem)] max-h-[calc(100dvh-1rem)] w-[min(calc(100vw-1rem),72rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0 md:w-[min(calc(100vw-2rem),72rem)]"
      >
        <VisuallyHidden>
          <CredenzaTitle>More Themes</CredenzaTitle>
        </VisuallyHidden>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Left Panel - Theme Selection */}
          <ThemeModalContent
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedThemeId={selectedThemeId}
            onPreviewTheme={handlePreviewTheme}
            userThemes={userThemes}
            isLoadingUserThemes={isLoadingUserThemes}
            onApplyTheme={onApplyTheme}
            onClose={() => setIsOpen(false)}
          />

          {/* Right Panel - Preview */}
          <ThemeModalPreview selectedThemeData={selectedThemeData} />
        </div>
      </CredenzaContent>
    </Credenza>
  );
}
