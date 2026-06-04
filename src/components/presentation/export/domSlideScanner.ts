/**
 * DOM Slide Scanner
 * Scans rendered slide DOM to extract element positions, SVGs, and styles
 */

import { toPng } from "html-to-image";

import { type PlateSlide } from "@/components/notebook/presentation/utils/parser";
import { proxyPresentationImageUrl } from "@/lib/image-proxy";
import { usePresentationState } from "@/states/presentation-state";
import { walkSlideContent } from "./contentWalker";
import { extractPresentationStyles } from "./cssVariableResolver";
import { getEChartSvgDataUrl } from "./echartSvgExport";
import {
  type ElementPosition,
  type RootImageData,
  type ScanResult,
} from "./types";
import { getOptimalPixelRatio } from "./utils";

/**
 * Scan a slide's DOM and extract all exportable elements
 * @param slide - The slide to scan
 * @returns ScanResult with all elements and their positions
 */
async function scanSlide(slide: PlateSlide): Promise<ScanResult | null> {
  const slideId = slide.id;
  // Find the slide container
  const slideElement = document.querySelector(`#presentation-root-${slideId}`);
  if (!slideElement) {
    console.warn(`Slide container not found for slide: ${slideId}`);
    return null;
  }

  // Get slide dimensions
  const slideRect = slideElement.getBoundingClientRect();
  const sourceSize = getUntransformedSize(slideElement, slideRect);

  const styles = extractPresentationStyles(slideElement);
  let backgroundImageUrl: string | undefined;
  // Only use background image if the layout supports it
  if (slide.layoutType === "background") {
    backgroundImageUrl = styles.backgroundImageUrl;
  }

  // Scan for root image
  const rootImage = await scanRootImageFromSlide(slideElement, slideId);

  // Scan for exportable elements using PlateJS content walker
  // This uses the slide content JSON to identify elements, but DOM for positions
  const elements = await walkSlideContent(slide.content, slideElement);

  return {
    slideId,
    width: slideRect.width,
    height: slideRect.height,
    sourceWidth: sourceSize.width,
    sourceHeight: sourceSize.height,
    elements,
    styles,
    rootImage,
    backgroundImageUrl,
  };
}

function getUntransformedSize(
  element: Element,
  fallbackRect: DOMRect,
): { width: number; height: number } {
  if (element instanceof HTMLElement) {
    const width =
      element.offsetWidth || element.clientWidth || fallbackRect.width;
    const height =
      element.offsetHeight || element.clientHeight || fallbackRect.height;

    return { width, height };
  }

  return { width: fallbackRect.width, height: fallbackRect.height };
}

/**
 * Get position relative to slide container (as percentage 0-100)
 */
function getRelativePosition(
  element: Element,
  slideRect: DOMRect,
): ElementPosition {
  const rect = element.getBoundingClientRect();
  return {
    x: ((rect.left - slideRect.left) / slideRect.width) * 100,
    y: ((rect.top - slideRect.top) / slideRect.height) * 100,
    width: (rect.width / slideRect.width) * 100,
    height: (rect.height / slideRect.height) * 100,
  };
}

function waitForImageLoad(image: HTMLImageElement): Promise<void> {
  if (image.complete && image.naturalWidth > 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const finish = () => {
      image.removeEventListener("load", finish);
      image.removeEventListener("error", finish);
      resolve();
    };

    image.addEventListener("load", finish);
    image.addEventListener("error", finish);
  });
}

