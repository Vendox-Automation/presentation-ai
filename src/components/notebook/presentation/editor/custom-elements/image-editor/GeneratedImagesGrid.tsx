"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import { useInView } from "react-intersection-observer";

import {
  getUserImages,
  type Image as GeneratedImage,
} from "@/app/_actions/apps/image-studio/fetch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const GENERATED_IMAGES_PAGE_SIZE = 30;

interface GeneratedImagesGridProps {
  onImageSelect: (image: GeneratedImage) => void;
}

export function GeneratedImagesGrid({
  onImageSelect,
}: GeneratedImagesGridProps) {
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["user-generated-images"],
      queryFn: ({ pageParam }) =>
        getUserImages({
          page: pageParam,
          limit: GENERATED_IMAGES_PAGE_SIZE,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === GENERATED_IMAGES_PAGE_SIZE
          ? allPages.length + 1
          : undefined,
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inView, isFetchingNextPage]);

  const generatedImages = data?.pages.flat() ?? [];
  const showEmptyState = !isLoading && generatedImages.length === 0;

  return (
    <ScrollArea className="-mx-2 flex-1 px-2">
      <div className="grid grid-cols-3 gap-2 pb-4">
        {generatedImages.map((image) => (
          <button
            key={image.id}
            type="button"
            onClick={() => onImageSelect(image)}
            className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/30 text-left outline-none transition hover:border-primary/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/30"
            title={image.prompt}
          >
            <Image
              unoptimized
              width={400}
              height={300}
              src={image.url}
              alt={image.prompt}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
            <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-black/60 px-2 py-1 text-[11px] leading-tight text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {image.prompt}
            </span>
          </button>
        ))}

        {(isLoading || isFetchingNextPage) &&
          Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="aspect-square rounded-lg" />
          ))}

        <div ref={ref} className="col-span-3 h-4" />

        {showEmptyState && (
          <div className="col-span-3 flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
            <Sparkles className="size-8" />
            <p className="text-sm">No generated images found.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
