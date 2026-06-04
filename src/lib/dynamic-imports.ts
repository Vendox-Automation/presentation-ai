export async function loadHtml2Canvas() {
  const module = await import("html2canvas-pro");
  return module.default;
}

export async function loadPdfLib() {
  return import("pdf-lib");
}
