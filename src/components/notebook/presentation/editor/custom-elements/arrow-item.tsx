"use client";

import { NodeApi, PathApi } from "platejs";
import { PlateElement, type PlateElementProps } from "platejs/react";
import { useEffect, useRef, useState, type RefObject } from "react";

import { IconPicker } from "@/components/ui/icon-picker";
import { cn } from "@/lib/utils";
import {
  type TArrowListElement,
  type TArrowListItemElement,
} from "../plugins/arrow-plugin";
import { getAlignmentClasses } from "../utils";
import { getPresentationAccentColor } from "./color-utils";
import { PresentationIcon } from "./presentation-icon";

// ArrowItem component for individual items in the arrow visualization
export const ArrowItem = (props: PlateElementProps<TArrowListItemElement>) => {
  const path = props.editor.api.findPath(props.element) ?? [-1];
  const parentPath = PathApi.parent(path);
  const parentElement = NodeApi.get(props.editor, parentPath);
  const { orientation, svgType, showIcon } = parentElement as TArrowListElement;
  const contentRef = useRef<HTMLDivElement | null>(null);
  const isHorizontal = orientation === "horizontal";
  const { icon } = props.element as unknown as { icon?: string };

  // Get alignment - use item alignment if set, otherwise inherit from parent
  const itemAlignment = props.element.alignment;
  const parentAlignment = (parentElement as TArrowListElement)?.alignment;
  const alignment = itemAlignment ?? parentAlignment ?? "left";
  const accentColor = getPresentationAccentColor(
    props.element,
    parentElement as TArrowListElement | undefined,
    "var(--presentation-smart-layout, var(--presentation-primary))",
  );

  const handleIconSelect = (iconName: string) => {
    const itemPath = props.editor.api.findPath(props.element);
    if (!itemPath) return;
    props.editor.tf.setNodes({ icon: iconName }, { at: itemPath });
  };

  return (
    <PlateElement
      {...props}
      className={cn(
        "group group/arrow-item relative mb-2 flex w-full max-w-full min-w-0 gap-6 pl-4",
        isHorizontal && "flex-col gap-3 pl-0",
        !isHorizontal && "items-start",
        alignment === "right" && !isHorizontal && "pr-4 pl-0 flex-row-reverse",
        alignment === "center" && "justify-center",
      )}
    >
      {/* Chevron icon column */}
      <div
        className={cn(
          "relative grid shrink-0",
          isHorizontal ? "h-24 w-full" : "h-full w-24",
        )}
      >
        <ArrowChevron
          className={cn(
            "relative z-50 block overflow-visible",
            isHorizontal ? "top-0 left-0" : "top-0",
          )}
          isHorizontal={isHorizontal}
          sizeTargetRef={contentRef}
          svgType={svgType}
          color={accentColor}
          icon={icon}
          showIcon={!!showIcon}
          onIconSelect={handleIconSelect}
        />
      </div>
      {/* Content column */}
      <div
        ref={contentRef}
        className={cn("grid min-w-0 flex-1", !isHorizontal && "self-start")}
      >
        <div className={cn("min-w-0 w-full", getAlignmentClasses(alignment))}>
          {props.children}
        </div>
      </div>
    </PlateElement>
  );
};

// Extracted SVG chevron for reuse and clarity
type ArrowChevronProps = {
  isHorizontal: boolean;
  sizeTargetRef: RefObject<HTMLDivElement | null>;
  svgType: "arrow" | "pill" | "parallelogram";
  color: string;
  icon?: string;
  showIcon: boolean;
  className?: string;
  onIconSelect?: (iconName: string) => void;
  disabled?: boolean;
};

export const ArrowChevron = ({
  isHorizontal,
  sizeTargetRef,
  svgType,
  color,
  className,
  icon,
  showIcon,
  onIconSelect,
  disabled,
}: ArrowChevronProps) => {
  const [height, setHeight] = useState(90);
  const [width, setWidth] = useState(90);
  const pillHorizontalInset = 8;
  const pillVerticalInset = 6;
  const pillHeight = 78;
  const pillWidth = 72;

  useEffect(() => {
    if (!sizeTargetRef.current) return;

    const updateDimensions = () => {
      const h = sizeTargetRef.current?.offsetHeight ?? 90;
      const w = sizeTargetRef.current?.offsetWidth ?? 90;
      setHeight(Math.max(h, 80));
      setWidth(Math.max(w, 80));
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(sizeTargetRef.current);

    return () => resizeObserver.disconnect();
  }, [sizeTargetRef]);

  const pathD = (() => {
    if (svgType === "pill") return ""; // handled as <rect/>
    if (svgType === "parallelogram") {
      const offset = 18;
      return isHorizontal
        ? `M${offset},0 L${width},0 L${Math.max(width - offset, 0)},90 L0,90 Z`
        : `M0,${offset} L90,0 L90,${Math.max(height - offset, 0)} L0,${height} Z`;
    }
    // default: arrow
    return isHorizontal
      ? `M${Math.max(width - 18, 0)},0L${width},45L${Math.max(width - 18, 0)},90L0,90L18,45L0,0Z`
      : `M0,${Math.max(height - 18, 0)}L45,${height}L90,${Math.max(height - 18, 0)}L90,0L45,18L0,0Z`;
  })();

  const svgWidth = isHorizontal ? width : svgType === "pill" ? 80 : 90;
  const svgHeight = isHorizontal
    ? 90
    : svgType === "pill"
      ? Math.max(height, 100)
      : height;
  const hasIcon = Boolean(icon?.trim());

  return (
    <>
      <svg
        className={cn(className, "max-w-full")}
        style={{ justifySelf: isHorizontal ? undefined : "center" }}
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="none"
        data-shape={svgType}
        data-orientation={isHorizontal ? "horizontal" : "vertical"}
        data-fill-color={color}
      >
        {svgType === "pill" ? (
          isHorizontal ? (
            <rect
              x={pillHorizontalInset}
              y={pillVerticalInset}
              width={Math.max(width - pillHorizontalInset * 2, 0)}
              height={pillHeight}
              rx={pillHeight / 2}
              ry={pillHeight / 2}
              style={{ fill: color }}
            />
          ) : (
            <rect
              x={4}
              y={pillVerticalInset}
              width={pillWidth}
              height={Math.max(height - pillVerticalInset * 2, 88)}
              rx={pillWidth / 2}
              ry={pillWidth / 2}
              style={{ fill: color }}
            />
          )
        ) : (
          <path d={pathD} style={{ fill: color }}></path>
        )}
      </svg>

      {showIcon ? (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-50 flex items-center justify-center",
          )}
        >
          {disabled ? (
            hasIcon ? (
              <div
                className="flex size-10 items-center justify-center rounded-full"
                style={{ color: "var(--presentation-background)" }}
              >
                <PresentationIcon icon={icon} size={20} />
              </div>
            ) : null
          ) : (
            <IconPicker
              disabled={disabled}
              defaultIcon={icon}
              hidePlaceholderWhenEmpty
              onIconSelect={(name) => onIconSelect?.(name)}
              onIconRemove={() => onIconSelect?.("")}
              className="pointer-events-auto size-10 rounded-full shadow-none transition-opacity hover:opacity-80"
              size="md"
              style={{
                backgroundColor: color,
                borderColor: "transparent",
                color: "var(--presentation-background)",
              }}
            />
          )}
        </div>
      ) : null}
    </>
  );
};

// cleanup: removed unused/incomplete stubs
