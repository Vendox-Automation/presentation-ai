"use client";

import { PlateLeaf, type PlateLeafProps } from "platejs/react";

import { usePresentationState } from "@/states/presentation-state";

export const GeneratingLeaf = ({ children, ref, ...props }: PlateLeafProps) => {
  const { leaf } = props;
  const { isGeneratingPresentation } = usePresentationState();
  const isGenerating = isGeneratingPresentation && (leaf.generating as boolean);

  return (
    <PlateLeaf ref={ref} {...props}>
      {children}
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
    </PlateLeaf>
  );
};
