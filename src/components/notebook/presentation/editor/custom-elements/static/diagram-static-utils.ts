"use client";

export type StaticDiagramElement = {
  alignment?: "left" | "center" | "right";
  centerText?: string;
  children?: unknown[];
  icon?: string;
  id?: string | number;
};

export function getStaticDiagramJustifyClass(
  alignment: StaticDiagramElement["alignment"] = "center",
) {
  if (alignment === "left") return "justify-start";
  if (alignment === "right") return "justify-end";
  return "justify-center";
}

export function getStaticDiagramTextAlignClass(
  alignment: StaticDiagramElement["alignment"] = "center",
) {
  if (alignment === "left") return "text-left [&_*]:text-left";
  if (alignment === "right") return "text-right [&_*]:text-right";
  return "text-center [&_*]:text-center";
}
