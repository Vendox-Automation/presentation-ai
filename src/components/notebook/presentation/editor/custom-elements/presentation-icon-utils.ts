"use client";

import { type IconType } from "react-icons";

type IconModule = Record<string, IconType>;

type IconLibraryKey =
  | "fa"
  | "fi"
  | "ai"
  | "bs"
  | "bi"
  | "gi"
  | "hi"
  | "im"
  | "io"
  | "md"
  | "ri"
  | "si"
  | "ti"
  | "vsc"
  | "wi";

type SearchableIcon = {
  Component: IconType;
  name: string;
  normalizedKey: string;
  normalizedLabel: string;
};

export type ResolvedPresentationIcon = {
  Component: IconType;
  name: string;
};

export const DEFAULT_PRESENTATION_ICON = "FaHome";

const ICON_LIBRARY_LOADERS: Record<IconLibraryKey, () => Promise<IconModule>> =
  {
    fa: async () => (await import("react-icons/fa")) as unknown as IconModule,
    fi: async () => (await import("react-icons/fi")) as unknown as IconModule,
    ai: async () => (await import("react-icons/ai")) as unknown as IconModule,
    bs: async () => (await import("react-icons/bs")) as unknown as IconModule,
    bi: async () => (await import("react-icons/bi")) as unknown as IconModule,
    gi: async () => (await import("react-icons/gi")) as unknown as IconModule,
    hi: async () => (await import("react-icons/hi")) as unknown as IconModule,
    im: async () => (await import("react-icons/im")) as unknown as IconModule,
    io: async () => (await import("react-icons/io")) as unknown as IconModule,
    md: async () => (await import("react-icons/md")) as unknown as IconModule,
    ri: async () => (await import("react-icons/ri")) as unknown as IconModule,
    si: async () => (await import("react-icons/si")) as unknown as IconModule,
    ti: async () => (await import("react-icons/ti")) as unknown as IconModule,
    vsc: async () => (await import("react-icons/vsc")) as unknown as IconModule,
    wi: async () => (await import("react-icons/wi")) as unknown as IconModule,
  };

const ICON_LIBRARY_PREFIXES: ReadonlyArray<readonly [string, IconLibraryKey]> =
  [
    ["vsc", "vsc"],
    ["fa", "fa"],
    ["fi", "fi"],
    ["ai", "ai"],
    ["bs", "bs"],
    ["bi", "bi"],
    ["gi", "gi"],
    ["hi", "hi"],
    ["im", "im"],
    ["io", "io"],
    ["md", "md"],
    ["ri", "ri"],
    ["si", "si"],
    ["ti", "ti"],
    ["wi", "wi"],
  ];

const ICON_SEARCH_ORDER: ReadonlyArray<IconLibraryKey> = [
  "fa",
  "fi",
  "ai",
  "bs",
  "bi",
  "md",
  "ri",
  "si",
  "gi",
  "hi",
  "im",
  "io",
  "ti",
  "vsc",
  "wi",
];

const POPULAR_ICON_NAMES: ReadonlyArray<string> = [
  "FaHome",
  "FaUser",
  "FaCog",
  "FaSearch",
  "FaBell",
  "FaCalendar",
  "FaEnvelope",
  "FaHeart",
  "FaStar",
  "FaBookmark",
  "FaCheck",
  "FaTimes",
  "FaEdit",
  "FaTrash",
  "FaDownload",
  "FaUpload",
  "FaShare",
  "FaLink",
  "FaMapMarker",
  "FaClock",
  "FaCamera",
  "FaVideo",
  "FaMusic",
  "FaFile",
  "FaFolder",
  "FaComments",
  "FaThumbsUp",
  "FaPhone",
  "FaLock",
  "FaUserPlus",
];

const iconModuleCache = new Map<IconLibraryKey, Promise<IconModule>>();
const resolvedIconCache = new Map<
  string,
  Promise<ResolvedPresentationIcon | null>
>();
let iconSearchIndexPromise: Promise<SearchableIcon[]> | null = null;

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function stripLibraryPrefix(value: string) {
  const normalized = value.trim();
  const lowerValue = normalized.toLowerCase();

  for (const [prefix] of ICON_LIBRARY_PREFIXES) {
    if (lowerValue.startsWith(prefix)) {
      return normalized.slice(prefix.length);
    }
  }

  return normalized;
}

