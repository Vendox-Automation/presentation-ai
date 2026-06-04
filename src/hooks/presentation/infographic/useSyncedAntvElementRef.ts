"use client";

import { useEffect, useRef } from "react";

import { type TAntvInfographicElement } from "@/components/notebook/presentation/editor/plugins/antv-infographic-plugin";

export function useSyncedAntvElementRef(element: TAntvInfographicElement) {
  const elementRef = useRef(element);

  useEffect(() => {
    elementRef.current = element;
  }, [element]);

  return elementRef;
}
