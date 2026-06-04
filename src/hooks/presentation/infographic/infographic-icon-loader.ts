import { registerResourceLoader } from "@antv/infographic";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { resolvePresentationIcon } from "@/components/notebook/presentation/editor/custom-elements/presentation-icon-utils";

type ResourceConfig = {
  source: string;
  format?: string;
  encoding?: string;
  data: string;
  scene?: string;
  [key: string]: unknown;
};

let loaderRegistered = false;
const iconSymbolCache = new Map<string, Promise<SVGSymbolElement | null>>();

async function loadIconSymbol(
  iconName: string,
): Promise<SVGSymbolElement | null> {
  const cachedSymbol = iconSymbolCache.get(iconName);
  if (cachedSymbol) return cachedSymbol;

  const symbolPromise = (async () => {
    const resolvedIcon = await resolvePresentationIcon(iconName);
    if (!resolvedIcon) return null;

    const svgString = renderToStaticMarkup(
      React.createElement(resolvedIcon.Component, {
        size: 24,
        color: "currentColor",
        strokeWidth: 2,
      }),
    );

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = doc.querySelector("svg");

    if (!svgElement) return null;

    const symbol = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "symbol",
    );

    if (svgElement.hasAttribute("viewBox")) {
      const viewBox = svgElement.getAttribute("viewBox");
      if (viewBox) symbol.setAttribute("viewBox", viewBox);
    } else {
      symbol.setAttribute("viewBox", "0 0 24 24");
    }

    while (svgElement.firstChild) {
      symbol.appendChild(svgElement.firstChild);
    }

    return symbol as SVGSymbolElement;
  })().catch((error: unknown) => {
    iconSymbolCache.delete(iconName);
    throw error;
  });

  iconSymbolCache.set(iconName, symbolPromise);
  return symbolPromise;
}

export const registerLucideIconLoader = () => {
  if (loaderRegistered) return;

  registerResourceLoader(async (config: ResourceConfig) => {
    if (
      !config.data ||
      config.data.startsWith("<") ||
      config.data.startsWith("data:")
    ) {
      return null;
    }

    const iconName = config.data;

    try {
      const symbol = await loadIconSymbol(iconName);
      return symbol?.cloneNode(true) as SVGSymbolElement | null;
    } catch (error) {
      console.error("Failed to load icon resource:", error);
      return null;
    }
  });

  loaderRegistered = true;
};
