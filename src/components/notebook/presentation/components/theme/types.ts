import {
  type ThemeColors,
  type ThemeProperties,
  type Themes,
} from "@/lib/presentation/themes";

// Form values for creating/editing a theme
export type ThemeFormValues = {
  isPublic: boolean;
  themeBase: Themes | "blank";
} & ThemeProperties;

// Color key type for theme colors
export type ColorKey = keyof ThemeColors;

export interface CustomTheme {
  id: string;
  name: string;
  description: string | null;
  themeData: ThemeProperties;
  baseThemeData?: ThemeProperties;
  isPublic: boolean;
  isAdmin?: boolean;
  logoUrl: string | null;
  userId: string;
  user?: {
    name: string | null;
  };
  likeCount?: number;
  isLiked?: boolean;
  isFavorite?: boolean;
}
