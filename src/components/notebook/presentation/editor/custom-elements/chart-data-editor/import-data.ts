import JSZip from "jszip";

import {
  getSchemaForMode,
  type ChartDataField,
  type ChartDataRow,
} from "./schemas";
import { type ChartDataMode, type ChartDataType } from "./types";

type SpreadsheetCell = string | number;

const XLSX_NAMESPACE =
  "http://schemas.openxmlformats.org/spreadsheetml/2006/main";

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function parseCsv(text: string): SpreadsheetCell[][] {
  const rows: SpreadsheetCell[][] = [];
  let currentRow: SpreadsheetCell[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      currentValue += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      currentRow.push(coerceCellValue(currentValue));
      currentValue = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      currentRow.push(coerceCellValue(currentValue));
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
    } else {
      currentValue += char;
    }
  }

  currentRow.push(coerceCellValue(currentValue));
  rows.push(currentRow);

  return rows.filter((row) =>
    row.some((cell) => String(cell).trim().length > 0),
  );
}

function coerceCellValue(value: string): SpreadsheetCell {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";
  const numberValue = Number(trimmed);
  return Number.isFinite(numberValue) ? numberValue : trimmed;
}

function getTextContent(parent: Element, tagName: string): string {
  return (
    parent.getElementsByTagNameNS(XLSX_NAMESPACE, tagName)[0]?.textContent ?? ""
  );
}

function parseSharedStrings(xml: string): string[] {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  return Array.from(document.getElementsByTagNameNS(XLSX_NAMESPACE, "si")).map(
    (item) =>
      Array.from(item.getElementsByTagNameNS(XLSX_NAMESPACE, "t"))
        .map((node) => node.textContent ?? "")
        .join(""),
  );
}

function getColumnIndex(cellReference: string): number {
  const letters = cellReference.match(/[A-Z]+/i)?.[0]?.toUpperCase() ?? "A";
  return (
    [...letters].reduce(
      (total, letter) => total * 26 + letter.charCodeAt(0) - 64,
      0,
    ) - 1
  );
}

function parseWorksheet(
  xml: string,
  sharedStrings: readonly string[],
): SpreadsheetCell[][] {
  const document = new DOMParser().parseFromString(xml, "application/xml");

  return Array.from(document.getElementsByTagNameNS(XLSX_NAMESPACE, "row")).map(
    (row) => {
      const cells: SpreadsheetCell[] = [];

      Array.from(row.getElementsByTagNameNS(XLSX_NAMESPACE, "c")).forEach(
        (cell) => {
          const reference = cell.getAttribute("r") ?? "A1";
          const type = cell.getAttribute("t");
          const rawValue = getTextContent(cell, "v");
          const columnIndex = getColumnIndex(reference);

          if (type === "s") {
            cells[columnIndex] = sharedStrings[Number(rawValue)] ?? "";
          } else if (type === "inlineStr") {
            cells[columnIndex] = getTextContent(cell, "t");
          } else {
            cells[columnIndex] = coerceCellValue(rawValue);
          }
        },
      );

      return cells;
    },
  );
}

async function parseXlsx(file: File): Promise<SpreadsheetCell[][]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const sharedStringsFile = zip.file("xl/sharedStrings.xml");
  const sharedStrings = sharedStringsFile
    ? parseSharedStrings(await sharedStringsFile.async("text"))
    : [];
  const firstWorksheet =
    zip.file("xl/worksheets/sheet1.xml") ??
    zip
      .file(/^xl\/worksheets\/sheet\d+\.xml$/)
      .sort((left, right) => left.name.localeCompare(right.name))[0];

  if (!firstWorksheet) {
    throw new Error("No worksheet was found in the Excel file.");
  }

  return parseWorksheet(await firstWorksheet.async("text"), sharedStrings);
}

