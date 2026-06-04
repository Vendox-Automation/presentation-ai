function ensureSvgDimensions(svg: SVGSVGElement, container: Element) {
  const rect = container.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  if (!svg.getAttribute("width")) {
    svg.setAttribute("width", String(width));
  }
  if (!svg.getAttribute("height")) {
    svg.setAttribute("height", String(height));
  }
  if (!svg.getAttribute("viewBox")) {
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
}

const SVG_PRESENTATION_ATTRIBUTES = [
  "color",
  "fill",
  "flood-color",
  "font-family",
  "stroke",
  "stop-color",
] as const;

function shouldResolveSvgValue(value: string): boolean {
  const normalized = value.trim();

  return (
    normalized === "currentColor" ||
    normalized === "inherit" ||
    normalized.includes("var(")
  );
}

function getResolvedStyleValue(
  computedStyle: CSSStyleDeclaration,
  property: string,
): string {
  return property === "color"
    ? computedStyle.color
    : computedStyle.getPropertyValue(property);
}

function inlineResolvedAttribute(
  sourceElement: Element,
  clonedElement: Element,
  computedStyle: CSSStyleDeclaration,
  attribute: (typeof SVG_PRESENTATION_ATTRIBUTES)[number],
): void {
  const value = clonedElement.getAttribute(attribute);
  if (!value || !shouldResolveSvgValue(value)) return;

  const resolvedValue = getResolvedStyleValue(computedStyle, attribute).trim();
  if (!resolvedValue) return;

  clonedElement.setAttribute(attribute, resolvedValue);

  if (attribute === "color") {
    return;
  }

  const sourceColor = getResolvedStyleValue(
    getComputedStyle(sourceElement),
    "color",
  ).trim();
  if (value.trim() === "currentColor" && sourceColor) {
    clonedElement.setAttribute(attribute, sourceColor);
  }
}

function inlineResolvedStyleProperties(
  clonedElement: Element,
  computedStyle: CSSStyleDeclaration,
): void {
  if (!(clonedElement instanceof SVGElement)) return;

  for (const attribute of SVG_PRESENTATION_ATTRIBUTES) {
    const value = clonedElement.style.getPropertyValue(attribute);
    if (!value || !shouldResolveSvgValue(value)) continue;

    const resolvedValue = getResolvedStyleValue(
      computedStyle,
      attribute,
    ).trim();
    if (!resolvedValue) continue;

    clonedElement.style.setProperty(attribute, resolvedValue);
  }
}

function inlineComputedSvgPresentationStyles(
  sourceSvg: SVGSVGElement,
  clonedSvg: SVGSVGElement,
): void {
  const sourceElements = [
    sourceSvg,
    ...Array.from(sourceSvg.querySelectorAll("*")),
  ];
  const clonedElements = [
    clonedSvg,
    ...Array.from(clonedSvg.querySelectorAll("*")),
  ];

  sourceElements.forEach((sourceElement, index) => {
    const clonedElement = clonedElements[index];
    if (!clonedElement) return;

    const computedStyle = getComputedStyle(sourceElement);

    for (const attribute of SVG_PRESENTATION_ATTRIBUTES) {
      inlineResolvedAttribute(
        sourceElement,
        clonedElement,
        computedStyle,
        attribute,
      );
    }

    inlineResolvedStyleProperties(clonedElement, computedStyle);
  });
}

function svgSourceToBase64DataUrl(source: string): string {
  const bytes = new TextEncoder().encode(source);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return `data:image/svg+xml;base64,${btoa(binary)}`;
}

export function getEChartSvgDataUrl(element: Element): string | null {
  const chartRoot = element.matches("[data-echart='true']")
    ? element
    : element.querySelector("[data-echart='true']");
  if (!chartRoot) return null;

  const svg = chartRoot.querySelector("svg");
  if (!(svg instanceof SVGSVGElement)) return null;

  const clonedSvg = svg.cloneNode(true);
  if (!(clonedSvg instanceof SVGSVGElement)) return null;

  ensureSvgDimensions(clonedSvg, chartRoot);
  inlineComputedSvgPresentationStyles(svg, clonedSvg);

  const source = new XMLSerializer().serializeToString(clonedSvg);
  return svgSourceToBase64DataUrl(source);
}
