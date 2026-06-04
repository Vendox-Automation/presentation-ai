export function getPresentationTitleSearchQuery(title: string | null): string {
  const trimmedTitle = title?.trim() ?? "";
  if (!trimmedTitle) return "";

  const colonIndex = trimmedTitle.indexOf(":");
  if (colonIndex > 0) {
    return trimmedTitle.slice(0, colonIndex).trim();
  }

  return trimmedTitle.split(/\s+/)[0] ?? "";
}
