"use client";

import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp } from "lucide-react";
import Image from "next/image";
import React, { useEffect } from "react";

import { searchGoogleImages } from "@/app/_actions/apps/image-studio/google";
import {
  getTrendingPixabayImages,
  searchPixabayImages,
} from "@/app/_actions/apps/image-studio/pixabay";
import {
  getTrendingUnsplashImages,
  searchUnsplashImages,
  triggerUnsplashDownload,
} from "@/app/_actions/apps/image-studio/unsplash";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  usePresentationState,
  type PresentationStockImageProvider,
} from "@/states/presentation-state";

interface SharedImageSearchControlsProps {
  onImageSelect: (
    url: string,
    provider: PresentationStockImageProvider,
  ) => void;
  className?: string;
  initialQuery?: string;
  initialQueryKey?: string;
  disableTrendingFallback?: boolean;
}

type SearchResultImage = {
  url: string;
  thumb?: string;
  title?: string;
  author?: string;
  username?: string;
  downloadLocation?: string;
  link?: string;
  source?: string;
};

const PROVIDER_LABELS: Record<PresentationStockImageProvider, string> = {
  unsplash: "Unsplash",
  pixabay: "Pixabay",
  google: "Web Search",
};

export function SharedImageSearchControls({
  onImageSelect,
  className,
  initialQuery = "",
  initialQueryKey,
  disableTrendingFallback = false,
}: SharedImageSearchControlsProps) {
  const imageSearchState = usePresentationState((s) => s.imageSearchState);
  const setImageSearchState = usePresentationState(
    (s) => s.setImageSearchState,
  );

  const {
    mode = "unsplash",
    unsplashQuery = "",
    pixabayQuery = "",
    googleQuery = "",
  } = imageSearchState;

  const [selectedUrl, setSelectedUrl] = React.useState<string>("");

  // Seed all image providers with the page-specific query when the panel opens.
  useEffect(() => {
    const trimmedInitialQuery = initialQuery.trim();
    if (!trimmedInitialQuery) return;

    setImageSearchState({
      unsplashQuery: trimmedInitialQuery,
      pixabayQuery: trimmedInitialQuery,
      googleQuery: trimmedInitialQuery,
    });
  }, [initialQuery, initialQueryKey, setImageSearchState]);

  const unsplashQ = useQuery({
    queryKey: ["presentation-image", "unsplash", unsplashQuery],
    queryFn: async () => {
      const trimmedQuery = unsplashQuery.trim();
      if (!trimmedQuery) {
        const res = disableTrendingFallback
          ? null
          : await getTrendingUnsplashImages(30, 1);
        return res?.success && res.images
          ? res.images.map((i) => ({
              url: i.url,
              thumb: i.thumb,
              author: i.author,
              username: i.username,
              downloadLocation: i.downloadLocation,
              link: i.link,
            }))
          : [];
      }

      const res = await searchUnsplashImages(trimmedQuery, 30, 1);
      return res.success && res.images
        ? res.images.map((i) => ({
            url: i.url,
            thumb: i.thumb,
            author: i.author,
            username: i.username,
            downloadLocation: i.downloadLocation,
            link: i.link,
          }))
        : [];
    },
    enabled: mode === "unsplash",
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const pixabayQ = useQuery({
    queryKey: ["presentation-image", "pixabay", pixabayQuery],
    queryFn: async () => {
      const trimmedQuery = pixabayQuery.trim();
      if (!trimmedQuery) {
        const res = disableTrendingFallback
          ? null
          : await getTrendingPixabayImages();
        return res?.success && res.images
          ? res.images.map((i) => ({
              url: i.url,
              thumb: i.thumb,
              title: i.title,
              author: i.author,
              link: i.link,
            }))
          : [];
      }

      const res = await searchPixabayImages(trimmedQuery);
      return res.success && res.images
        ? res.images.map((i) => ({
            url: i.url,
            thumb: i.thumb,
            title: i.title,
            author: i.author,
            link: i.link,
          }))
        : [];
    },
    enabled: mode === "pixabay",
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const googleQ = useQuery({
    queryKey: ["presentation-image", "google", googleQuery],
    queryFn: async () => {
      if (!googleQuery.trim()) return [] as SearchResultImage[];
      const res = await searchGoogleImages(googleQuery);
      return res.success && res.images
        ? res.images.map((i) => ({
            url: i.url,
            thumb: i.thumb,
            title: i.title,
            source: i.source,
          }))
        : [];
    },
    enabled: !!googleQuery && mode === "google",
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const activeQuery =
    mode === "unsplash"
      ? unsplashQuery
      : mode === "pixabay"
        ? pixabayQuery
        : googleQuery;

  const activeResults =
    mode === "unsplash"
      ? unsplashQ.data
      : mode === "pixabay"
        ? pixabayQ.data
        : googleQ.data;

  const isFetching =
    unsplashQ.isFetching || pixabayQ.isFetching || googleQ.isFetching;

  const handleSearch = () => {
    if (mode === "unsplash") void unsplashQ.refetch();
    else if (mode === "pixabay") void pixabayQ.refetch();
    else void googleQ.refetch();
  };

  const handleShowTrending = () => {
    if (mode === "unsplash") {
      setImageSearchState({ unsplashQuery: "" });
      return;
    }
    if (mode === "pixabay") {
      setImageSearchState({ pixabayQuery: "" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className={cn("flex h-full flex-col gap-4", className)}>
      <Tabs
        value={mode}
        onValueChange={(v) =>
          setImageSearchState({ mode: v as PresentationStockImageProvider })
        }
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="unsplash">
            Unsplash
          </TabsTrigger>
          <TabsTrigger value="pixabay">
            Pixabay
          </TabsTrigger>
          <TabsTrigger value="google">
            Web
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder={
              mode === "unsplash"
                ? "Search high-res photos..."
                : mode === "pixabay"
                  ? "Search Pixabay Images..."
                  : "Search live web images..."
            }
            value={activeQuery}
            onChange={(e) =>
              mode === "unsplash"
                ? setImageSearchState({ unsplashQuery: e.target.value })
                : mode === "pixabay"
                  ? setImageSearchState({ pixabayQuery: e.target.value })
                  : setImageSearchState({ googleQuery: e.target.value })
            }
            onKeyDown={handleKeyDown}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch}>
          Search
        </Button>
        {!disableTrendingFallback &&
          (mode === "unsplash" || mode === "pixabay") &&
          activeQuery && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleShowTrending}
              title={`Show popular ${PROVIDER_LABELS[mode]} images`}
            >
              <TrendingUp className="size-4" />
            </Button>
          )}
      </div>

      {!disableTrendingFallback &&
        (mode === "unsplash" || mode === "pixabay") && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {activeQuery.trim() ? (
              <span>
                Results for &quot;
                <span className="font-medium">{activeQuery.trim()}</span>&quot;
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <TrendingUp className="size-3" />
                Popular {PROVIDER_LABELS[mode]} images
              </span>
            )}
          </div>
        )}

      <ScrollArea className="flex-1 rounded-md border bg-muted/30 p-2">
        <div className="min-h-full">
          {isFetching && (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-md" />
              ))}
            </div>
          )}

          {!isFetching && (
            <>
              {mode === "unsplash" &&
                Array.isArray(unsplashQ.data) &&
                unsplashQ.data.length > 0 && (
                  <div className="grid h-max grid-cols-3 gap-2">
                    {unsplashQ.data.map(
                      (r: {
                        url: string;
                        thumb?: string;
                        author?: string;
                        username?: string;
                        downloadLocation?: string;
                        link?: string;
                      }) => (
                        <div key={r.url} className="group relative">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUrl(r.url);
                              onImageSelect(r.url, "unsplash");
                              if (r.downloadLocation) {
                                void triggerUnsplashDownload(
                                  r.downloadLocation,
                                );
                              }
                            }}
                            className={cn(
                              "aspect-square w-full overflow-hidden rounded-md border transition-all hover:scale-[1.02] focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:outline-none",
                              selectedUrl === r.url
                                ? "border-primary ring-2 ring-primary ring-offset-1"
                                : "border-transparent hover:border-primary/50",
                            )}
                          >
                            <Image
                              unoptimized
                              width={400}
                              height={300}
                              src={r.thumb || r.url}
                              alt="unsplash"
                              className="size-full object-cover transition-opacity group-hover:opacity-90"
                              loading="lazy"
                            />
                            {selectedUrl === r.url && (
                              <div className="absolute inset-0 rounded-md ring-2 ring-primary ring-inset" />
                            )}
                          </button>
                          {/* Attribution Overlay */}
                          <div className="pointer-events-none absolute right-0 bottom-0 left-0 bg-black/60 p-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="pointer-events-auto">
                              Photo by{" "}
                              <a
                                href={`https://unsplash.com/@${r.username}?utm_source=your_app_name&utm_medium=referral`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-gray-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {r.author}
                              </a>{" "}
                              on{" "}
                              <a
                                href={`${r.link || "https://unsplash.com"}?utm_source=your_app_name&utm_medium=referral`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-gray-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Unsplash
                              </a>
                            </span>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}

              {mode === "pixabay" &&
                Array.isArray(pixabayQ.data) &&
                pixabayQ.data.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {pixabayQ.data.map(
                      (r: {
                        url: string;
                        thumb?: string;
                        title?: string;
                        author?: string;
                        link?: string;
                      }) => (
                        <div key={r.url} className="group relative">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUrl(r.url);
                              onImageSelect(r.url, "pixabay");
                            }}
                            className={cn(
                              "aspect-square w-full overflow-hidden rounded-md border transition-all hover:scale-[1.02] focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:outline-none",
                              selectedUrl === r.url
                                ? "border-primary ring-2 ring-primary ring-offset-1"
                                : "border-transparent hover:border-primary/50",
                            )}
                            title={r.title}
                          >
                            <Image
                              unoptimized
                              width={400}
                              height={300}
                              src={r.thumb || r.url}
                              alt={r.title || "pixabay image"}
                              className="size-full object-cover transition-opacity group-hover:opacity-90"
                              loading="lazy"
                            />
                            {selectedUrl === r.url && (
                              <div className="absolute inset-0 rounded-md ring-2 ring-primary ring-inset" />
                            )}
                          </button>
                          {/* Attribution Overlay */}
                          {r.author && (
                            <div className="pointer-events-none absolute right-0 bottom-0 left-0 bg-black/60 p-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                              <span className="pointer-events-auto">
                                Photo by {r.author} on{" "}
                                <a
                                  href={r.link || "https://pixabay.com"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:text-gray-200"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Pixabay
                                </a>
                              </span>
                            </div>
                          )}
                        </div>
                      ),
                    )}
                  </div>
                )}

              {mode === "google" &&
                Array.isArray(googleQ.data) &&
                googleQ.data.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {googleQ.data.map((r) => (
                      <div key={r.url} className="group relative">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUrl(r.url);
                            onImageSelect(r.url, "google");
                          }}
                          className={cn(
                            "aspect-square w-full overflow-hidden rounded-md border transition-all hover:scale-[1.02] focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:outline-none",
                            selectedUrl === r.url
                              ? "border-primary ring-2 ring-primary ring-offset-1"
                              : "border-transparent hover:border-primary/50",
                          )}
                          title={r.title}
                        >
                          <Image
                            unoptimized
                            width={400}
                            height={300}
                            src={r.thumb || r.url}
                            alt={r.title || "web search image"}
                            className="size-full object-cover transition-opacity group-hover:opacity-90"
                            loading="lazy"
                          />
                          {selectedUrl === r.url && (
                            <div className="absolute inset-0 rounded-md ring-2 ring-primary ring-inset" />
                          )}
                        </button>
                        {(r.title || r.source) && (
                          <div className="pointer-events-none absolute right-0 bottom-0 left-0 bg-black/60 p-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="line-clamp-2">
                              {r.title || "Web image"}
                              {r.source ? ` - ${r.source}` : ""}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              {/* Empty states */}
              {(!activeResults || activeResults.length === 0) &&
                !isFetching && (
                  <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
                    <p className="text-sm">
                      No {PROVIDER_LABELS[mode]} images found
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
