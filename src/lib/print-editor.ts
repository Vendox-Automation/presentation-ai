"use client";

const PRINT_PORTAL_ATTRIBUTE = "data-editor-print-portal";
const PRINT_CONTENT_ATTRIBUTE = "data-editor-print-content";
const PRINT_STYLE_ATTRIBUTE = "data-editor-print-style";
const PRINT_TITLE_ATTRIBUTE = "data-print-title";
const PRINT_TITLE_TEXT_ATTRIBUTE = "data-print-title-text";

function createPrintStyleElement(): HTMLStyleElement {
  const style = document.createElement("style");
  style.setAttribute(PRINT_STYLE_ATTRIBUTE, "true");
  style.textContent = `
    @media screen {
      [${PRINT_PORTAL_ATTRIBUTE}="true"] {
        display: none !important;
      }
    }

    @media print {
      @page {
        margin: 0;
        size: auto;
      }

      html,
      body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        min-height: auto !important;
        background: #fff !important;
      }

      body > *:not([${PRINT_PORTAL_ATTRIBUTE}="true"]) {
        display: none !important;
      }

      [${PRINT_PORTAL_ATTRIBUTE}="true"] {
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        background: #fff !important;
      }

      [${PRINT_CONTENT_ATTRIBUTE}="true"] {
        display: block !important;
        box-sizing: border-box !important;
        width: 100% !important;
        max-width: none !important;
        min-height: auto !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        background: #fff !important;
      }

      [${PRINT_CONTENT_ATTRIBUTE}="true"] {
        color-scheme: light !important;
        --background: 0 0% 100% !important;
        --foreground: 0 0% 3.9% !important;
        --dbi: 0 0% 0% !important;
        --dbi-background: 0 0% 100% !important;
        --card: 0 0% 100% !important;
        --card-foreground: 0 0% 3.9% !important;
        --popover: 0 0% 100% !important;
        --popover-foreground: 0 0% 3.9% !important;
        --primary: 0 0% 9% !important;
        --primary-foreground: 0 0% 98% !important;
        --brand: 0 0% 9% !important;
        --secondary: 0 0% 96.1% !important;
        --secondary-foreground: 0 0% 9% !important;
        --muted: 0 0% 92.1% !important;
        --muted-foreground: 0 0% 45.1% !important;
        --accent: 0 0% 96.1% !important;
        --accent-foreground: 0 0% 9% !important;
        --destructive: 0 84.2% 60.2% !important;
        --destructive-foreground: 0 0% 98% !important;
        --border: 0 0% 89.8% !important;
        --input: 0 0% 89.8% !important;
        --ring: 0 0% 3.9% !important;
      }

      [${PRINT_CONTENT_ATTRIBUTE}="true"] * {
        max-height: none !important;
      }

      [${PRINT_CONTENT_ATTRIBUTE}="true"],
      [${PRINT_CONTENT_ATTRIBUTE}="true"] * {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      [${PRINT_CONTENT_ATTRIBUTE}="true"] [data-print-doc-shell="true"] {
        background: #fff !important;
      }

      [${PRINT_CONTENT_ATTRIBUTE}="true"] [data-print-doc-layout="true"] {
        display: block !important;
        height: auto !important;
      }

      [${PRINT_CONTENT_ATTRIBUTE}="true"] [data-print-doc-width="true"] {
        width: 100% !important;
        max-width: none !important;
        padding: 0 !important;
      }

      [${PRINT_CONTENT_ATTRIBUTE}="true"] [data-print-doc-surface="true"] {
        min-height: auto !important;
        margin: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        color: hsl(0 0% 3.9%) !important;
      }

      [${PRINT_CONTENT_ATTRIBUTE}="true"] [data-print-doc-surface="true"] :where(
          h1,
          h2,
          h3,
          h4,
          h5,
          h6,
          p,
          span,
          div,
          li,
          ul,
          ol,
          blockquote,
          strong,
          em,
          a,
          code,
          pre,
          td,
          th
        ) {
        color: inherit !important;
      }

      [${PRINT_CONTENT_ATTRIBUTE}="true"] [data-print-doc-surface="true"] :where(
          input,
          textarea,
          [contenteditable="true"],
          [data-slate-editor="true"]
        ) {
        color: inherit !important;
        -webkit-text-fill-color: currentcolor !important;
      }

      [${PRINT_CONTENT_ATTRIBUTE}="true"] [data-print-doc-surface="true"] :where(
          input,
          textarea
        )::placeholder {
        color: hsl(0 0% 45.1%) !important;
      }

      [${PRINT_CONTENT_ATTRIBUTE}="true"] [data-print-doc-body="true"] {
        min-height: auto !important;
        padding: 1.25rem 2rem 2rem !important;
      }

      [${PRINT_CONTENT_ATTRIBUTE}="true"] [${PRINT_TITLE_TEXT_ATTRIBUTE}="true"] {
        display: block !important;
        width: 100% !important;
        min-width: 0 !important;
        margin: 0 0 1rem 0 !important;
        padding: 0 !important;
        white-space: pre-wrap !important;
        overflow-wrap: anywhere !important;
        word-break: break-word !important;
      }
    }
  `;

  return style;
}

function replacePrintableTitleFields(root: HTMLElement): void {
  const titleFields = root.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement
  >(`[${PRINT_TITLE_ATTRIBUTE}="true"]`);

  for (const titleField of titleFields) {
    const printableTitle = document.createElement("div");
    printableTitle.setAttribute(PRINT_TITLE_TEXT_ATTRIBUTE, "true");
    printableTitle.className = titleField.className;
    printableTitle.textContent =
      titleField.value.trim() || titleField.placeholder.trim();

    titleField.replaceWith(printableTitle);
  }
}

function clonePrintTarget(target: HTMLElement): HTMLElement {
  const clone = target.cloneNode(true);

  if (!(clone instanceof HTMLElement)) {
    throw new Error("Failed to clone editor for printing.");
  }

  clone.setAttribute(PRINT_CONTENT_ATTRIBUTE, "true");
  replacePrintableTitleFields(clone);

  return clone;
}

export function printEditorElement(target: HTMLElement): void {
  const portal = document.createElement("div");
  portal.setAttribute(PRINT_PORTAL_ATTRIBUTE, "true");

  const clonedTarget = clonePrintTarget(target);
  const style = createPrintStyleElement();

  portal.appendChild(clonedTarget);
  document.body.appendChild(portal);
  document.head.appendChild(style);

  const cleanup = () => {
    style.remove();
    portal.remove();
  };

  if ("onafterprint" in window) {
    window.addEventListener("afterprint", cleanup, { once: true });
  }

  try {
    window.print();
  } finally {
    if (!("onafterprint" in window)) {
      cleanup();
    }
  }
}