function normalizeForSearch(value: string) {
  return stripLibraryPrefix(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeSearchValue(value: string) {
  return normalizeForSearch(value).split(" ").filter(Boolean);
}

function getIconLibraryHint(iconName: string) {
  const normalizedName = iconName.trim().toLowerCase();

  for (const [prefix, libraryKey] of ICON_LIBRARY_PREFIXES) {
    if (normalizedName.startsWith(prefix)) {
      return libraryKey;
    }
  }

  return undefined;
}

async function loadIconModule(libraryKey: IconLibraryKey) {
  const cachedModule = iconModuleCache.get(libraryKey);

  if (cachedModule) {
    return cachedModule;
  }

  const nextModulePromise = ICON_LIBRARY_LOADERS[libraryKey]();
  iconModuleCache.set(libraryKey, nextModulePromise);
  return nextModulePromise;
}

async function buildIconSearchIndex() {
  const modules = await Promise.all(
    ICON_SEARCH_ORDER.map(async (libraryKey) => ({
      libraryKey,
      module: await loadIconModule(libraryKey),
    })),
  );

  return modules.flatMap(({ module }) =>
    Object.entries(module).map(([name, Component]) => ({
      Component,
      name,
      normalizedKey: name.toLowerCase(),
      normalizedLabel: normalizeForSearch(name),
    })),
  );
}

async function getIconSearchIndex() {
  iconSearchIndexPromise ??= buildIconSearchIndex();
  return iconSearchIndexPromise;
}

function scoreIconMatch(query: string, icon: SearchableIcon) {
  const normalizedQuery = normalizeForSearch(query);

  if (!normalizedQuery) {
    return 0;
  }

  if (icon.normalizedKey === query.toLowerCase()) {
    return 1000;
  }

  if (icon.normalizedLabel === normalizedQuery) {
    return 900;
  }

  if (icon.normalizedKey.startsWith(query.toLowerCase())) {
    return 850;
  }

  if (icon.normalizedLabel.startsWith(normalizedQuery)) {
    return 800;
  }

  const queryTokens = tokenizeSearchValue(query);
  const labelTokens = tokenizeSearchValue(icon.name);

  if (
    queryTokens.length > 0 &&
    queryTokens.every((token) =>
      labelTokens.some((labelToken) => labelToken.includes(token)),
    )
  ) {
    return 700 - Math.max(labelTokens.length - queryTokens.length, 0);
  }

  if (icon.normalizedKey.includes(query.toLowerCase())) {
    return 500;
  }

  if (icon.normalizedLabel.includes(normalizedQuery)) {
    return 450;
  }

  return 0;
}

async function findExactIconByName(iconName: string) {
  const hintedLibrary = getIconLibraryHint(iconName);
  const searchOrder = hintedLibrary
    ? [
        hintedLibrary,
        ...ICON_SEARCH_ORDER.filter((key) => key !== hintedLibrary),
      ]
    : [...ICON_SEARCH_ORDER];

  for (const libraryKey of searchOrder) {
    const iconModule = await loadIconModule(libraryKey);
    const exactIcon = iconModule[iconName];

    if (exactIcon) {
      return {
        name: iconName,
        Component: exactIcon,
      } satisfies ResolvedPresentationIcon;
    }

    const normalizedName = iconName.toLowerCase();
    const matchingName = Object.keys(iconModule).find(
      (candidateName) => candidateName.toLowerCase() === normalizedName,
    );

    if (matchingName) {
      return {
        name: matchingName,
        Component: iconModule[matchingName]!,
      } satisfies ResolvedPresentationIcon;
    }
  }

  return null;
}

export async function resolvePresentationIcon(iconName: string) {
  const normalizedName = normalizeWhitespace(iconName);

  if (!normalizedName) {
    return null;
  }

  const cachedIcon = resolvedIconCache.get(normalizedName);
  if (cachedIcon) return cachedIcon;

  const iconPromise = (async () => {
    const exactMatch = await findExactIconByName(normalizedName);

    if (exactMatch) {
      return exactMatch;
    }

    const fuzzyMatches = await searchPresentationIcons(normalizedName, 1);
    return fuzzyMatches[0] ?? null;
  })().catch((error: unknown) => {
    resolvedIconCache.delete(normalizedName);
    throw error;
  });

  resolvedIconCache.set(normalizedName, iconPromise);
  return iconPromise;
}

export async function searchPresentationIcons(
  query: string,
  limit = 60,
): Promise<ResolvedPresentationIcon[]> {
  const normalizedQuery = normalizeWhitespace(query);

  if (!normalizedQuery) {
    return getPopularPresentationIcons(limit);
  }

  const iconSearchIndex = await getIconSearchIndex();
  const dedupedMatches = new Map<
    string,
    { icon: ResolvedPresentationIcon; score: number }
  >();

  for (const icon of iconSearchIndex) {
    const score = scoreIconMatch(normalizedQuery, icon);

    if (score <= 0) {
      continue;
    }

    const existingMatch = dedupedMatches.get(icon.name);

    if (!existingMatch || score > existingMatch.score) {
      dedupedMatches.set(icon.name, {
        score,
        icon: {
          name: icon.name,
          Component: icon.Component,
        },
      });
    }
  }

  return [...dedupedMatches.values()]
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.icon.name.localeCompare(right.icon.name);
    })
    .slice(0, limit)
    .map(({ icon }) => icon);
}

export async function getPopularPresentationIcons(limit = 30) {
  const popularIcons = await Promise.all(
    POPULAR_ICON_NAMES.map((iconName) => resolvePresentationIcon(iconName)),
  );

  return popularIcons
    .filter((icon): icon is ResolvedPresentationIcon => icon !== null)
    .slice(0, limit);
}
