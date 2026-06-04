"use client";

import {
  type InfographicOptions,
  type ParsedInfographicOptions,
} from "@antv/infographic";

export function cloneSerializableOptions(
  options: Partial<InfographicOptions>,
): Partial<InfographicOptions> {
  try {
    return JSON.parse(JSON.stringify(options)) as Partial<InfographicOptions>;
  } catch {
    return {
      data: options.data,
      elements: options.elements,
      height: options.height,
      padding: options.padding,
      svg: options.svg,
      template: options.template,
      theme: options.theme,
      themeConfig: options.themeConfig,
      width: options.width,
    };
  }
}

export function pickSerializableOptions(
  options: Partial<InfographicOptions>,
): Partial<InfographicOptions> {
  const {
    container: _container,
    plugins: _plugins,
    interactions: _interactions,
    ...rest
  } = options;

  return cloneSerializableOptions(rest);
}

export function toSerializableOptionsFromParsed(
  parsed: Partial<ParsedInfographicOptions>,
): Partial<InfographicOptions> {
  return cloneSerializableOptions({
    data: parsed.data,
    elements: parsed.shapes,
    height: parsed.height,
    padding: parsed.padding,
    svg: parsed.svg,
    template: parsed.template,
    theme: parsed.theme,
    themeConfig: parsed.themeConfig,
    width: parsed.width,
  });
}

function normalizeSerializableValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeSerializableValue);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .filter((key) => record[key] !== undefined)
        .map((key) => [key, normalizeSerializableValue(record[key])]),
    );
  }

  return value;
}

export function getSerializableOptionsKey(value: unknown): string {
  return JSON.stringify(normalizeSerializableValue(value)) ?? "undefined";
}
