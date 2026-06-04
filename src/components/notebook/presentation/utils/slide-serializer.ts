import {
  KEYS,
  type Descendant,
  type TColumnElement,
  type TColumnGroupElement,
  type TElement,
  type TTableCellElement,
  type TTableElement,
  type TTableRowElement,
  type TText,
} from "platejs";

import {
  ANTV_INFOGRAPHIC,
  AREA_CHART_ELEMENT,
  BAR_CHART_ELEMENT,
  BOX_PLOT_CHART_ELEMENT,
  BUBBLE_CHART_ELEMENT,
  CANDLESTICK_CHART_ELEMENT,
  CHORD_CHART_ELEMENT,
  CIRCULAR_GRID_GROUP,
  COMPOSED_CHART_ELEMENT,
  CONE_FUNNEL_CHART_ELEMENT,
  CONNECTED_CIRCLES_GROUP,
  CONTRIBUTOR_ELEMENT,
  DONUT_CHART_ELEMENT,
  FUNNEL_CHART_ELEMENT,
  HEATMAP_CHART_ELEMENT,
  HISTOGRAM_CHART_ELEMENT,
  LABEL_ELEMENT,
  LINE_CHART_ELEMENT,
  LINEAR_GAUGE_ELEMENT,
  NIGHTINGALE_CHART_ELEMENT,
  OHLC_CHART_ELEMENT,
  PIE_CHART_ELEMENT,
  PRESENTATION_TITLE_ELEMENT,
  PYRAMID_CHART_ELEMENT,
  QUOTE_ELEMENT,
  RADAR_CHART_ELEMENT,
  RADIAL_BAR_CHART_ELEMENT,
  RADIAL_COLUMN_CHART_ELEMENT,
  RADIAL_GAUGE_ELEMENT,
  RANGE_AREA_CHART_ELEMENT,
  RANGE_BAR_CHART_ELEMENT,
  SANKEY_CHART_ELEMENT,
  SCATTER_CHART_ELEMENT,
  SLOPE_GROUP,
  SNAKE_GROUP,
  STEPS_GROUP,
  SUNBURST_CHART_ELEMENT,
  TREEMAP_CHART_ELEMENT,
  WATERFALL_CHART_ELEMENT,
  type TContributorElement,
  type TLabelElement,
  type TPresentationTitleElement,
} from "../editor/lib";
import { type TAntvInfographicElement } from "../editor/plugins/antv-infographic-plugin";
import {
  type TArrowListElement,
  type TArrowListItemElement,
} from "../editor/plugins/arrow-plugin";
import {
  type TBeforeAfterGroupElement,
  type TBeforeAfterSideElement,
} from "../editor/plugins/before-after-plugin";
import {
  type TBoxGroupElement,
  type TBoxItemElement,
} from "../editor/plugins/box-plugin";
import {
  type TBulletGroupElement,
  type TBulletItemElement,
} from "../editor/plugins/bullet-plugin";
import { type TButtonElement } from "../editor/plugins/button-plugin";
import { type TChartNode } from "../editor/plugins/chart-plugin";
import {
  type TCompareGroupElement,
  type TCompareSideElement,
} from "../editor/plugins/compare-plugin";
import {
  type TCycleGroupElement,
  type TCycleItemElement,
} from "../editor/plugins/cycle-plugin";
import {
  type TCircularGridGroupElement,
  type TCircularGridItemElement,
  type TConnectedCirclesGroupElement,
  type TConnectedCirclesItemElement,
  type TSlopeGroupElement,
  type TSlopeItemElement,
  type TSnakeGroupElement,
  type TSnakeItemElement,
} from "../editor/plugins/diagram-components-plugin";
import {
  type TIconListElement,
  type TIconListItemElement,
} from "../editor/plugins/icon-list-plugin";
import { type TIconElement } from "../editor/plugins/icon-plugin";
import {
  type TConsItemElement,
  type TProsConsGroupElement,
  type TProsItemElement,
} from "../editor/plugins/pros-cons-plugin";
import {
  type TPyramidGroupElement,
  type TPyramidItemElement,
} from "../editor/plugins/pyramid-plugin";
import { type TQuoteElement } from "../editor/plugins/quote-plugin";
import {
  type TSequenceArrowGroupElement,
  type TSequenceArrowItemElement,
} from "../editor/plugins/sequence-arrow-plugin";
import {
  type TStairGroupElement,
  type TStairItemElement,
} from "../editor/plugins/staircase-plugin";
import {
  type TStatsGroupElement,
  type TStatsItemElement,
} from "../editor/plugins/stats-plugin";
import {
  type TStepsGroupElement,
  type TStepsItemElement,
} from "../editor/plugins/steps-plugin";
import {
  type TTimelineGroupElement,
  type TTimelineItemElement,
} from "../editor/plugins/timeline-plugin";
import { type PlateNode, type PlateSlide, type RootImage } from "./parser";
import {
  type HeadingElement,
  type ImageElement,
  type ParagraphElement,
} from "./types";

function parseColumnWidth(width: unknown): number | null {
  if (width === undefined || width === null) return null;

  const parsed = Number.parseFloat(String(width));

  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.round(parsed * 100) / 100;
}

const CHART_ELEMENT_TO_XML_TYPE: Record<string, string> = {
  [PIE_CHART_ELEMENT]: "pie",
  [BAR_CHART_ELEMENT]: "bar",
  [AREA_CHART_ELEMENT]: "area",
  [RADAR_CHART_ELEMENT]: "radar",
  [SCATTER_CHART_ELEMENT]: "scatter",
  [LINE_CHART_ELEMENT]: "line",
  [RADIAL_BAR_CHART_ELEMENT]: "radial-bar",
  [COMPOSED_CHART_ELEMENT]: "composed",
  [TREEMAP_CHART_ELEMENT]: "treemap",
  [BUBBLE_CHART_ELEMENT]: "bubble",
  [DONUT_CHART_ELEMENT]: "donut",
  [HISTOGRAM_CHART_ELEMENT]: "histogram",
  [HEATMAP_CHART_ELEMENT]: "heatmap",
  [RANGE_BAR_CHART_ELEMENT]: "range-bar",
  [RANGE_AREA_CHART_ELEMENT]: "range-area",
  [WATERFALL_CHART_ELEMENT]: "waterfall",
  [BOX_PLOT_CHART_ELEMENT]: "box-plot",
  [CANDLESTICK_CHART_ELEMENT]: "candlestick",
  [OHLC_CHART_ELEMENT]: "ohlc",
  [NIGHTINGALE_CHART_ELEMENT]: "nightingale",
  [RADIAL_COLUMN_CHART_ELEMENT]: "radial-column",
  [SUNBURST_CHART_ELEMENT]: "sunburst",
  [SANKEY_CHART_ELEMENT]: "sankey",
  [CHORD_CHART_ELEMENT]: "chord",
  [FUNNEL_CHART_ELEMENT]: "funnel",
  [CONE_FUNNEL_CHART_ELEMENT]: "cone-funnel",
  [PYRAMID_CHART_ELEMENT]: "pyramid",
  [RADIAL_GAUGE_ELEMENT]: "radial-gauge",
  [LINEAR_GAUGE_ELEMENT]: "linear-gauge",
};

