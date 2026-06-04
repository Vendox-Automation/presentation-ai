"use client";

import { useEffect, type RefObject } from "react";

const DARK_CHANNEL_THRESHOLD = 16;
const CARD_BACKGROUND_MARKER = "data-antv-card-background-fill";

function parseHexChannel(value: string): number {
  return Number.parseInt(value, 16);
}

function isNearBlackHex(color: string): boolean {
  const shorthand = color.match(/^#([0-9a-f]{3})$/i);
  if (shorthand) {
    const [r, g, b] = shorthand[1]!.split("");
    return [r, g, b].every(
      (channel) =>
        parseHexChannel(`${channel}${channel}`) <= DARK_CHANNEL_THRESHOLD,
    );
  }

  const full = color.match(/^#([0-9a-f]{6})$/i);
  if (!full) return false;

  const value = full[1]!;
  return [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)].every(
    (channel) => parseHexChannel(channel) <= DARK_CHANNEL_THRESHOLD,
  );
}

function isNearBlackRgb(color: string): boolean {
  const match = color.match(
    /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)(?:\s*,\s*(\d?(?:\.\d+)?))?\s*\)$/i,
  );
  if (!match) return false;

  const alpha = match[4] === undefined ? 1 : Number.parseFloat(match[4]);
  if (alpha <= 0) return false;

  return [match[1], match[2], match[3]].every(
    (channel) => Number.parseFloat(channel!) <= DARK_CHANNEL_THRESHOLD,
  );
}

function isNearBlackColor(color: string | null): boolean {
  if (!color) return false;

  const normalized = color.trim().toLowerCase();
  if (normalized === "black") return true;
  if (normalized.startsWith("#")) return isNearBlackHex(normalized);
  return isNearBlackRgb(normalized);
}

function resolvePresentationCardBackground(container: HTMLElement): string {
  const probe = document.createElement("span");
  probe.style.color = "var(--presentation-card-background, hsl(var(--card)))";
  probe.style.display = "none";
  container.appendChild(probe);
  const color = window.getComputedStyle(probe).color;
  probe.remove();

  return color || "hsl(var(--card))";
}

export function enforceInfographicCardBackground(container: HTMLElement): void {
  const cardBackground = resolvePresentationCardBackground(container);
  const rects = container.querySelectorAll<SVGRectElement>("svg rect");

  for (const rect of rects) {
    if (rect.closest('g[data-element-type="transient-container"]')) continue;

    const fill = rect.getAttribute("fill");
    const appliedCardBackground = rect.getAttribute(CARD_BACKGROUND_MARKER);
    if (!isNearBlackColor(fill) && !appliedCardBackground) continue;
    if (fill === cardBackground && appliedCardBackground === cardBackground) {
      continue;
    }

    rect.setAttribute("fill", cardBackground);
    rect.setAttribute(CARD_BACKGROUND_MARKER, cardBackground);

    const stroke = rect.getAttribute("stroke");
    if (isNearBlackColor(stroke)) {
      rect.setAttribute("stroke", cardBackground);
    }
  }
}

export function useInfographicCardBackground(
  containerRef: RefObject<HTMLElement | null>,
  refreshKey: string,
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frameId: number | null = null;
    const scheduleEnforcement = () => {
      if (frameId !== null) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        enforceInfographicCardBackground(container);
      });
    };

    scheduleEnforcement();

    const observer = new MutationObserver(scheduleEnforcement);
    observer.observe(container, {
      attributes: true,
      attributeFilter: ["fill", "stroke"],
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [containerRef, refreshKey]);
}
