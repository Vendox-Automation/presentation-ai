"use client";

import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";
import { ScrollBar } from "./scroll-area";

type ScrollListVirtualItem<TItem> = {
  height: number;
  index: number;
  item: TItem;
  key: string;
  top: number;
};

export type ScrollListRange = {
  scrollTop: number;
  viewportHeight: number;
};

type PositionedScrollListItem<TItem> = ScrollListVirtualItem<TItem> & {
  bottom: number;
};

type ScrollListProps<TItem> = {
  className?: string;
  contentClassName?: string;
  contentStyle?: CSSProperties;
  gap?: number;
  getItemHeight: (item: TItem, index: number) => number;
  getItemKey: (item: TItem, index: number) => string;
  items: readonly TItem[];
  onRangeChange?: (range: ScrollListRange) => void;
  overscan?: number;
  paddingBottom?: number;
  renderItem: (virtualItem: ScrollListVirtualItem<TItem>) => ReactNode;
};

function getPositionedItems<TItem>(
  items: readonly TItem[],
  getItemHeight: (item: TItem, index: number) => number,
  getItemKey: (item: TItem, index: number) => string,
  gap: number,
): {
  positionedItems: PositionedScrollListItem<TItem>[];
  totalMeasuredHeight: number;
} {
  const positionedItems: PositionedScrollListItem<TItem>[] = [];
  let top = 0;

  items.forEach((item, index) => {
    const height = getItemHeight(item, index);
    const key = getItemKey(item, index);
    const bottom = top + height;

    positionedItems.push({
      bottom,
      height,
      index,
      item,
      key,
      top,
    });

    top = bottom + gap;
  });

  return {
    positionedItems,
    totalMeasuredHeight: Math.max(0, top - gap),
  };
}

export function ScrollList<TItem>({
  className,
  contentClassName,
  contentStyle,
  gap = 0,
  getItemHeight,
  getItemKey,
  items,
  onRangeChange,
  overscan = 0,
  paddingBottom = 0,
  renderItem,
}: ScrollListProps<TItem>) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const onRangeChangeRef = useRef(onRangeChange);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const { positionedItems, totalMeasuredHeight } = useMemo(
    () => getPositionedItems(items, getItemHeight, getItemKey, gap),
    [gap, getItemHeight, getItemKey, items],
  );
  const visibleItems = useMemo(() => {
    const visibleStart = Math.max(0, scrollTop - overscan);
    const visibleEnd = scrollTop + viewportHeight + overscan;

    return positionedItems.filter(
      (item) => item.bottom + gap >= visibleStart && item.top <= visibleEnd,
    );
  }, [gap, overscan, positionedItems, scrollTop, viewportHeight]);

  useEffect(() => {
    onRangeChangeRef.current = onRangeChange;
  }, [onRangeChange]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateViewportHeight = () => {
      setViewportHeight((height) =>
        height === viewport.clientHeight ? height : viewport.clientHeight,
      );
    };

    updateViewportHeight();

    const observer = new ResizeObserver(updateViewportHeight);
    observer.observe(viewport);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    onRangeChangeRef.current?.({ scrollTop, viewportHeight });
  }, [scrollTop, viewportHeight]);

  return (
    <ScrollAreaPrimitive.Root
      className={cn("relative h-full overflow-hidden", className)}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        className="h-full w-full"
        onScroll={(event) => {
          const nextScrollTop = event.currentTarget.scrollTop;
          setScrollTop((currentScrollTop) =>
            currentScrollTop === nextScrollTop
              ? currentScrollTop
              : nextScrollTop,
          );
        }}
      >
        <div
          className={cn("relative", contentClassName)}
          style={{
            ...contentStyle,
            height: totalMeasuredHeight + paddingBottom,
          }}
        >
          {visibleItems.map((virtualItem) => (
            <div
              key={virtualItem.key}
              className="absolute right-0 left-0"
              style={{
                height: virtualItem.height,
                transform: `translateY(${virtualItem.top}px)`,
              }}
            >
              {renderItem(virtualItem)}
            </div>
          ))}
        </div>
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}