function fieldMatchesHeader(field: ChartDataField, header: string): boolean {
  const normalizedHeader = normalizeHeader(header);
  return (
    normalizedHeader === normalizeHeader(field.key) ||
    normalizedHeader === normalizeHeader(field.label)
  );
}

function rowLooksLikeHeader(
  row: readonly SpreadsheetCell[] | undefined,
  fields: readonly ChartDataField[],
): boolean {
  if (!row || row.length === 0) return false;

  const normalizedHeaders = row.map((cell) => normalizeHeader(String(cell)));
  const matchesKnownField = fields.some((field) =>
    normalizedHeaders.some(
      (header) =>
        header === normalizeHeader(field.key) ||
        header === normalizeHeader(field.label),
    ),
  );
  const allText = row.every((cell) => typeof cell === "string");

  return matchesKnownField || allText;
}

function getCellForField(
  row: readonly SpreadsheetCell[],
  headers: readonly string[],
  field: ChartDataField,
  fieldIndex: number,
): SpreadsheetCell {
  const headerIndex = headers.findIndex((header) =>
    fieldMatchesHeader(field, header),
  );
  return row[headerIndex >= 0 ? headerIndex : fieldIndex] ?? "";
}

function normalizeImportedValue(
  value: SpreadsheetCell,
  field: ChartDataField,
): string | number {
  if (field.type === "number") {
    const numericValue = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  return String(value ?? "");
}

function rowsFromSpreadsheet(
  spreadsheetRows: SpreadsheetCell[][],
  chartType: ChartDataMode,
): ChartDataRow[] {
  const schema = getSchemaForMode(chartType);
  const hasHeader = rowLooksLikeHeader(
    spreadsheetRows[0],
    schema.supportsSeries
      ? [
          ...schema.fixedFields,
          { key: "value", label: "Value", type: "number" },
        ]
      : schema.fixedFields,
  );
  const headers = hasHeader
    ? (spreadsheetRows[0] ?? []).map((cell) => String(cell))
    : [];
  const bodyRows = hasHeader ? spreadsheetRows.slice(1) : spreadsheetRows;

  if (schema.supportsSeries) {
    const knownLabelIndex = headers.findIndex((header) =>
      ["label", "name", "category"].includes(normalizeHeader(header)),
    );
    const labelHeaderIndex = knownLabelIndex >= 0 ? knownLabelIndex : 0;
    const seriesHeaders =
      headers.length > 0
        ? headers.filter((_, index) => index !== labelHeaderIndex)
        : ["value"];

    return bodyRows
      .filter((row) => row.some((cell) => String(cell).trim().length > 0))
      .map((row, rowIndex) => {
        const normalizedRow: ChartDataRow = {
          label: String(row[labelHeaderIndex] ?? `Item ${rowIndex + 1}`),
        };

        seriesHeaders.forEach((header, index) => {
          const sourceIndex = index >= labelHeaderIndex ? index + 1 : index;
          const numberValue = Number(row[sourceIndex]);
          normalizedRow[header || `Series ${index + 1}`] = Number.isFinite(
            numberValue,
          )
            ? numberValue
            : 0;
        });

        return normalizedRow;
      });
  }

  return bodyRows
    .filter((row) => row.some((cell) => String(cell).trim().length > 0))
    .map((row) =>
      schema.fixedFields.reduce<ChartDataRow>((normalizedRow, field, index) => {
        const value = getCellForField(row, headers, field, index);
        normalizedRow[field.key] = normalizeImportedValue(value, field);
        return normalizedRow;
      }, {}),
    );
}

export async function importChartDataFromFile(
  file: File,
  chartType: ChartDataMode,
): Promise<ChartDataType> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const spreadsheetRows =
    extension === "xlsx" || extension === "xlsm"
      ? await parseXlsx(file)
      : parseCsv(await file.text());
  const rows = rowsFromSpreadsheet(spreadsheetRows, chartType);

  if (rows.length === 0) {
    throw new Error("The imported file did not contain any chart rows.");
  }

  return rows as ChartDataType;
}
