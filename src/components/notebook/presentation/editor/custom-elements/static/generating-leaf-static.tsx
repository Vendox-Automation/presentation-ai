import { SlateLeaf, type SlateLeafProps } from "platejs/static";

import { usePresentationState } from "@/states/presentation-state";

export function GeneratingLeafStatic(props: SlateLeafProps) {
  const isGeneratingPresentation = usePresentationState(
    (state) => state.isGeneratingPresentation,
  );
  type LeafWithGenerating = { generating?: boolean };
  const isGenerating =
    isGeneratingPresentation &&
    Boolean(
      (props.leaf as unknown as LeafWithGenerating | undefined)?.generating,
    );

  return (
    <SlateLeaf {...props}>
      {props.children}
      {isGenerating && (
        <span
          aria-hidden="true"
          className="ml-0.5 inline-flex items-baseline gap-1"
        >
          <span className="animate-blink inline-block h-[1.6em] w-0.5 translate-y-[0.45em] bg-purple-600" />
          <sup className="text-[0.85em] font-semibold leading-none text-purple-600">
            Generating
          </sup>
        </span>
      )}
    </SlateLeaf>
  );
}
