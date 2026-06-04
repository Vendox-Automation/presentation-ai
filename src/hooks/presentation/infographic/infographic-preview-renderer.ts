"use client";

import { Infographic, type InfographicOptions } from "@antv/infographic";

import { enforceInfographicCardBackground } from "@/components/notebook/presentation/editor/utils/infographic-card-background";
import { registerLucideIconLoader } from "./infographic-icon-loader";

type PreviewRenderer = {
  container: HTMLDivElement;
  infographic: Infographic;
};

let previewRenderer: PreviewRenderer | null = null;
let previewRenderQueue: Promise<void> = Promise.resolve();

function waitForAnimationFrame(): Promise<void> {
  return new Promise((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function getPreviewRenderer(): PreviewRenderer {
  if (previewRenderer) return previewRenderer;

  registerLucideIconLoader();

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = "240px";
  container.style.height = "135px";
  container.style.pointerEvents = "none";
  container.style.opacity = "0";
  container.style.contain = "layout style paint";
  document.body.appendChild(container);

  previewRenderer = {
    container,
    infographic: new Infographic({
      container,
      width: "100%",
      height: "100%",
      editable: false,
    }),
  };

  return previewRenderer;
}

async function renderInfographicPreviewHtmlTask(
  payload: Partial<InfographicOptions> | string,
): Promise<string> {
  const { container, infographic } = getPreviewRenderer();

  container.replaceChildren();
  infographic.render(payload);
  await waitForAnimationFrame();
  await waitForAnimationFrame();
  enforceInfographicCardBackground(container);

  return container.innerHTML;
}

export function renderInfographicPreviewHtml(
  payload: Partial<InfographicOptions> | string,
): Promise<string> {
  const task = previewRenderQueue.then(() =>
    renderInfographicPreviewHtmlTask(payload),
  );

  previewRenderQueue = task.then(
    () => undefined,
    () => undefined,
  );

  return task;
}