async function captureRootImageForExport(
  rootImageContainer: Element,
  slide: PlateSlide,
): Promise<string> {
  const imageElements = Array.from(rootImageContainer.querySelectorAll("img"));
  const replacements: Array<{
    crossOrigin: string | null;
    image: HTMLImageElement;
    src: string;
  }> = [];

  try {
    for (const imageElement of imageElements) {
      const originalSrc = imageElement.currentSrc || imageElement.src;
      const proxiedSrc = proxyPresentationImageUrl(
        originalSrc,
        slide.rootImage,
        { absolute: true },
      );

      if (!proxiedSrc || proxiedSrc === originalSrc) {
        continue;
      }

      replacements.push({
        crossOrigin: imageElement.crossOrigin,
        image: imageElement,
        src: imageElement.src,
      });
      imageElement.crossOrigin = "anonymous";
      imageElement.src = proxiedSrc;
    }

    await Promise.all(
      replacements.map((replacement) => waitForImageLoad(replacement.image)),
    );

    return await toPng(rootImageContainer as HTMLElement, {
      backgroundColor: "transparent",
      cacheBust: true,
      quality: 1,
      pixelRatio: getOptimalPixelRatio(),
      skipFonts: true,
    });
  } finally {
    for (const replacement of replacements) {
      replacement.image.crossOrigin = replacement.crossOrigin;
      replacement.image.src = replacement.src;
    }
  }
}

/**
 * Scan root image from the slide element
 */
async function scanRootImageFromSlide(
  slideElement: Element,
  slideId: string,
): Promise<RootImageData | undefined> {
  const { slides } = usePresentationState.getState();
  const slide = slides.find((s) => s.id === slideId);

  if (!slide || !slide.rootImage) return undefined;

  const slideRect = slideElement.getBoundingClientRect();

  // Look for root image container with data-root-image attribute
  // In root-image.tsx, this is on the Resizable component which has the correct dimensions
  // In root-image-static.tsx, this is on a nested div, but the parent has the sizing
  const rootImageContainer = slideElement.querySelector(
    `[data-root-image="${slideId}"]`,
  );

  if (!rootImageContainer) return undefined;

  // Determine the correct container to measure for position
  // The data-root-image element could be:
  // 1. The Resizable component itself (in root-image.tsx) - has class "shrink-0"
  // 2. A nested div inside a sized parent (in root-image-static.tsx)
  let imageContainer: Element = rootImageContainer;

  // If the element itself has shrink-0, it's the Resizable and we use it directly
  // Otherwise, check if the parent has the sizing (for static version)
  if (!rootImageContainer.classList.contains("shrink-0")) {
    const parent = rootImageContainer.parentElement;
    if (parent?.classList.contains("shrink-0")) {
      imageContainer = parent;
    }
  }

  const position = getRelativePosition(imageContainer, slideRect);

  // Try to find the original image URL
  const imgElement = imageContainer.querySelector("img");
  const originalUrl = imgElement?.src || undefined;

  try {
    const chartSvgDataUrl = getEChartSvgDataUrl(rootImageContainer);
    if (chartSvgDataUrl) {
      return {
        url: chartSvgDataUrl,
        position,
        isBase64: true,
        originalUrl,
        imageSource: slide.rootImage.imageSource,
        stockImageProvider: slide.rootImage.stockImageProvider,
      };
    }

    // Non-chart root media still needs a DOM capture to preserve object-fit,
    // object-position, cropping, and embeds.
    const base64Data = await captureRootImageForExport(
      rootImageContainer,
      slide,
    );
    return {
      url: base64Data,
      position,
      isBase64: true, // Flag to indicate this is already a captured image
      originalUrl,
      imageSource: slide.rootImage.imageSource,
      stockImageProvider: slide.rootImage.stockImageProvider,
    };
  } catch (error) {
    console.warn("Failed to capture root image element", error);
    return undefined;
  }
}

/**
 * Scan all slides in the presentation
 * Uses parallel processing for better performance
 */
export async function scanAllSlides(
  slides: PlateSlide[],
  onProgress?: (completed: number, total: number) => void,
): Promise<ScanResult[]> {
  const total = slides.length;
  let completed = 0;
  const results: ScanResult[] = [];

  for (const slide of slides) {
    const result = await scanSlide(slide);
    if (result) {
      results.push(result);
    }
    completed++;
    onProgress?.(completed, total);
  }

  return results;
}
