"use client";

import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";
import { type TBulletGroupElement } from "../plugins/bullet-plugin";
import { columnSizeVariant, getDefaultColumnSize } from "../utils";

export function BulletsElement({
  element,
  children,
  className,
  ref,
  ...props
}: PlateElementProps<TBulletGroupElement>) {
  const { alignment = "center" } = element;
  const columnSize =
    element.columnSize ?? getDefaultColumnSize(element.children.length);

  return (
    <PlateElement
      ref={ref}
      element={element}
      className={cn("relative my-0", className)}
      {...props}
    >
      <div
        className={cn(
          "max-w-full gap-6",
          columnSizeVariant({ columnSize }),
          alignment === "left" && "justify-start",
          alignment === "right" && "justify-end",
          alignment === "center" && "justify-center",
        )}
      >
        {children}
      </div>
    </PlateElement>
  );
}
