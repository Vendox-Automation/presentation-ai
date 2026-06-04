import {
  type PlateNode,
  type PlateSlide,
  type RootImage,
} from "@/components/notebook/presentation/utils/parser";
import { type ImageModelList } from "@/constants/image-models";

type PresentationImageStockProvider = "unsplash" | "pixabay" | "google";

export type PresentationImageGenerationSource = "ai" | "stock" | "gif";

export type PresentationImageGenerationTarget =
  | {
      kind: "root";
      slideId: string;
    }
  | {
      elementId: string;
      kind: "element";
      slideId: string;
    };

type PresentationImageGenerationStatus =
  | "queued"
  | "generating"
  | "success"
  | "error";

export interface PresentationImageGenerationJob {
  error?: string;
  imageModel?: ImageModelList;
  presentationId?: string;
  query: string;
  source: PresentationImageGenerationSource;
  status: PresentationImageGenerationStatus;
  stockImageProvider?: PresentationImageStockProvider;
  target: PresentationImageGenerationTarget;
  url?: string;
}

export interface PresentationImageTargetState {
  elementId?: string;
  imageSource?: RootImage["imageSource"];
  isImageSlide?: boolean;
  layoutType?: RootImage["layoutType"];
  query?: string;
  stockImageProvider?: PresentationImageStockProvider;
  url?: string;
}

export interface PresentationPendingImageTarget {
  state: PresentationImageTargetState;
  target: PresentationImageGenerationTarget;
}

export function getPresentationImageGenerationKey(
  target: PresentationImageGenerationTarget,
): string {
  return target.kind === "root"
    ? target.slideId
    : `${target.slideId}:${target.elementId}`;
}

export function getRootImageGenerationTarget(
  slideId: string,
): PresentationImageGenerationTarget {
  return { kind: "root", slideId };
}

export function getElementImageGenerationTarget(
  slideId: string,
  elementId: string,
): PresentationImageGenerationTarget {
  return { kind: "element", slideId, elementId };
}

export function getElementImageGenerationKey(
  slideId: string,
  elementId: string,
): string {
  return getPresentationImageGenerationKey(
    getElementImageGenerationTarget(slideId, elementId),
  );
}

export function resolvePresentationImageGenerationSource({
  globalImageSource,
  imageSource,
  isImageSlide,
}: {
  globalImageSource: "automatic" | "ai" | "stock" | "gif";
  imageSource?: RootImage["imageSource"];
  isImageSlide?: boolean;
}): PresentationImageGenerationSource {
  if (imageSource === "gif") {
    return "gif";
  }

  if (imageSource === "search") {
    return "stock";
  }

  if (imageSource === "generate") {
    return "ai";
  }

  if (isImageSlide) {
    return "ai";
  }

  if (globalImageSource === "gif") {
    return "gif";
  }

  if (globalImageSource === "ai") {
    return "ai";
  }

  return "stock";
}

