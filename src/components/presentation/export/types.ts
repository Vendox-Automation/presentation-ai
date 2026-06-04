/**
 * Types for DOM-based PPTX export system
 */

// Position and dimensions in pixels (relative to slide container)
export interface ElementPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  /** Original pixel aspect ratio (width/height) for preserving shape integrity in PPT export */
  aspectRatio?: number;
  /** Which dimension to preserve when using aspectRatio: 'width' recalculates height, 'height' recalculates width */
  aspectRatioBase?: "width" | "height";
  /** Center the resized aspect-ratio box within the original measured bounds */
  centerAspectRatio?: boolean;
}

// Text styling extracted from DOM
interface TextStyles {
  fontFamily: string;
  fontSize: number; // in px
  fontWeight: string | number;
  color: string; // hex color
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right" | "justify";
  textDecoration?: string;
  fontStyle?: string;
  lineHeight?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

// Border styling
interface BorderStyles {
  width: number;
  color: string;
  style: string;
  radius?: number;
}

// Element types we extract
// Element types we extract
type ExportElementType =
  | "text"
  | "table"
  | "image"
  | "decor"
  | "shape"
  | "backgroundRect";

// Base export element
interface BaseExportElement {
  type: ExportElementType;
  position: ElementPosition;
  borderStyles?: BorderStyles;
  backgroundColor?: string;
  borderRadius?: string;
}

// Text element (simple text block)
export interface TextExportElement extends BaseExportElement {
  type: "text";
  textContent: string;
  textStyles: TextStyles;
  /** Original PlateJS node type (e.g., "h1", "h2", "p", "blockquote") for standard font sizing */
  nodeType?: string;
}

// Table cell
export interface TableCell {
  text: string;
  isHeader: boolean;
  colSpan?: number;
  rowSpan?: number;
  backgroundColor?: string;
  textStyles?: TextStyles;
  widthRatio?: number; // Deprecated in favor of box
  box?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// Table row
export interface TableRow {
  cells: TableCell[];
}

// Table element
export interface TableExportElement extends BaseExportElement {
  type: "table";
  rows: TableRow[];
  headerRowCount?: number;
}

// Image element (in-editor images, not root image)
export interface ImageExportElement extends BaseExportElement {
  type: "image";
  url: string;
  alt?: string;
  imageSource?: "generate" | "search" | "gif" | "upload";
  sizing?: "contain" | "cover" | "fill";
  stockImageProvider?: string;
}

// Decorative element with data-decor attribute
export interface DecorExportElement extends BaseExportElement {
  type: "decor";
  decorType: string;
  base64Data?: string;
  sizing: "contain" | "cover" | "fill";
}

export type NativeShapeType =
  | "arrow"
  | "pill"
  | "parallelogram"
  | "rect"
  | "ellipse";

// Native Shape element (for arrows, pills, parallelograms, and timeline marks)
export interface ShapeExportElement extends BaseExportElement {
  type: "shape";
  shapeType: NativeShapeType;
  orientation: "horizontal" | "vertical";
  fillColor: string;
  textContent?: string;
  textColor?: string;
}

// Background rectangle element (for component backgrounds like box-item, cycle-item)
export interface BackgroundRectExportElement extends BaseExportElement {
  type: "backgroundRect";
  fillColor: string; // Background color (hex)
  cornerRadius?: number; // In pixels
  borderColor?: string; // Border color if present
  borderWidth?: number; // Border width in pixels
  background?: string; // Full CSS background string for gradient support
}

// Union type for all export elements
export type ExportElement =
  | TextExportElement
  | TableExportElement
  | ImageExportElement
  | DecorExportElement
  | ShapeExportElement
  | BackgroundRectExportElement;

// Scanned slide data
export interface ScanResult {
  slideId: string;
  width: number; // px
  height: number; // px
  /** Untransformed source slide width used for px-to-PPT font conversion */
  sourceWidth: number;
  /** Untransformed source slide height */
  sourceHeight: number;
  elements: ExportElement[];
  // Resolved presentation styles
  styles: PresentationStyles;
  // Root image data (scanned from DOM)
  rootImage?: RootImageData;
  // Background image URL (for "background" layout type)
  backgroundImageUrl?: string;
}

// Resolved presentation styles from CSS variables
export interface PresentationStyles {
  // Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingColor: string;
  cardBackground: string;

  // Fonts
  headingFont: string;
  bodyFont: string;

  cardBorderRadius: string;
  slideBorderRadius: string;
  buttonBorderRadius: string;

  // Shadows
  cardShadow: string;
  buttonShadow: string;
  slideShadow: string;

  // Transitions
  transition: string;

  // Other
  smartLayoutColor: string;

  // Mask
  mask?: {
    clipPath?: string;
    maskImage?: string;
    maskSize?: string;
    maskPosition?: string;
    maskRepeat?: string;
  };
  // Background image URL for slides with background layout
  backgroundImageUrl?: string;
}

// Root image data
export interface RootImageData {
  url: string; // Either original URL or base64 data URL
  position: ElementPosition;
  isBase64?: boolean; // True if url is base64 data (captured image)
  originalUrl?: string; // Original URL of the image (before capture)
  imageSource?: "generate" | "search" | "gif" | "upload";
  stockImageProvider?: string;
}
