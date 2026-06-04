"use client";

import React from "react";

import { type PlateSlide } from "../utils/parser";
import { PresentationRoot } from "./components/PresentationRoot";
import { StaticPlate } from "./components/StaticPlate";
import { slideSignature } from "./utils/slideSignature";

interface PresentationEditorStaticViewProps {
  initialContent?: PlateSlide;
  className?: string;
  id: string;
  isPresenting?: boolean;
}

// slideSignature is imported from utils to keep behavior identical

const StaticPresentationEditor = React.memo(
  ({
    initialContent,
    className,
    id,
    isPresenting = false,
  }: PresentationEditorStaticViewProps) => {
    return (
      <PresentationRoot
        className={className}
        fontsToLoad={[]}
        isPresenting={isPresenting}
        readOnly={true}
        isStatic={true}
        initialContent={initialContent}
      >
        <StaticPlate initialContent={initialContent} id={id} />
      </PresentationRoot>
    );
  },
  (prev, next) => {
    if (prev.id !== next.id) return false;
    if (prev.isPresenting !== next.isPresenting) return false;
    if (
      slideSignature(prev.initialContent) !==
      slideSignature(next.initialContent)
    )
      return false;
    if (prev.className !== next.className) return false;
    return true;
  },
);

export default StaticPresentationEditor;
