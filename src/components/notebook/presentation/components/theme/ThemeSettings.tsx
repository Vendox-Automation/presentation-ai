import { ThemeCard } from "@/components/presentation/edit-panel/sections/theme/ThemeCard";
import { Button } from "@/components/ui/button";
import { ImageSourceSelector } from "@/components/ui/image-source-selector";
import { Label } from "@/components/ui/label";
import {
  isBuiltInPresentationTheme,
  PRESENTATION_AUTO_THEME_ID,
} from "@/lib/presentation/theme-resolution";
import { themes, type ThemeProperties } from "@/lib/presentation/themes";
import { usePresentationState } from "@/states/presentation-state";
import { CreateThemeModal } from "./create-theme/CreateThemeModal";
import { ThemeModal } from "./ThemeModal";

const MAX_VISIBLE_THEMES = 9;

export function ThemeSettings() {
  const {
    theme,
    generatedThemeData,
    customThemeData,
    setTheme,
    imageModel,
    setImageModel,
    imageSource,
    setImageSource,
    stockImageProvider,
    setStockImageProvider,
  } = usePresentationState();

  const themeDataToUse = customThemeData ?? generatedThemeData;
  const autoThemeOption: [string, ThemeProperties][] = themeDataToUse
    ? [
        [
          theme !== "auto" && !themes[theme as keyof typeof themes]
            ? theme
            : PRESENTATION_AUTO_THEME_ID,
          {
            ...themeDataToUse,
            name: themeDataToUse.name || "Custom Theme",
            description:
              themeDataToUse.description || "Custom presentation theme",
          },
        ],
      ]
    : [];

  const visibleThemes = [...autoThemeOption, ...Object.entries(themes)].slice(
    0,
    MAX_VISIBLE_THEMES,
  );

  return (
    <div className="mb-32! space-y-5 rounded-2xl border border-border/60 bg-muted/35 p-4 sm:p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Customize Theme</h2>
        <p className="text-sm text-muted-foreground">
          Pick a visual direction and image source before rendering slides.
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-medium">Theme & Layout</Label>
            <div className="flex items-center gap-2">
              <ThemeModal>
                <Button
                  variant="link"
                  className="h-auto p-0 text-sm font-medium whitespace-nowrap"
                >
                  More Themes
                </Button>
              </ThemeModal>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {visibleThemes.map(([key, themeOption]) => (
              <div key={key} className="h-44">
                <ThemeCard
                  theme={themeOption}
                  themeId={key}
                  isSelected={theme === key}
                  showEllipsis={false}
                  showFavoriteButton={false}
                  personalizeLabel="Personalize"
                  onSelect={() =>
                    setTheme(
                      key,
                      isBuiltInPresentationTheme(key) ? undefined : themeOption,
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <ImageSourceSelector
          imageSource={imageSource}
          imageModel={imageModel}
          stockImageProvider={stockImageProvider}
          onImageSourceChange={setImageSource}
          onImageModelChange={setImageModel}
          onStockImageProviderChange={setStockImageProvider}
          className="space-y-4"
          showLabel={true}
        />
      </div>

      <CreateThemeModal previewMode="test-only" />
    </div>
  );
}
