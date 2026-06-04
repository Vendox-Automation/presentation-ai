"use client";

import { NodeApi, PathApi } from "platejs";
import { PlateElement, type PlateElementProps } from "platejs/react";

import { cn } from "@/lib/utils";
import { type TProsConsGroupElement } from "../plugins/pros-cons-plugin";
import { getAlignmentClasses } from "../utils";

export const ProsItem = (props: PlateElementProps) => {
  const parentPath = PathApi.parent(props.path);
  const parentElement = NodeApi.get(props.editor, parentPath);
  const { alignment = "left" } = parentElement as TProsConsGroupElement;
  return (
    <PlateElement
      {...props}
      className={cn("flex h-full flex-col rounded-lg p-6 text-white")}
      data-bg-export="true"
      style={{
        background: "linear-gradient(135deg, #27ae60 0%, #229954 100%)",
      }}
    >
      <div className={cn(getAlignmentClasses(alignment))}>{props.children}</div>
    </PlateElement>
  );
};