export function getGeneratedPresentationImageSource(
  source: PresentationImageGenerationSource,
): RootImage["imageSource"] {
  if (source === "gif") {
    return "gif";
  }

  return source === "stock" ? "search" : "generate";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function findImageElementState(
  nodes: PlateNode[],
  elementId: string,
): PresentationImageTargetState | undefined {
  for (const node of nodes) {
    if (!isRecord(node)) {
      continue;
    }

    if (node.id === elementId) {
      return {
        imageSource:
          node.imageSource === "generate" ||
          node.imageSource === "search" ||
          node.imageSource === "gif" ||
          node.imageSource === "upload"
            ? node.imageSource
            : undefined,
        query:
          typeof node.query === "string"
            ? node.query
            : typeof node.prompt === "string"
              ? node.prompt
              : undefined,
        stockImageProvider:
          node.stockImageProvider === "unsplash" ||
          node.stockImageProvider === "pixabay" ||
          node.stockImageProvider === "google"
            ? node.stockImageProvider
            : undefined,
        url: typeof node.url === "string" ? node.url : undefined,
      };
    }

    if (Array.isArray(node.children)) {
      const childResult = findImageElementState(
        node.children as PlateNode[],
        elementId,
      );

      if (childResult) {
        return childResult;
      }
    }
  }

  return undefined;
}

function collectImageElementStates(
  nodes: PlateNode[],
  slideId: string,
  results: PresentationPendingImageTarget[],
): void {
  for (const node of nodes) {
    if (!isRecord(node)) {
      continue;
    }

    const imageQuery =
      node.type === "icon-item"
        ? typeof node.prompt === "string"
          ? node.prompt
          : undefined
        : typeof node.query === "string"
          ? node.query
          : typeof node.prompt === "string"
            ? node.prompt
            : undefined;
    const isImageGenerationElement =
      node.type === "img" || node.type === "image" || node.type === "icon-item";

    if (
      typeof node.id === "string" &&
      isImageGenerationElement &&
      imageQuery !== undefined &&
      imageQuery.trim().length > 0 &&
      typeof node.url !== "string"
    ) {
      results.push({
        state: {
          elementId: node.id,
          imageSource:
            node.imageSource === "generate" ||
            node.imageSource === "search" ||
            node.imageSource === "gif" ||
            node.imageSource === "upload"
              ? node.imageSource
              : undefined,
          query: imageQuery,
          stockImageProvider:
            node.stockImageProvider === "unsplash" ||
            node.stockImageProvider === "pixabay" ||
            node.stockImageProvider === "google"
              ? node.stockImageProvider
              : undefined,
          url: undefined,
        },
        target: getElementImageGenerationTarget(slideId, node.id),
      });
    }

    if (Array.isArray(node.children)) {
      collectImageElementStates(node.children as PlateNode[], slideId, results);
    }
  }
}

export function getPendingPresentationImageTargets(
  slides: PlateSlide[],
): PresentationPendingImageTarget[] {
  const results: PresentationPendingImageTarget[] = [];

  for (const slide of slides) {
    if (
      slide.rootImage?.query &&
      !slide.rootImage.url &&
      !slide.rootImage.isQueryStreaming
    ) {
      results.push({
        state: {
          imageSource: slide.rootImage.imageSource,
          isImageSlide: slide.isImageSlide,
          layoutType: slide.rootImage.layoutType ?? slide.layoutType,
          query: slide.rootImage.query,
          stockImageProvider: slide.rootImage.stockImageProvider,
        },
        target: getRootImageGenerationTarget(slide.id),
      });
    }

    collectImageElementStates(slide.content, slide.id, results);
  }

  return results;
}

export function getPresentationImageTargetState(
  slides: PlateSlide[],
  target: PresentationImageGenerationTarget,
): PresentationImageTargetState | undefined {
  const slide = slides.find((candidate) => candidate.id === target.slideId);
  if (!slide) {
    return undefined;
  }

  if (target.kind === "root") {
    return slide.rootImage
      ? {
          imageSource: slide.rootImage.imageSource,
          isImageSlide: slide.isImageSlide,
          layoutType: slide.rootImage.layoutType ?? slide.layoutType,
          query: slide.rootImage.query,
          stockImageProvider: slide.rootImage.stockImageProvider,
          url: slide.rootImage.url,
        }
      : undefined;
  }

  return findImageElementState(slide.content, target.elementId);
}

function updateImageElementNodes(
  nodes: PlateNode[],
  elementId: string,
  patch: Record<string, unknown>,
): {
  changed: boolean;
  nodes: PlateNode[];
} {
  let changed = false;

  const nextNodes = nodes.map((node) => {
    if (!isRecord(node)) {
      return node;
    }

    let nextNode: Record<string, unknown> = node;

    if (node.id === elementId) {
      changed = true;
      const promptPatch =
        node.type === "icon-item" && typeof patch.query === "string"
          ? { prompt: patch.query }
          : {};
      nextNode = {
        ...node,
        ...patch,
        ...promptPatch,
      };
    } else if (Array.isArray(node.children)) {
      const childResult = updateImageElementNodes(
        node.children as PlateNode[],
        elementId,
        patch,
      );

      if (childResult.changed) {
        changed = true;
        nextNode = {
          ...node,
          children: childResult.nodes,
        };
      }
    }

    return nextNode as PlateNode;
  });

  return {
    changed,
    nodes: changed ? nextNodes : nodes,
  };
}

export function updatePresentationImageTarget(
  slides: PlateSlide[],
  target: PresentationImageGenerationTarget,
  patch: Partial<RootImage> & Record<string, unknown>,
): PlateSlide[] {
  return slides.map((slide) => {
    if (slide.id !== target.slideId) {
      return slide;
    }

    if (target.kind === "root") {
      return {
        ...slide,
        rootImage: {
          ...(slide.rootImage ?? { query: "" }),
          ...patch,
        },
      };
    }

    const result = updateImageElementNodes(slide.content, target.elementId, {
      ...patch,
    });

    return result.changed
      ? {
          ...slide,
          content: result.nodes,
        }
      : slide;
  });
}
