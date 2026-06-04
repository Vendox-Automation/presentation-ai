import { updatePresentation } from "@/app/_actions/notebook/presentation/presentationActions";
import { buildPresentationCustomization } from "@/lib/presentation/customization";
import { usePresentationState } from "@/states/presentation-state";

const PERSIST_DELAY_MS = 500;

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let persistVersion = 0;

function buildCurrentLayoutSelectionPayload() {
  const state = usePresentationState.getState();

  if (!state.currentPresentationId) {
    return null;
  }

  return {
    id: state.currentPresentationId,
    outline: state.outline,
    customization: buildPresentationCustomization({
      customThemeData: state.customThemeData,
      themeDataByTheme: state.themeDataByTheme,
      generatedThemeData: state.generatedThemeData,
      theme: state.theme,
      pageStyle: state.pageStyle,
      presentationStyle: state.presentationStyle,
      generationAspectRatio: state.generationAspectRatio,
      textContent: state.textContent,
      tone: state.tone,
      audience: state.audience,
      scenario: state.scenario,
      pageBackground: state.pageBackground,
      selectedSlideTemplates: state.selectedSlideTemplates,
      outlineItemIds: state.outlineItemIds,
      outlineTemplateOverrides: state.outlineTemplateOverrides,
    }),
  };
}

async function persistLatestLayoutSelection(version: number): Promise<void> {
  const payload = buildCurrentLayoutSelectionPayload();

  if (!payload) {
    return;
  }

  usePresentationState.getState().setSavingStatus("saving");

  const result = await updatePresentation(payload);

  if (version !== persistVersion) {
    return;
  }

  if (!result.success) {
    console.error(
      "Failed to persist outline layout selection:",
      result.message,
    );
    usePresentationState.getState().setSavingStatus("idle");
    return;
  }

  usePresentationState.getState().setSavingStatus("saved");
  setTimeout(() => {
    if (version === persistVersion) {
      usePresentationState.getState().setSavingStatus("idle");
    }
  }, 2000);
}

export function persistOutlineLayoutSelection(): void {
  persistVersion += 1;
  const version = persistVersion;

  if (persistTimer) {
    clearTimeout(persistTimer);
  }

  persistTimer = setTimeout(() => {
    persistTimer = null;
    void persistLatestLayoutSelection(version);
  }, PERSIST_DELAY_MS);
}
