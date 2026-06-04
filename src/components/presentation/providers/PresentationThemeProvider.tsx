"use client";

import { useTheme as useGlobalTheme } from "next-themes";
import { createContext, use, useCallback, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface PresentationThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: Theme;
}

const PresentationThemeContext = createContext<
  PresentationThemeContextValue | undefined
>(undefined);

/**
 * Custom hook to access the presentation theme context.
 * This is a drop-in replacement for next-themes' useTheme within the presentation route.
 *
 * If used outside of a PresentationThemeProvider (e.g., globally under RootLayout),
 * it seamlessly falls back to using the global next-themes system, avoiding runtime errors.
 */
export function usePresentationTheme() {
  const context = use(PresentationThemeContext);
  const globalTheme = useGlobalTheme();

  if (context === undefined) {
    const theme = (globalTheme.theme === "dark" ? "dark" : "light") as Theme;
    const resolvedTheme = (
      globalTheme.resolvedTheme === "dark" ? "dark" : "light"
    ) as Theme;

    return {
      theme,
      setTheme: (newTheme: Theme) => {
        globalTheme.setTheme(newTheme);
      },
      resolvedTheme,
    };
  }
  return context;
}

/**
 * A custom theme provider for the presentation section.
 * This creates a completely isolated theme context that doesn't affect other browser tabs.
 *
 * Unlike the previous version, this provider:
 * - Does not use localStorage or listen to storage events, eliminating cross-tab flickering.
 * - Manages theme state completely in-memory per tab.
 * - Dynamically updates the global <html> element's dark class for the current tab only,
 *   ensuring portals (dialogs, dropdowns, etc.) receive the correct theme.
 * - Safely restores the original html element classes and color scheme when unmounted.
 */
export function PresentationThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey: _storageKey, // kept for backward compatibility (ignored/unused now)
  syncWithDefaultTheme = false,
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string | null;
  syncWithDefaultTheme?: boolean;
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);

  // Sync state if syncWithDefaultTheme is true and defaultTheme changes
  useEffect(() => {
    if (syncWithDefaultTheme) {
      setThemeState(defaultTheme);
    }
  }, [defaultTheme, syncWithDefaultTheme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
    },
    [],
  );

  // Capture original document classes and color scheme, and restore on unmount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = window.document.documentElement;
    const originalClass = root.className;
    const originalColorScheme = root.style.colorScheme;

    return () => {
      root.className = originalClass;
      root.style.colorScheme = originalColorScheme;
    };
  }, []);

  // Update HTML class and color-scheme for the current tab
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [theme]);

  const value: PresentationThemeContextValue = {
    theme,
    setTheme,
    resolvedTheme: theme,
  };

  return (
    <PresentationThemeContext.Provider value={value}>
      <PresentationThemeWrapper>{children}</PresentationThemeWrapper>
    </PresentationThemeContext.Provider>
  );
}

/**
 * Inner wrapper that applies the theme class to a div element.
 * This ensures Tailwind's dark: variants work correctly within the presentation.
 */
function PresentationThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = usePresentationTheme();
  return (
    <div
      className={
        theme === "dark"
          ? "dark bg-background text-foreground h-full w-full"
          : "bg-background text-foreground h-full w-full"
      }
    >
      {children}
    </div>
  );
}
