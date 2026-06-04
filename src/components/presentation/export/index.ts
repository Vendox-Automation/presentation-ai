/**
 * Presentation Export Module
 * DOM-based PPTX export that scans rendered slides
 */

export {
  extractPresentationStyles,
  extractTextStyles,
} from "./cssVariableResolver";
export { scanAllSlides } from "./domSlideScanner";
export { exportPresentationToPptx } from "./domToPptxConverter";
export type {
  BackgroundRectExportElement,
  DecorExportElement,
  ElementPosition,
  ExportElement,
  ImageExportElement,
  NativeShapeType,
  PresentationStyles,
  RootImageData,
  ScanResult,
  ShapeExportElement,
  TableCell,
  TableExportElement,
  TableRow,
  TextExportElement,
} from "./types";
