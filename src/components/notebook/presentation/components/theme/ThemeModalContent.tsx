"use client";

import { X } from "lucide-react";

import { ThemeCardSkeleton } from "@/components/notebook/presentation/components/theme/ThemeCardSkeleton";
import { ThemeCard } from "@/components/presentation/edit-panel/sections/theme/ThemeCard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  themes as builtInThemes,
  type ThemeProperties,
} from "@/lib/presentation/themes";

const THEME_SKELETON_KEYS = [
  "theme-skeleton-1",
  "theme-skeleton-2",
  "theme-skeleton-3",
] as const;

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

interface ThemeModalContentProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  selectedThemeId: string | null;
  onPreviewTheme: (id: string, theme: ThemeProperties) => void;
  userThemes: CustomTheme[];
  isLoadingUserThemes: boolean;
  onApplyTheme: () => void;
  onClose: () => void;
}

/**
 * Left panel theme selection content with tabs and theme grids
 */
export function ThemeModalContent({
  activeTab,
  onTabChange,
  selectedThemeId,

  onPreviewTheme,
  userThemes,
  isLoadingUserThemes,
  onApplyTheme,
  onClose,
}: ThemeModalContentProps) {
  const hasUserThemes = userThemes.length > 0;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden border-border bg-background lg:basis-[40%] lg:border-r">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-2">
        <h2 className="p-4 text-lg font-semibold">Themes</h2>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            aria-label="Close theme modal"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <Tabs
        defaultValue="allweone-themes"
        value={activeTab}
        onValueChange={onTabChange}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="shrink-0 px-4 pt-2">
          <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger
              value="allweone-themes"
              className="rounded-none border-b-2 border-transparent px-0 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              ALLWEONE
            </TabsTrigger>
            <TabsTrigger
              value="explore"
              className="rounded-none border-b-2 border-transparent px-0 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              My themes
            </TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="min-h-0 flex-1 overflow-hidden">
          <TabsContent value="allweone-themes" className="m-0 p-4 pb-6">
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-2">
              {Object.entries(builtInThemes).map(([key, theme]) => (
                <div key={key} className="h-44">
                  <ThemeCard
                    themeId={key}
                    theme={theme}
                    isSelected={selectedThemeId === key}
                    onSelect={() => onPreviewTheme(key, theme)}
                    showEllipsis={false}
                    showFavoriteButton={false}
                    showInfo={true}
                  />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="explore" className="m-0 p-4 pb-6">
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  My Themes
                </h3>
                {isLoadingUserThemes ? (
                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-3">
                    {THEME_SKELETON_KEYS.map((key) => (
                      <ThemeCardSkeleton key={`user-${key}`} />
                    ))}
                  </div>
                ) : hasUserThemes ? (
                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-3">
                    {userThemes.map((item) => (
                      <div key={item.id} className="h-44">
                        <ThemeCard
                          themeId={item.id}
                          theme={item.themeData}
                          isSelected={selectedThemeId === item.id}
                          isFavorite={item.isFavorite}
                          likeCount={item.likeCount}
                          isLiked={item.isLiked}
                          isOwner={true}
                          isPublic={item.isPublic}
                          onSelect={() =>
                            onPreviewTheme(item.id, item.themeData)
                          }
                          showInfo={true}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-sm text-muted-foreground italic">
                    You haven&apos;t created any themes yet.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Apply Button */}
      <div className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-background/95 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur supports-backdrop-filter:bg-background/80">
        <Button
          onClick={onApplyTheme}
          className="w-full"
          disabled={!selectedThemeId}
        >
          Apply Theme
        </Button>
      </div>
    </div>
  );
}
