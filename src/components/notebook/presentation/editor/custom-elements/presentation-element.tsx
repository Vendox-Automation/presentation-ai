"use client";

import { PlateElement, type StyledPlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";

export const PresentationElement = ({
  children,
  ref,
  className,
  ...props
}: StyledPlateElementProps) => {
  return (
    <PlateElement
      ref={ref}
      className={cn(
        "slate-selectable relative transition-all duration-300 select-text!",
        className,
      )}
      {...props}
    >
      {children}
    </PlateElement>
  );
};

PresentationElement.displayName = "PresentationElement";
