"use client";

import { createContext, type ReactNode } from "react";

import { type LayoutType } from "../../utils/parser";

type PresentationRenderContextValue = {
  layoutType?: LayoutType;
  isStatic: boolean;
};

const PresentationRenderContext = createContext<PresentationRenderContextValue>(
  {
    isStatic: false,
  },
);

export function PresentationRenderProvider({
  children,
  layoutType,
  isStatic,
}: PresentationRenderContextValue & { children: ReactNode }) {
  return (
    <PresentationRenderContext.Provider value={{ layoutType, isStatic }}>
      {children}
    </PresentationRenderContext.Provider>
  );
}