const CHART_OPTION_EXCLUDED_KEYS = new Set([
  "type",
  "children",
  "data",
  "chartType",
  "charttype",
]);

const BASIC_BLOCK_ATTRIBUTE_KEYS = new Set([
  "alignment",
  "backgroundColor",
  "color",
  "textColor",
]);

type SlideSerializerMode = "content" | "layoutPrompt";

export interface SlideSerializerOptions {
  mode?: SlideSerializerMode;
}

const LAYOUT_PROMPT_PLACEHOLDERS = {
  author: "Name or role if relevant",
  body: "Write slide-specific supporting text.",
  centerText: "short slide-specific center label",
  heading: "Write a slide-specific heading.",
  icon: "relevant-keyword",
  imageQuery: "write an English image query for the slide-specific visual",
  infographic:
    "Describe the exact slide-specific visual: labels, entities, sequence, relationships, values, orientation, and takeaway.",
  itemHeading: "Write a concise item heading.",
  itemLabel: "Write a concise slide-specific item label.",
  listItem: "Write a concise slide-specific list item.",
  quote: "Write a slide-specific quote or testimonial.",
  stat: "slide-specific metric",
  title: "Write a slide-specific title.",
} as const;

const LAYOUT_PROMPT_CHART_DATA = `| label | value |
| --- | --- |
| Slide-specific category | numeric value |
| Slide-specific category | numeric value |`;

function getChartXmlType(elementType: string): string {
  return (
    CHART_ELEMENT_TO_XML_TYPE[elementType] ?? elementType.replace(/^chart-/, "")
  );
}

