"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_PRESENTATION_ICON,
  resolvePresentationIcon,
  type ResolvedPresentationIcon,
} from "./presentation-icon-utils";

export function PresentationIcon({
  icon,
  size = 24,
  className,
  iconClassName,
  fallbackIcon,
}: {
  icon?: string;
  size?: number;
  className?: string;
  iconClassName?: string;
  fallbackIcon?: string;
}) {
  const [resolvedIcon, setResolvedIcon] =
    useState<ResolvedPresentationIcon | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const normalizedIcon = icon?.trim();
      const normalizedFallbackIcon = fallbackIcon?.trim();
      const nextIconName = normalizedIcon || normalizedFallbackIcon;

      if (!nextIconName) {
        if (!cancelled) {
          setResolvedIcon(null);
        }
        return;
      }

      let nextResolvedIcon: ResolvedPresentationIcon | null = null;

      try {
        nextResolvedIcon = await resolvePresentationIcon(nextIconName);
      } catch (error) {
        console.error("Error resolving presentation icon:", error);
      }

      let fallbackResolvedIcon: ResolvedPresentationIcon | null = null;

      if (!nextResolvedIcon && normalizedIcon) {
        try {
          fallbackResolvedIcon = await resolvePresentationIcon(
            normalizedFallbackIcon || DEFAULT_PRESENTATION_ICON,
          );
        } catch (error) {
          console.error("Error resolving fallback presentation icon:", error);
        }
      }

      if (!cancelled) {
        setResolvedIcon(nextResolvedIcon ?? fallbackResolvedIcon);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [fallbackIcon, icon]);

  if (!resolvedIcon) return null;

  const IconComponent = resolvedIcon.Component;

  return (
    <div className={className}>
      <IconComponent aria-hidden="true" className={iconClassName} size={size} />
    </div>
  );
}
