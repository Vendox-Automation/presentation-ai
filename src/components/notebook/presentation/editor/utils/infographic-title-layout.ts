"use client";

import { type Infographic, type InfographicOptions } from "@antv/infographic";

const TITLE_WIDTH_MULTIPLIER = 1.5;
const DESCRIPTION_WIDTH_MULTIPLIER = 1.5;
const MAX_TEXT_VIEWPORT_RATIO = 0.95;
const CENTER_ALIGN = "CENTER";

type InfographicElementUpdate = {
  attributes: Record<string, string | number>;
};

type InfographicEditorState = {
  updateElement: (element: Element, props: InfographicElementUpdate) => void;
};

type InfographicEditorContainer = {
  editor?: {
    state?: InfographicEditorState;
  };
};

export function hasInfographicTitleLayoutAttributes(
  data?: Partial<InfographicOptions>,
): boolean {
  const attributes = data?.data?.attributes;

  return Boolean(attributes?.title || attributes?.desc);
}

function parseNumberAttribute(value: string | null): number | null {
  if (!value) return null;

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSvgViewportWidth(element: SVGGraphicsElement): number | null {
  const svgElement = element.ownerSVGElement;
  if (!svgElement) return null;

  const viewBoxWidth = svgElement.viewBox.baseVal.width;
  if (viewBoxWidth > 0) return viewBoxWidth;

  const attributeWidth = parseNumberAttribute(svgElement.getAttribute("width"));
  if (attributeWidth !== null && attributeWidth > 0) return attributeWidth;

  const rectWidth = svgElement.getBoundingClientRect().width;
  return rectWidth > 0 ? rectWidth : null;
}

function clampTextXPosition(
  x: number,
  width: number,
  maxWidth: number,
): number {
  return Math.min(Math.max(x, 0), Math.max(maxWidth - width, 0));
}

function centerInfographicText(textElement: SVGGraphicsElement): void {
  textElement.setAttribute("data-horizontal-align", CENTER_ALIGN);

  if (textElement instanceof SVGTextElement) {
    textElement.setAttribute("text-anchor", "middle");
  }

  const textEntity = textElement.querySelector("span");
  if (textEntity instanceof HTMLSpanElement) {
    textEntity.style.textAlign = "center";
    textEntity.style.justifyContent = "center";
  }
}

function getCenterAttributes(
  textElement: SVGGraphicsElement,
): Record<string, string | number> {
  const attributes: Record<string, string | number> = {
    "data-horizontal-align": CENTER_ALIGN,
  };

  if (textElement instanceof SVGTextElement) {
    attributes["text-anchor"] = "middle";
  }

  return attributes;
}

function getInfographicEditorState(
  instance?: Infographic,
): InfographicEditorState | undefined {
  return (instance as unknown as InfographicEditorContainer | undefined)?.editor
    ?.state;
}

function widenInfographicText(
  textElement: SVGGraphicsElement,
  widthMultiplier: number,
  state?: InfographicEditorState,
): boolean {
  const originalWidth = parseNumberAttribute(textElement.getAttribute("width"));
  if (originalWidth === null || originalWidth <= 0) {
    centerInfographicText(textElement);
    state?.updateElement(textElement, {
      attributes: getCenterAttributes(textElement),
    });
    return true;
  }

  const originalX = parseNumberAttribute(textElement.getAttribute("x")) ?? 0;
  const viewportWidth = getSvgViewportWidth(textElement);
  const nextWidth =
    viewportWidth === null
      ? originalWidth * widthMultiplier
      : Math.min(
          originalWidth * widthMultiplier,
          viewportWidth * MAX_TEXT_VIEWPORT_RATIO,
        );
  const centeredX = originalX - (nextWidth - originalWidth) / 2;
  const nextX =
    viewportWidth === null
      ? centeredX
      : clampTextXPosition(centeredX, nextWidth, viewportWidth);

  textElement.setAttribute("width", String(nextWidth));
  textElement.setAttribute("x", String(nextX));
  centerInfographicText(textElement);

  const attributes: Record<string, string | number> = {
    ...getCenterAttributes(textElement),
    width: nextWidth,
    x: nextX,
  };

  state?.updateElement(textElement, { attributes });
  return true;
}

export function applyInitialInfographicTitleLayout(
  container: HTMLElement,
  instance?: Infographic,
): boolean {
  const state = getInfographicEditorState(instance);
  const titleElements = container.querySelectorAll<SVGGraphicsElement>(
    '[data-element-type="title"]',
  );
  const descElements = container.querySelectorAll<SVGGraphicsElement>(
    '[data-element-type="desc"]',
  );
  let didUpdate = false;

  for (const titleElement of titleElements) {
    didUpdate =
      widenInfographicText(titleElement, TITLE_WIDTH_MULTIPLIER, state) ||
      didUpdate;
  }

  for (const descElement of descElements) {
    didUpdate =
      widenInfographicText(descElement, DESCRIPTION_WIDTH_MULTIPLIER, state) ||
      didUpdate;
  }

  return didUpdate;
}