function isPrimitiveXmlValue(
  value: unknown,
): value is string | number | boolean {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function stringifyJson(value: unknown): string | null {
  if (value === undefined) return null;

  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMarkdownChartDataValue(
  value: unknown,
): value is string | number | boolean | null | undefined {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

/**
 * Class to serialize PlateSlide objects back to XML format
 */
class SlideSerializer {
  private readonly mode: SlideSerializerMode;

  public constructor(options: SlideSerializerOptions = {}) {
    this.mode = options.mode ?? "content";
  }

  private get isLayoutPrompt(): boolean {
    return this.mode === "layoutPrompt";
  }

  /**
   * Serialize an array of PlateSlide objects to XML string
   * @param slides Array of PlateSlide objects
   * @param includePresentationWrapper Whether to wrap output in PRESENTATION tag
   * @returns XML string
   */
  public serializeSlides(
    slides: PlateSlide[],
    includePresentationWrapper = true,
  ): string {
    const sections = slides.map((slide) => this.serializeSlide(slide));

    if (includePresentationWrapper) {
      return `<PRESENTATION>\n${sections.join("\n")}\n</PRESENTATION>`;
    }

    return sections.join("\n");
  }

  /**
   * Serialize a single PlateSlide to XML SECTION
   */
  private serializeSlide(slide: PlateSlide): string {
    const attributes: Record<string, string> = {};

    // Add layout type if present
    if (slide.layoutType) {
      attributes.layout = slide.layoutType;
    }

    // Add alignment if present and not default
    if (slide.alignment && slide.alignment !== "center") {
      attributes.alignment = slide.alignment;
    }

    // Add bgColor if present
    if (slide.bgColor) {
      attributes.bgColor = slide.bgColor;
    }

    // Add width if present
    if (slide.width) {
      attributes.width = slide.width;
    }

    if (slide.id && !this.isLayoutPrompt) {
      attributes.id = slide.id;
    }

    if (slide.isImageSlide) {
      attributes.isImageSlide = "true";
    }

    const attrString = this.serializeAttributes(attributes);
    const openTag = `<SECTION${attrString}>`;

    const contentParts: string[] = [];

    // Serialize content nodes
    if (!slide.isImageSlide) {
      for (const node of slide.content) {
        const serialized = this.serializeNode(node, 1);
        if (serialized) {
          contentParts.push(serialized);
        }
      }
    }

    if (slide.rootImage) {
      contentParts.push(this.serializeRootImage(slide.rootImage, 1));
    }

    return `${openTag}\n${contentParts.join("\n")}\n</SECTION>`;
  }

  /**
   * Serialize attributes object to string
   */
  private serializeAttributes(attributes: Record<string, string>): string {
    const entries = Object.entries(attributes);
    if (entries.length === 0) return "";

    return (
      " " +
      entries
        .map(([key, value]) => `${key}="${this.escapeXml(value)}"`)
        .join(" ")
    );
  }

  private getLayoutPromptAttributeValue(key: string): string | undefined {
    if (!this.isLayoutPrompt) {
      return undefined;
    }

    switch (key.toLowerCase()) {
      case "author":
        return LAYOUT_PROMPT_PLACEHOLDERS.author;
      case "centertext":
        return LAYOUT_PROMPT_PLACEHOLDERS.centerText;
      case "icon":
        return LAYOUT_PROMPT_PLACEHOLDERS.icon;
      case "prompt":
      case "query":
        return LAYOUT_PROMPT_PLACEHOLDERS.imageQuery;
      case "stat":
        return LAYOUT_PROMPT_PLACEHOLDERS.stat;
      default:
        return undefined;
    }
  }

  private setAttribute(
    attributes: Record<string, string>,
    key: string,
    value: unknown,
  ): void {
    if (!isPrimitiveXmlValue(value)) {
      return;
    }

    if (this.isLayoutPrompt && (key === "id" || key === "url")) {
      return;
    }

    attributes[key] = this.getLayoutPromptAttributeValue(key) ?? String(value);
  }

  private getHeadingLayoutPromptPlaceholder(tag: string): string {
    if (tag === "H1" || tag === "H2") {
      return LAYOUT_PROMPT_PLACEHOLDERS.heading;
    }

    return LAYOUT_PROMPT_PLACEHOLDERS.itemHeading;
  }

  /**
   * Escape special XML characters
   */
  private escapeXml(text: string): string {
    return text
      ?.replace(/&/g, "&amp;")
      ?.replace(/</g, "&lt;")
      ?.replace(/>/g, "&gt;")
      ?.replace(/"/g, "&quot;")
      ?.replace(/'/g, "&apos;");
  }

  private serializeJsonChild(
    tagName: string,
    value: unknown,
    indent: number,
  ): string | null {
    const json = stringifyJson(value);
    if (!json) return null;

    const indentStr = "  ".repeat(indent);
    return `${indentStr}<${tagName}>${this.escapeXml(json)}</${tagName}>`;
  }

  private serializeMarkdownCell(value: unknown): string {
    return String(value ?? "")
      .replace(/\r?\n/g, " ")
      .replace(/\|/g, "\\|");
  }

  private serializeMarkdownChartData(
    value: unknown,
    indent: number,
  ): string | null {
    if (!Array.isArray(value) || value.length === 0) {
      return null;
    }

    const rows = value.filter(isRecord);
    if (rows.length !== value.length) {
      return null;
    }

    const keys = Array.from(
      new Set(rows.flatMap((row) => Object.keys(row))),
    ).filter((key) => rows.every((row) => isMarkdownChartDataValue(row[key])));

    if (keys.length === 0) {
      return null;
    }

    const indentStr = "  ".repeat(indent);
    const header = `| ${keys.map((key) => this.serializeMarkdownCell(key)).join(" | ")} |`;
    const separator = `| ${keys.map(() => "---").join(" | ")} |`;
    const tableRows = rows.map(
      (row) =>
        `| ${keys.map((key) => this.serializeMarkdownCell(row[key])).join(" | ")} |`,
    );

    return [header, separator, ...tableRows]
      .map((line) => `${indentStr}${this.escapeXml(line)}`)
      .join("\n");
  }

  private serializeChartDataChild(
    value: unknown,
    indent: number,
  ): string | null {
    return this.serializeMarkdownChartData(value, indent);
  }

  private serializeRootImage(image: RootImage, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const attributes: Record<string, string> = {};

    this.setAttribute(attributes, "query", image.query);
    this.setAttribute(attributes, "url", image.url);
    this.setAttribute(attributes, "embedType", image.embedType);
    this.setAttribute(attributes, "imageSource", image.imageSource);
    this.setAttribute(
      attributes,
      "stockImageProvider",
      image.stockImageProvider,
    );
    this.setAttribute(attributes, "layoutType", image.layoutType);
    this.setAttribute(attributes, "width", image.size?.w);
    this.setAttribute(attributes, "height", image.size?.h);
    this.setAttribute(
      attributes,
      "paletteDropMutable",
      image.paletteDropMutable,
    );
    this.setAttribute(
      attributes,
      "charttype",
      image.chartType ? getChartXmlType(image.chartType) : undefined,
    );

    const childParts = this.isLayoutPrompt
      ? []
      : [
          this.serializeJsonChild("CROP", image.cropSettings, indent + 1),
          this.serializeChartDataChild(image.chartData, indent + 1),
          this.serializeJsonChild("OPTIONS", image.chartOptions, indent + 1),
        ].filter((part): part is string => Boolean(part));

    if (childParts.length === 0) {
      return `${indentStr}<IMG${this.serializeAttributes(attributes)} />`;
    }

    return `${indentStr}<IMG${this.serializeAttributes(attributes)}>\n${childParts.join("\n")}\n${indentStr}</IMG>`;
  }

  private serializeBasicBlockAttributes(
    node: Record<string, unknown>,
    extraKeys: readonly string[] = [],
  ): Record<string, string> {
    const attributes: Record<string, string> = {};
    const allowedKeys = new Set([...BASIC_BLOCK_ATTRIBUTE_KEYS, ...extraKeys]);

    for (const key of allowedKeys) {
      const value = node[key];
      if (isPrimitiveXmlValue(value)) {
        this.setAttribute(attributes, key, value);
      }
    }

    return attributes;
  }

  /**
   * Serialize a PlateNode to XML
   */
  private serializeNode(node: PlateNode, indent = 0): string | null {
    if (!node || typeof node !== "object") return null;

    const nodeType = (node as { type?: string }).type;

    if (!nodeType) return null;

    switch (nodeType) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        return this.serializeHeading(
          node as HeadingElement,
          nodeType.toUpperCase(),
          indent,
        );

      case PRESENTATION_TITLE_ELEMENT:
        return this.serializePresentationTitle(
          node as TPresentationTitleElement,
          indent,
        );

      case LABEL_ELEMENT:
        return this.serializeLabel(node as TLabelElement, indent);

      case CONTRIBUTOR_ELEMENT:
        return this.serializeContributor(node as TContributorElement, indent);

      case KEYS.blockquote:
        return this.serializeBlockquote(node as TElement, indent);

      case KEYS.callout:
        return this.serializeCallout(node as TElement, indent);

      case KEYS.codeBlock:
        return this.serializeCodeBlock(node as TElement, indent);

      case "p":
        return this.serializeParagraph(node as ParagraphElement, indent);

      case "img":
        return this.serializeImage(node as ImageElement, indent);

      case "column_group":
        return this.serializeColumns(node as TColumnGroupElement, indent);

      case "bullets":
        return this.serializeBullets(node as TBulletGroupElement, indent);

      case "icons":
        return this.serializeIcons(node as TIconListElement, indent);

      case "cycle":
        return this.serializeCycle(node as TCycleGroupElement, indent);

      case STEPS_GROUP:
        return this.serializeSteps(node as TStepsGroupElement, indent);

      case "staircase":
        return this.serializeStaircase(node as TStairGroupElement, indent);

      case "arrows":
        return this.serializeArrows(node as TArrowListElement, indent);

      case "pyramid":
        return this.serializePyramid(node as TPyramidGroupElement, indent);

      case "timeline":
        return this.serializeTimeline(node as TTimelineGroupElement, indent);

      case SLOPE_GROUP:
        return this.serializeSlope(node as TSlopeGroupElement, indent);

      case SNAKE_GROUP:
        return this.serializeSnake(node as TSnakeGroupElement, indent);

      case CONNECTED_CIRCLES_GROUP:
        return this.serializeConnectedCircles(
          node as TConnectedCirclesGroupElement,
          indent,
        );

      case CIRCULAR_GRID_GROUP:
        return this.serializeCircularGrid(
          node as TCircularGridGroupElement,
          indent,
        );

      case "boxes":
        return this.serializeBoxes(node as TBoxGroupElement, indent);

      case "compare":
        return this.serializeCompare(node as TCompareGroupElement, indent);

      case "before-after":
        return this.serializeBeforeAfter(
          node as TBeforeAfterGroupElement,
          indent,
        );

      case "pros-cons":
        return this.serializeProsCons(node as TProsConsGroupElement, indent);

      case "arrow-vertical":
        return this.serializeArrowVertical(
          node as TSequenceArrowGroupElement,
          indent,
        );

      case "table":
        return this.serializeTable(node as TTableElement, indent);

      case "button":
        return this.serializeButton(node as TButtonElement, indent);

      case "stats":
        return this.serializeStats(node as TStatsGroupElement, indent);

      case PIE_CHART_ELEMENT:
      case BAR_CHART_ELEMENT:
      case AREA_CHART_ELEMENT:
      case RADAR_CHART_ELEMENT:
      case SCATTER_CHART_ELEMENT:
      case LINE_CHART_ELEMENT:
      case RADIAL_BAR_CHART_ELEMENT:
      case COMPOSED_CHART_ELEMENT:
      case TREEMAP_CHART_ELEMENT:
      case BUBBLE_CHART_ELEMENT:
      case DONUT_CHART_ELEMENT:
      case HISTOGRAM_CHART_ELEMENT:
      case HEATMAP_CHART_ELEMENT:
      case RANGE_BAR_CHART_ELEMENT:
      case RANGE_AREA_CHART_ELEMENT:
      case WATERFALL_CHART_ELEMENT:
      case BOX_PLOT_CHART_ELEMENT:
      case CANDLESTICK_CHART_ELEMENT:
      case OHLC_CHART_ELEMENT:
      case NIGHTINGALE_CHART_ELEMENT:
      case RADIAL_COLUMN_CHART_ELEMENT:
      case SUNBURST_CHART_ELEMENT:
      case SANKEY_CHART_ELEMENT:
      case CHORD_CHART_ELEMENT:
      case FUNNEL_CHART_ELEMENT:
      case CONE_FUNNEL_CHART_ELEMENT:
      case PYRAMID_CHART_ELEMENT:
      case RADIAL_GAUGE_ELEMENT:
      case LINEAR_GAUGE_ELEMENT:
        return this.serializeChart(node as TChartNode, nodeType, indent);

      case QUOTE_ELEMENT:
        return this.serializeQuote(node as TQuoteElement, indent);

      case ANTV_INFOGRAPHIC:
        return this.serializeInfographic(
          node as TAntvInfographicElement,
          indent,
        );

      default:
        console.warn(`Unknown node type: ${nodeType}`);
        return null;
    }
  }

  /**
   * Serialize heading element
   */
  private serializeHeading(
    node: HeadingElement,
    tag: string,
    indent: number,
  ): string {
    const indentStr = "  ".repeat(indent);
    const content = this.isLayoutPrompt
      ? this.getHeadingLayoutPromptPlaceholder(tag)
      : this.serializeDescendants(node.children);
    return `${indentStr}<${tag}>${content}</${tag}>`;
  }

  private serializePresentationTitle(
    node: TPresentationTitleElement,
    indent: number,
  ): string {
    const indentStr = "  ".repeat(indent);
    const attributes = this.serializeBasicBlockAttributes(
      node as unknown as Record<string, unknown>,
      ["variant"],
    );
    const content = this.isLayoutPrompt
      ? LAYOUT_PROMPT_PLACEHOLDERS.title
      : this.serializeDescendants(node.children as Descendant[]);

    return `${indentStr}<TITLE${this.serializeAttributes(attributes)}>${content}</TITLE>`;
  }

  private serializeLabel(node: TLabelElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const attributes = this.serializeBasicBlockAttributes(
      node as unknown as Record<string, unknown>,
    );
    const content = this.isLayoutPrompt
      ? LAYOUT_PROMPT_PLACEHOLDERS.itemLabel
      : this.serializeDescendants(node.children as Descendant[]);

    return `${indentStr}<LABEL${this.serializeAttributes(attributes)}>${content}</LABEL>`;
  }

  private serializeContributor(
    _node: TContributorElement,
    indent: number,
  ): string {
    const indentStr = "  ".repeat(indent);

    return `${indentStr}<CONTRIBUTOR />`;
  }

  private serializeBlockquote(node: TElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const attributes = this.serializeBasicBlockAttributes(
      node as unknown as Record<string, unknown>,
      ["author"],
    );
    const content = this.isLayoutPrompt
      ? LAYOUT_PROMPT_PLACEHOLDERS.quote
      : this.serializeDescendants(node.children as Descendant[]);

    return `${indentStr}<BLOCKQUOTE${this.serializeAttributes(attributes)}>${content}</BLOCKQUOTE>`;
  }

  private serializeCallout(node: TElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const attributes = this.serializeBasicBlockAttributes(
      node as unknown as Record<string, unknown>,
      ["icon", "variant"],
    );
    const content = this.isLayoutPrompt
      ? LAYOUT_PROMPT_PLACEHOLDERS.body
      : (node.children as Descendant[])
          .map((child) => this.serializeDescendant(child, indent + 1))
          .filter(Boolean)
          .join("\n");

    return `${indentStr}<CALLOUT${this.serializeAttributes(attributes)}>\n${content}\n${indentStr}</CALLOUT>`;
  }

  private serializeCodeBlock(node: TElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const nodeRecord = node as unknown as Record<string, unknown>;
    const attributes: Record<string, string> = {};
    const language = nodeRecord.lang ?? nodeRecord.language;

    if (isPrimitiveXmlValue(language)) {
      attributes.language = String(language);
    }

    const lines = (node.children as Descendant[]).map((child) => {
      if (
        typeof child === "object" &&
        child !== null &&
        "children" in child &&
        Array.isArray(child.children)
      ) {
        return this.serializeDescendants(child.children as Descendant[]);
      }

      return this.serializeDescendant(child, 0) ?? "";
    });

    return `${indentStr}<CODE${this.serializeAttributes(attributes)}>${lines.join("\n")}</CODE>`;
  }

  /**
   * Serialize paragraph element
   */
  private serializeParagraph(node: ParagraphElement, indent: number): string {
    const indentStr = "  ".repeat(indent);

    // Check if this is a list item (has indent and listStyleType)
    const nodeWithList = node as ParagraphElement & {
      indent?: number;
      listStyleType?: string;
    };

    if (nodeWithList.indent && nodeWithList.listStyleType) {
      const content = this.isLayoutPrompt
        ? LAYOUT_PROMPT_PLACEHOLDERS.listItem
        : this.serializeDescendants(node.children);
      return `${indentStr}<LI>${content}</LI>`;
    }

    const content = this.isLayoutPrompt
      ? LAYOUT_PROMPT_PLACEHOLDERS.body
      : this.serializeDescendants(node.children);
    return `${indentStr}<P>${content}</P>`;
  }

  /**
   * Serialize image element
   */
  private serializeImage(node: ImageElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const attributes: Record<string, string> = {};

    this.setAttribute(attributes, "query", node.query);
    this.setAttribute(attributes, "url", node.url);

    // Add any additional properties as attributes
    const nodeKeys = Object.keys(node) as (keyof ImageElement)[];
    for (const key of nodeKeys) {
      if (
        key !== "type" &&
        key !== "children" &&
        key !== "query" &&
        key !== "url"
      ) {
        const value = node[key];
        if (value !== undefined && value !== null) {
          this.setAttribute(attributes, key, value);
        }
      }
    }

    return `${indentStr}<IMG${this.serializeAttributes(attributes)} />`;
  }

  /**
   * Serialize columns layout
   */
  private serializeColumns(node: TColumnGroupElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const childIndent = indent + 1;
    const childIndentStr = "  ".repeat(childIndent);

    const columns = (node.children as TColumnElement[])
      .map((col) => {
        const content = (col.children as Descendant[])
          .map((child) => this.serializeDescendant(child, childIndent + 1))
          .filter(Boolean)
          .join("\n");

        const attrs: Record<string, string> = {};
        const width = parseColumnWidth(col.width);
        if (width !== null) {
          attrs.width = String(width);
        }

        return `${childIndentStr}<DIV${this.serializeAttributes(attrs)}>\n${content}\n${childIndentStr}</DIV>`;
      })
      .join("\n");

    return `${indentStr}<COLUMNS>\n${columns}\n${indentStr}</COLUMNS>`;
  }

  /**
   * Serialize bullets layout
   */
  private serializeBullets(node: TBulletGroupElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const childIndent = indent + 1;
    const childIndentStr = "  ".repeat(childIndent);
    const nodeAttrs: Record<string, string> = {};

    if (node.bulletType) {
      nodeAttrs.bulletType = node.bulletType;
    }
    if (node.columnSize) {
      nodeAttrs.columnSize = node.columnSize;
    }
    if (node.alignment) {
      nodeAttrs.alignment = node.alignment;
    }

    const bullets = (node.children as TBulletItemElement[])
      .map((bullet) => {
        const content = (bullet.children as Descendant[])
          .map((child) => this.serializeDescendant(child, childIndent + 1))
          .filter(Boolean)
          .join("\n");
        const itemAttrs: Record<string, string> = {};

        this.setAttribute(itemAttrs, "icon", bullet.icon);

        return `${childIndentStr}<DIV${this.serializeAttributes(itemAttrs)}>\n${content}\n${childIndentStr}</DIV>`;
      })
      .join("\n");

    return `${indentStr}<BULLETS${this.serializeAttributes(nodeAttrs)}>\n${bullets}\n${indentStr}</BULLETS>`;
  }

  /**
   * Serialize icons layout
   */
  private serializeIcons(node: TIconListElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const childIndent = indent + 1;
    const childIndentStr = "  ".repeat(childIndent);
    const nodeAttrs: Record<string, string> = {};

    if (node.variant) nodeAttrs.variant = node.variant;
    if (node.orientation) nodeAttrs.orientation = node.orientation;
    if (node.columnSize) nodeAttrs.columnSize = node.columnSize;
    if (node.alignment) nodeAttrs.alignment = node.alignment;
    if (typeof node.mediaSize === "number" && Number.isFinite(node.mediaSize)) {
      nodeAttrs.mediaSize = String(node.mediaSize);
    }

    const icons = (node.children as TIconListItemElement[])
      .map((item) => {
        const itemWithIcon = item as TIconListItemElement & { icon?: string };
        const itemIcon =
          itemWithIcon.icon ??
          this.getLegacyIconValue(item.children as Descendant[]);
        const parts: string[] = [];

        for (const child of item.children as Descendant[]) {
          if (
            typeof child === "object" &&
            "type" in child &&
            child.type === "icon"
          ) {
          } else {
            const serialized = this.serializeDescendant(child, childIndent + 1);
            if (serialized) parts.push(serialized);
          }
        }

        const itemAttrs: Record<string, string> = {};

        if (node.variant === "image") {
          const prompt = item.prompt ?? item.query;

          this.setAttribute(itemAttrs, "prompt", prompt);
          this.setAttribute(itemAttrs, "url", item.url);
          this.setAttribute(itemAttrs, "imageSource", item.imageSource);
          this.setAttribute(
            itemAttrs,
            "stockImageProvider",
            item.stockImageProvider,
          );
        } else if (itemIcon) {
          this.setAttribute(itemAttrs, "icon", itemIcon);
        }

        return `${childIndentStr}<DIV${this.serializeAttributes(itemAttrs)}>\n${parts.join("\n")}\n${childIndentStr}</DIV>`;
      })
      .join("\n");

    return `${indentStr}<ICONS${this.serializeAttributes(nodeAttrs)}>\n${icons}\n${indentStr}</ICONS>`;
  }

  private getLegacyIconValue(children: Descendant[]): string | undefined {
    for (const child of children) {
      if (
        typeof child === "object" &&
        "type" in child &&
        child.type === "icon"
      ) {
        const iconNode = child as TIconElement;
        return iconNode.name || iconNode.query || undefined;
      }
    }

    return undefined;
  }

  /**
   * Serialize cycle layout
   */
  private serializeCycle(node: TCycleGroupElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const childIndent = indent + 1;
    const childIndentStr = "  ".repeat(childIndent);

    const items = (node.children as TCycleItemElement[])
      .map((item) => {
        const content = (item.children as Descendant[])
          .map((child) => this.serializeDescendant(child, childIndent + 1))
          .filter(Boolean)
          .join("\n");
        const itemAttrs: Record<string, string> = {};

        this.setAttribute(itemAttrs, "icon", item.icon);

        return `${childIndentStr}<DIV${this.serializeAttributes(itemAttrs)}>\n${content}\n${childIndentStr}</DIV>`;
      })
      .join("\n");

    return `${indentStr}<CYCLE>\n${items}\n${indentStr}</CYCLE>`;
  }

  private serializeSteps(node: TStepsGroupElement, indent: number): string {
    const attrs: Record<string, string> = {};

    if (node.orientation) {
      attrs.orientation = node.orientation;
    }
    if (node.variant) {
      attrs.variant = node.variant;
    }
    if (node.columns !== undefined) {
      attrs.columns = String(node.columns);
    }
    if (node.columnSize) {
      attrs.columnSize = node.columnSize;
    }
    if (typeof node.color === "string") {
      attrs.color = node.color;
    }

    return this.serializeDivItemGroup<TStepsItemElement>({
      attrs,
      indent,
      items: node.children as TStepsItemElement[],
      tagName: "STEPS",
    });
  }

  private serializeSlope(node: TSlopeGroupElement, indent: number): string {
    const attrs: Record<string, string> = {};

    if (node.alignment) {
      attrs.alignment = node.alignment;
    }

    return this.serializeDivItemGroup<TSlopeItemElement>({
      attrs,
      indent,
      items: node.children as TSlopeItemElement[],
      tagName: "SLOPE",
    });
  }

  private serializeSnake(node: TSnakeGroupElement, indent: number): string {
    const attrs: Record<string, string> = {};

    if (node.alignment) {
      attrs.alignment = node.alignment;
    }

    return this.serializeDivItemGroup<TSnakeItemElement>({
      attrs,
      indent,
      items: node.children as TSnakeItemElement[],
      tagName: "SNAKE",
    });
  }

  private serializeConnectedCircles(
    node: TConnectedCirclesGroupElement,
    indent: number,
  ): string {
    const attrs: Record<string, string> = {};

    if (node.alignment) {
      attrs.alignment = node.alignment;
    }

    return this.serializeDivItemGroup<TConnectedCirclesItemElement>({
      attrs,
      indent,
      items: node.children as TConnectedCirclesItemElement[],
      tagName: "CONNECTED-CIRCLES",
    });
  }

  private serializeCircularGrid(
    node: TCircularGridGroupElement,
    indent: number,
  ): string {
    const attrs: Record<string, string> = {};

    if (node.alignment) {
      attrs.alignment = node.alignment;
    }
    this.setAttribute(attrs, "centerText", node.centerText);

    return this.serializeDivItemGroup<TCircularGridItemElement>({
      attrs,
      indent,
      items: node.children as TCircularGridItemElement[],
      tagName: "CIRCULAR-GRID",
    });
  }

  private serializeDivItemGroup<TItem extends TElement & { icon?: string }>({
    attrs,
    indent,
    items,
    tagName,
  }: {
    attrs?: Record<string, string>;
    indent: number;
    items: TItem[];
    tagName: string;
  }): string {
    const indentStr = "  ".repeat(indent);
    const childIndent = indent + 1;
    const childIndentStr = "  ".repeat(childIndent);

    const serializedItems = items
      .map((item) => {
        const content = (item.children as Descendant[])
          .map((child) => this.serializeDescendant(child, childIndent + 1))
          .filter(Boolean)
          .join("\n");
        const itemAttrs: Record<string, string> = {};

        this.setAttribute(itemAttrs, "icon", item.icon);

        return `${childIndentStr}<DIV${this.serializeAttributes(itemAttrs)}>\n${content}\n${childIndentStr}</DIV>`;
      })
      .join("\n");

    return `${indentStr}<${tagName}${this.serializeAttributes(attrs ?? {})}>\n${serializedItems}\n${indentStr}</${tagName}>`;
  }

  /**
   * Serialize staircase layout
   */
  private serializeStaircase(node: TStairGroupElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const childIndent = indent + 1;
    const childIndentStr = "  ".repeat(childIndent);

    const items = (node.children as TStairItemElement[])
      .map((item) => {
        const content = (item.children as Descendant[])
          .map((child) => this.serializeDescendant(child, childIndent + 1))
          .filter(Boolean)
          .join("\n");
        const itemAttrs: Record<string, string> = {};

        this.setAttribute(itemAttrs, "icon", item.icon);

        return `${childIndentStr}<DIV${this.serializeAttributes(itemAttrs)}>\n${content}\n${childIndentStr}</DIV>`;
      })
      .join("\n");

    return `${indentStr}<STAIRCASE>\n${items}\n${indentStr}</STAIRCASE>`;
  }

  /**
   * Serialize arrows layout
   */
  private serializeArrows(node: TArrowListElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const childIndent = indent + 1;
    const childIndentStr = "  ".repeat(childIndent);

    const items = (node.children as TArrowListItemElement[])
      .map((item) => {
        const content = (item.children as Descendant[])
          .map((child) => this.serializeDescendant(child, childIndent + 1))
          .filter(Boolean)
          .join("\n");
        const itemAttrs: Record<string, string> = {};

        this.setAttribute(itemAttrs, "icon", item.icon);

        return `${childIndentStr}<DIV${this.serializeAttributes(itemAttrs)}>\n${content}\n${childIndentStr}</DIV>`;
      })
      .join("\n");

    return `${indentStr}<ARROWS>\n${items}\n${indentStr}</ARROWS>`;
  }

  /**
   * Serialize pyramid layout
   */
  private serializePyramid(node: TPyramidGroupElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const childIndent = indent + 1;
    const childIndentStr = "  ".repeat(childIndent);

    const items = (node.children as TPyramidItemElement[])
      .map((item) => {
        const content = (item.children as Descendant[])
          .map((child) => this.serializeDescendant(child, childIndent + 1))
          .filter(Boolean)
          .join("\n");
        const itemAttrs: Record<string, string> = {};

        this.setAttribute(itemAttrs, "icon", item.icon);

        return `${childIndentStr}<DIV${this.serializeAttributes(itemAttrs)}>\n${content}\n${childIndentStr}</DIV>`;
      })
      .join("\n");

    return `${indentStr}<PYRAMID>\n${items}\n${indentStr}</PYRAMID>`;
  }

  /**
   * Serialize timeline layout
   */
  private serializeTimeline(
    node: TTimelineGroupElement,
    indent: number,
  ): string {
    const indentStr = "  ".repeat(indent);
    const childIndent = indent + 1;
    const childIndentStr = "  ".repeat(childIndent);
    const attrs: Record<string, string> = {};

    if (node.orientation) {
      attrs.orientation = node.orientation;
    }

    if (node.sidedness) {
      attrs.sidedness = node.sidedness;
    }

    if (node.numbered !== undefined) {
      attrs.numbered = String(node.numbered);
    }

    if (node.showLine !== undefined) {
      attrs.showLine = String(node.showLine);
    }

    if (node.alignment) {
      attrs.alignment = node.alignment;
    }

    if (node.variant) {
      attrs.variant = node.variant;
    }

    if (typeof node.color === "string") {
      attrs.color = node.color;
    }

    const items = (node.children as TTimelineItemElement[])
      .map((item) => {
        const content = (item.children as Descendant[])
          .map((child) => this.serializeDescendant(child, childIndent + 1))
          .filter(Boolean)
          .join("\n");
        const itemAttrs: Record<string, string> = {};

        this.setAttribute(itemAttrs, "icon", item.icon);

        return `${childIndentStr}<DIV${this.serializeAttributes(itemAttrs)}>\n${content}\n${childIndentStr}</DIV>`;
      })
      .join("\n");

    return `${indentStr}<TIMELINE${this.serializeAttributes(attrs)}>\n${items}\n${indentStr}</TIMELINE>`;
  }

  /**
   * Serialize boxes layout
   */
  private serializeBoxes(node: TBoxGroupElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const childIndent = indent + 1;
    const childIndentStr = "  ".repeat(childIndent);
    const groupAttrs: Record<string, string> = {};

    if (node.boxType) {
      groupAttrs.boxType = node.boxType;
    }

    if (node.orientation) {
      groupAttrs.orientation = node.orientation;
    }

    if (node.columnSize) {
      groupAttrs.columnSize = node.columnSize;
    }

    const items = (node.children as TBoxItemElement[])
      .map((item) => {
        const content = (item.children as Descendant[])
          .map((child) => this.serializeDescendant(child, childIndent + 1))
          .filter(Boolean)
          .join("\n");
        const itemAttrs: Record<string, string> = {};

        this.setAttribute(itemAttrs, "icon", item.icon);

        return `${childIndentStr}<DIV${this.serializeAttributes(itemAttrs)}>\n${content}\n${childIndentStr}</DIV>`;
      })
      .join("\n");

    return `${indentStr}<BOXES${this.serializeAttributes(groupAttrs)}>\n${items}\n${indentStr}</BOXES>`;
  }

  /**
   * Serialize compare layout
   */
  private serializeCompare(node: TCompareGroupElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const childIndent = indent + 1;
    const childIndentStr = "  ".repeat(childIndent);
    const groupAttrs: Record<string, string> = {};

    if (node.columnSize) {
      groupAttrs.columnSize = node.columnSize;
    }

    const sides = (node.children as TCompareSideElement[])
      .map((side) => {
        const content = (side.children as Descendant[])
          .map((child) => this.serializeDescendant(child, childIndent + 1))
          .filter(Boolean)
          .join("\n");

        return `${childIndentStr}<DIV>\n${content}\n${childIndentStr}</DIV>`;
      })
      .join("\n");

    return `${indentStr}<COMPARE${this.serializeAttributes(groupAttrs)}>\n${sides}\n${indentStr}</COMPARE>`;
  }

  /**
   * Serialize before/after layout
   */
  private serializeBeforeAfter(
    node: TBeforeAfterGroupElement,
    indent: number,
  ): string {
    const indentStr = "  ".repeat(indent);
    const childIndent = indent + 1;
    const childIndentStr = "  ".repeat(childIndent);
    const groupAttrs: Record<string, string> = {};

    if (node.columnSize) {
      groupAttrs.columnSize = node.columnSize;
    }

    const sides = (node.children as TBeforeAfterSideElement[])
      .map((side) => {
        const content = (side.children as Descendant[])
          .map((child) => this.serializeDescendant(child, childIndent + 1))
          .filter(Boolean)
          .join("\n");

        return `${childIndentStr}<DIV>\n${content}\n${childIndentStr}</DIV>`;
      })
      .join("\n");

    return `${indentStr}<BEFORE-AFTER${this.serializeAttributes(groupAttrs)}>\n${sides}\n${indentStr}</BEFORE-AFTER>`;
  }

  /**
   * Serialize pros/cons layout
   */
  private serializeProsCons(
    node: TProsConsGroupElement,
    indent: number,
  ): string {
    const indentStr = "  ".repeat(indent);
    const childIndent = indent + 1;
    const childIndentStr = "  ".repeat(childIndent);

    const items = (node.children as (TProsItemElement | TConsItemElement)[])
      .map((item) => {
        const isPros = item.type === "pros-item";
        const tag = isPros ? "PROS" : "CONS";

        const content = (item.children as Descendant[])
          .map((child) => this.serializeDescendant(child, childIndent + 1))
          .filter(Boolean)
          .join("\n");

        return `${childIndentStr}<${tag}>\n${content}\n${childIndentStr}</${tag}>`;
      })
      .join("\n");

    return `${indentStr}<PROS-CONS>\n${items}\n${indentStr}</PROS-CONS>`;
  }

  /**
   * Serialize sequence arrow layout.
   */
  private serializeArrowVertical(
    node: TSequenceArrowGroupElement,
    indent: number,
  ): string {
    const indentStr = "  ".repeat(indent);
    const childIndent = indent + 1;
    const childIndentStr = "  ".repeat(childIndent);
    const attrs: Record<string, string> = {};

    if (node.orientation) {
      attrs.orientation = node.orientation;
    }

    if (node.alignment) {
      attrs.alignment = node.alignment;
    }

    const items = (node.children as TSequenceArrowItemElement[])
      .map((item) => {
        const content = (item.children as Descendant[])
          .map((child) => this.serializeDescendant(child, childIndent + 1))
          .filter(Boolean)
          .join("\n");

        return `${childIndentStr}<DIV>\n${content}\n${childIndentStr}</DIV>`;
      })
      .join("\n");

    return `${indentStr}<ARROW-SEQUENCE${this.serializeAttributes(attrs)}>\n${items}\n${indentStr}</ARROW-SEQUENCE>`;
  }

  /**
   * Serialize stats layout
   */
  private serializeStats(node: TStatsGroupElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const childIndent = indent + 1;
    const childIndentStr = "  ".repeat(childIndent);

    const attrs: Record<string, string> = {};
    if (node.statsType) {
      attrs.statstype = node.statsType;
    }

    const items = (node.children as TStatsItemElement[])
      .map((item) => {
        const itemAttrs: Record<string, string> = {};
        this.setAttribute(itemAttrs, "stat", item.stat);

        const content = (item.children as Descendant[])
          .map((child) => this.serializeDescendant(child, childIndent + 1))
          .filter(Boolean)
          .join("\n");

        return `${childIndentStr}<DIV${this.serializeAttributes(itemAttrs)}>\n${content}\n${childIndentStr}</DIV>`;
      })
      .join("\n");

    return `${indentStr}<STATS${this.serializeAttributes(attrs)}>\n${items}\n${indentStr}</STATS>`;
  }

  /**
   * Serialize table
   */
  private serializeTable(node: TTableElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const rowIndent = indent + 1;
    const rowIndentStr = "  ".repeat(rowIndent);
    const cellIndent = indent + 2;
    const cellIndentStr = "  ".repeat(cellIndent);

    const rows = (node.children as TTableRowElement[])
      .map((row) => {
        const cells = (row.children as TTableCellElement[])
          .map((cell) => {
            const isHeader = cell.type === "th";
            const tag = isHeader ? "TH" : "TD";

            const attrs: Record<string, string> = {};

            // Add colspan, rowspan, background as attributes
            const cellWithProps = cell as TTableCellElement & {
              colSpan?: number;
              rowSpan?: number;
              background?: string;
            };

            if (cellWithProps.colSpan && cellWithProps.colSpan > 1) {
              attrs.colspan = String(cellWithProps.colSpan);
            }
            if (cellWithProps.rowSpan && cellWithProps.rowSpan > 1) {
              attrs.rowspan = String(cellWithProps.rowSpan);
            }
            if (cellWithProps.background) {
              attrs.background = cellWithProps.background;
            }

            const content = (cell.children as Descendant[])
              .map((child) => this.serializeDescendant(child, 0))
              .filter(Boolean)
              .join("");

            return `${cellIndentStr}<${tag}${this.serializeAttributes(attrs)}>${content}</${tag}>`;
          })
          .join("\n");

        return `${rowIndentStr}<TR>\n${cells}\n${rowIndentStr}</TR>`;
      })
      .join("\n");

    return `${indentStr}<TABLE>\n${rows}\n${indentStr}</TABLE>`;
  }

  /**
   * Serialize button
   */
  private serializeButton(node: TButtonElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const attrs = this.serializeBasicBlockAttributes(
      node as unknown as Record<string, unknown>,
    );

    const buttonWithProps = node as TButtonElement & {
      variant?: "filled" | "outline" | "ghost";
      size?: "sm" | "md" | "lg";
    };

    if (buttonWithProps.variant) {
      attrs.variant = buttonWithProps.variant;
    }
    if (buttonWithProps.size) {
      attrs.size = buttonWithProps.size;
    }

    const content = this.serializeDescendants(node.children);

    return `${indentStr}<BUTTON${this.serializeAttributes(attrs)}>${content}</BUTTON>`;
  }

  /**
   * Serialize chart
   */
  private serializeChart(
    node: TChartNode,
    elementType: string,
    indent: number,
  ): string {
    const indentStr = "  ".repeat(indent);
    const dataIndent = indent + 1;

    const attrs: Record<string, string> = {};
    const chartOptions: Record<string, unknown> = {};

    this.setAttribute(attrs, "charttype", getChartXmlType(elementType));

    for (const [key, value] of Object.entries(
      node as unknown as Record<string, unknown>,
    )) {
      if (CHART_OPTION_EXCLUDED_KEYS.has(key) || value === undefined) {
        continue;
      }

      if (isPrimitiveXmlValue(value)) {
        this.setAttribute(attrs, key, value);
      }

      if (!this.isLayoutPrompt) {
        chartOptions[key] = value;
      }
    }

    const structuredParts = this.isLayoutPrompt
      ? [
          LAYOUT_PROMPT_CHART_DATA.split("\n")
            .map((line) => `${"  ".repeat(dataIndent)}${line}`)
            .join("\n"),
        ]
      : [
          this.serializeChartDataChild(node.data, dataIndent),
          Object.keys(chartOptions).length > 0
            ? this.serializeJsonChild("OPTIONS", chartOptions, dataIndent)
            : null,
        ].filter((part): part is string => Boolean(part));

    const childParts = structuredParts;

    if (childParts.length === 0) {
      return `${indentStr}<CHART${this.serializeAttributes(attrs)} />`;
    }

    return `${indentStr}<CHART${this.serializeAttributes(attrs)}>\n${childParts.join("\n")}\n${indentStr}</CHART>`;
  }

  private serializeInfographicData(
    node: TAntvInfographicElement,
    indent: number,
  ): string[] {
    const parts: string[] = [];
    const prompt = node.generationPrompt?.trim();
    const sourceText = node.sourceText?.trim();
    const syntax = node.syntax?.trim();

    if (prompt) {
      parts.push(
        `${"  ".repeat(indent)}<PROMPT>${this.escapeXml(prompt)}</PROMPT>`,
      );
    }

    if (sourceText) {
      parts.push(
        `${"  ".repeat(indent)}<SOURCE>${this.escapeXml(sourceText)}</SOURCE>`,
      );
    }

    if (syntax) {
      parts.push(
        `${"  ".repeat(indent)}<SYNTAX>${this.escapeXml(syntax)}</SYNTAX>`,
      );
    }

    const data = this.serializeJsonChild("DATA", node.data, indent);
    if (data) {
      parts.push(data);
    }

    return parts;
  }

  /**
   * Serialize a descendant (could be text or element)
   */
  private serializeDescendant(
    descendant: Descendant,
    indent: number,
  ): string | null {
    if (!descendant || typeof descendant !== "object") return null;

    // Check if it's a text node
    if ("text" in descendant) {
      return this.serializeTextNode(descendant as TText, indent);
    }

    // It's an element node
    return this.serializeNode(descendant as PlateNode, indent);
  }

  /**
   * Serialize descendants (array)
   */
  private serializeDescendants(descendants: Descendant[]): string {
    return descendants
      .map((d) => this.serializeDescendant(d, 0))
      .filter(Boolean)
      .join("");
  }

  /**
   * Serialize text node with formatting
   */
  private serializeTextNode(node: TText, indent: number): string {
    const indentStr = indent > 0 ? "  ".repeat(indent) : "";
    let text = node.text;

    if (this.isLayoutPrompt) {
      text = LAYOUT_PROMPT_PLACEHOLDERS.itemLabel;
      return indent > 0 ? indentStr + text : text;
    }

    // Escape the text
    text = this.escapeXml(text);

    const textWithFormat = node as TText & {
      bold?: boolean;
      italic?: boolean;
      underline?: boolean;
      strikethrough?: boolean;
    };

    // Apply formatting tags
    if (textWithFormat.bold) {
      text = `<B>${text}</B>`;
    }
    if (textWithFormat.italic) {
      text = `<I>${text}</I>`;
    }
    if (textWithFormat.underline) {
      text = `<U>${text}</U>`;
    }
    if (textWithFormat.strikethrough) {
      text = `<S>${text}</S>`;
    }

    return indent > 0 ? indentStr + text : text;
  }

  /**
   * Serialize quote element
   */
  private serializeQuote(node: TQuoteElement, indent: number): string {
    const indentStr = "  ".repeat(indent);
    const attrs: Record<string, string> = {};

    if (node.variant && node.variant !== "large") {
      this.setAttribute(attrs, "variant", node.variant);
    }
    this.setAttribute(attrs, "author", node.author);

    const content = this.isLayoutPrompt
      ? LAYOUT_PROMPT_PLACEHOLDERS.quote
      : this.serializeDescendants(node.children);
    return `${indentStr}<QUOTE${this.serializeAttributes(attrs)}>${content}</QUOTE>`;
  }

  private serializeInfographic(
    node: TAntvInfographicElement,
    indent: number,
  ): string {
    const indentStr = "  ".repeat(indent);
    const attrs: Record<string, string> = {};

    this.setAttribute(attrs, "id", node.id);
    this.setAttribute(attrs, "isLoading", node.isLoading);
    this.setAttribute(attrs, "slideLayoutType", node.slideLayoutType);
    this.setAttribute(attrs, "width", node.width);
    this.setAttribute(attrs, "align", node.align);

    if (this.isLayoutPrompt) {
      return `${indentStr}<INFOGRAPHIC${this.serializeAttributes(attrs)}>${LAYOUT_PROMPT_PLACEHOLDERS.infographic}</INFOGRAPHIC>`;
    }

    const childParts = this.serializeInfographicData(node, indent + 1);

    if (childParts.length === 0) {
      const content =
        node.generationPrompt?.trim() ?? "Generate an infographic";
      return `${indentStr}<INFOGRAPHIC${this.serializeAttributes(attrs)}>${this.escapeXml(content)}</INFOGRAPHIC>`;
    }

    return `${indentStr}<INFOGRAPHIC${this.serializeAttributes(attrs)}>\n${childParts.join("\n")}\n${indentStr}</INFOGRAPHIC>`;
  }
}

/**
 * Helper function to serialize slides to XML
 * @param slides Array of PlateSlide objects
 * @param includePresentationWrapper Whether to wrap in PRESENTATION tag
 * @returns XML string
 */
export function serializeSlidesToXml(
  slides: PlateSlide[],
  includePresentationWrapper = true,
  options?: SlideSerializerOptions,
): string {
  const serializer = new SlideSerializer(options);
  return serializer.serializeSlides(slides, includePresentationWrapper);
}

/**
 * Helper function to serialize a single slide to XML
 * @param slide PlateSlide object
 * @returns XML string
 */
export function serializeSlideToXml(
  slide: PlateSlide,
  options?: SlideSerializerOptions,
): string {
  const serializer = new SlideSerializer(options);
  return serializer.serializeSlides([slide], false);
}
