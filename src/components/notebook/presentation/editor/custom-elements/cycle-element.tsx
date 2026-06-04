"use client";

import { PlateElement, type StyledPlateElementProps } from "platejs/react";
import React from "react";

import { IconPicker } from "@/components/ui/icon-picker";
import { useForceUpdateChildrenOnLengthChange } from "@/hooks/presentation/useForceUpdateChildrenOnLengthChange";
import { cn } from "@/lib/utils";
import {
  type TCycleGroupElement,
  type TCycleItemElement,
} from "../plugins/cycle-plugin";
import { getPresentationAccentColor } from "./color-utils";
import { PresentationIcon } from "./presentation-icon";

export type CycleColumnSide = "left" | "right" | "stacked";

const CYCLE_MIN_LAYOUT_WIDTH_PX = 720;
export const CYCLE_WHEEL_SIZE_PX = 288;

export interface CycleContextValue {
  isMultiColumn: boolean;
  side: CycleColumnSide;
}

export const CycleContext = React.createContext<CycleContextValue>({
  isMultiColumn: true,
  side: "stacked",
});

type CycleFitStyle = React.CSSProperties;

const CYCLE_SCALE_EPSILON = 0.001;
const CYCLE_SIZE_EPSILON_PX = 0.5;

function getCycleLayoutWidth(availableWidth: number) {
  return Math.max(availableWidth, CYCLE_MIN_LAYOUT_WIDTH_PX);
}

function getCycleFitScale(availableWidth: number, layoutWidth: number) {
  return availableWidth > 0 ? Math.min(1, availableWidth / layoutWidth) : 1;
}

export function useCycleFitScale<TContainer extends HTMLElement>() {
  const containerRef = React.useRef<TContainer | null>(null);
  const layoutRef = React.useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = React.useState(1);
  const [layoutWidth, setLayoutWidth] = React.useState(
    CYCLE_MIN_LAYOUT_WIDTH_PX,
  );
  const [layoutHeight, setLayoutHeight] = React.useState(CYCLE_WHEEL_SIZE_PX);

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    let frame = 0;
    const updateScale = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const availableWidth = container.clientWidth;
        const nextLayoutWidth = getCycleLayoutWidth(availableWidth);
        const nextScale = getCycleFitScale(availableWidth, nextLayoutWidth);

        setScale((currentScale) => {
          return Math.abs(currentScale - nextScale) > CYCLE_SCALE_EPSILON
            ? nextScale
            : currentScale;
        });

        setLayoutWidth((currentWidth) => {
          return Math.abs(currentWidth - nextLayoutWidth) >
            CYCLE_SIZE_EPSILON_PX
            ? nextLayoutWidth
            : currentWidth;
        });
      });
    };

    updateScale();

    if (typeof ResizeObserver === "undefined") {
      return () => cancelAnimationFrame(frame);
    }

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  React.useLayoutEffect(() => {
    const layout = layoutRef.current;
    if (!layout) {
      return;
    }

    let frame = 0;
    const updateHeight = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const nextHeight = Math.max(layout.scrollHeight, CYCLE_WHEEL_SIZE_PX);

        setLayoutHeight((currentHeight) =>
          Math.abs(currentHeight - nextHeight) > CYCLE_SIZE_EPSILON_PX
            ? nextHeight
            : currentHeight,
        );
      });
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      return () => cancelAnimationFrame(frame);
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(layout);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const scaledWidth = layoutWidth * scale;
  const scaledHeight = layoutHeight * scale;

  return {
    containerRef,
    layoutRef,
    frameStyle: {
      height: scaledHeight,
      maxWidth: "100%",
      overflow: "visible",
      position: "relative",
      width: scaledWidth,
    } satisfies React.CSSProperties,
    fitStyle: {
      transform: `scale(${scale})`,
      transformOrigin: "top left",
      width: layoutWidth,
    } satisfies CycleFitStyle,
  };
}

function getCycleItemKey(item: unknown, fallbackIndex: number) {
  if (
    typeof item === "object" &&
    item !== null &&
    "id" in item &&
    (typeof item.id === "string" || typeof item.id === "number")
  ) {
    return item.id;
  }

  return `cycle-item-${fallbackIndex}`;
}

const generateSegmentPath = (
  index: number,
  totalSegments: number,
  innerRadius: number,
  outerRadius: number,
  centerX: number,
  centerY: number,
) => {
  const anglePerSegment = (2 * Math.PI) / totalSegments;
  const startAngle = index * anglePerSegment;
  const endAngle = (index + 1) * anglePerSegment;

  const outerStart = {
    x: centerX + outerRadius * Math.cos(startAngle),
    y: centerY + outerRadius * Math.sin(startAngle),
  };
  const outerEnd = {
    x: centerX + outerRadius * Math.cos(endAngle),
    y: centerY + outerRadius * Math.sin(endAngle),
  };
  const innerStart = {
    x: centerX + innerRadius * Math.cos(startAngle),
    y: centerY + innerRadius * Math.sin(startAngle),
  };
  const innerEnd = {
    x: centerX + innerRadius * Math.cos(endAngle),
    y: centerY + innerRadius * Math.sin(endAngle),
  };

  const notchDepth = 7;
  const notchPosition = 0.5;

  const endNotchRadius =
    innerRadius + (outerRadius - innerRadius) * notchPosition;
  const endNotchBase = {
    x: centerX + endNotchRadius * Math.cos(endAngle),
    y: centerY + endNotchRadius * Math.sin(endAngle),
  };
  const endNotchTip = {
    x: endNotchBase.x + notchDepth * Math.sin(endAngle),
    y: endNotchBase.y - notchDepth * Math.cos(endAngle),
  };

  const startNotchRadius =
    innerRadius + (outerRadius - innerRadius) * notchPosition;
  const startNotchBase = {
    x: centerX + startNotchRadius * Math.cos(startAngle),
    y: centerY + startNotchRadius * Math.sin(startAngle),
  };
  const startNotchTip = {
    x: startNotchBase.x + notchDepth * Math.sin(startAngle),
    y: startNotchBase.y - notchDepth * Math.cos(startAngle),
  };

  const largeArcFlag = anglePerSegment > Math.PI ? 1 : 0;

  let path = `M ${outerStart.x} ${outerStart.y}`;
  path += ` A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`;
  path += ` L ${endNotchTip.x} ${endNotchTip.y}`;
  path += ` L ${innerEnd.x} ${innerEnd.y}`;
  path += ` A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`;
  path += ` L ${startNotchTip.x} ${startNotchTip.y}`;
  path += ` L ${outerStart.x} ${outerStart.y}`;
  path += " Z";
  return path;
};

function generateRoundedSlicePath(
  index: number,
  total: number,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  cornerRadius = 3,
): string {
  const count = Math.max(total, 1);
  const startAngle = (index / count) * 2 * Math.PI - Math.PI / 2;
  const endAngle = ((index + 1) / count) * 2 * Math.PI - Math.PI / 2;

  // Clamp corner radius so it doesn't exceed segment dimensions
  const maxArcCorner =
    ((endAngle - startAngle) * Math.min(outerR, innerR)) / 2.5;
  const maxRadialCorner = (outerR - innerR) / 2.5;
  const cr = Math.min(cornerRadius, maxArcCorner, maxRadialCorner);

  const outerAngOff = cr / outerR;
  const innerAngOff = cr / innerR;

  // Effective arc spans after rounding
  const outerArcSpan = endAngle - startAngle - 2 * outerAngOff;
  const innerArcSpan = endAngle - startAngle - 2 * innerAngOff;
  const outerLargeArc = outerArcSpan > Math.PI ? 1 : 0;
  const innerLargeArc = innerArcSpan > Math.PI ? 1 : 0;

  // Helper to format a point
  const p = (x: number, y: number) => `${x.toFixed(3)} ${y.toFixed(3)}`;

  // Corner 1: outer-start (where start radial meets outer arc)
  const c1 = p(
    cx + outerR * Math.cos(startAngle),
    cy + outerR * Math.sin(startAngle),
  );
  const c1_radial = p(
    cx + (outerR - cr) * Math.cos(startAngle),
    cy + (outerR - cr) * Math.sin(startAngle),
  );
  const c1_arc = p(
    cx + outerR * Math.cos(startAngle + outerAngOff),
    cy + outerR * Math.sin(startAngle + outerAngOff),
  );

  // Corner 2: outer-end (where outer arc meets end radial)
  const c2 = p(
    cx + outerR * Math.cos(endAngle),
    cy + outerR * Math.sin(endAngle),
  );
  const c2_arc = p(
    cx + outerR * Math.cos(endAngle - outerAngOff),
    cy + outerR * Math.sin(endAngle - outerAngOff),
  );
  const c2_radial = p(
    cx + (outerR - cr) * Math.cos(endAngle),
    cy + (outerR - cr) * Math.sin(endAngle),
  );

  // Corner 3: inner-end (where end radial meets inner arc)
  const c3 = p(
    cx + innerR * Math.cos(endAngle),
    cy + innerR * Math.sin(endAngle),
  );
  const c3_radial = p(
    cx + (innerR + cr) * Math.cos(endAngle),
    cy + (innerR + cr) * Math.sin(endAngle),
  );
  const c3_arc = p(
    cx + innerR * Math.cos(endAngle - innerAngOff),
    cy + innerR * Math.sin(endAngle - innerAngOff),
  );

  // Corner 4: inner-start (where inner arc meets start radial)
  const c4 = p(
    cx + innerR * Math.cos(startAngle),
    cy + innerR * Math.sin(startAngle),
  );
  const c4_arc = p(
    cx + innerR * Math.cos(startAngle + innerAngOff),
    cy + innerR * Math.sin(startAngle + innerAngOff),
  );
  const c4_radial = p(
    cx + (innerR + cr) * Math.cos(startAngle),
    cy + (innerR + cr) * Math.sin(startAngle),
  );

  return [
    `M ${c4_radial}`,
    `L ${c1_radial}`,
    `Q ${c1} ${c1_arc}`,
    `A ${outerR} ${outerR} 0 ${outerLargeArc} 1 ${c2_arc}`,
    `Q ${c2} ${c2_radial}`,
    `L ${c3_radial}`,
    `Q ${c3} ${c3_arc}`,
    `A ${innerR} ${innerR} 0 ${innerLargeArc} 0 ${c4_arc}`,
    `Q ${c4} ${c4_radial}`,
    "Z",
  ].join(" ");
}

function getSliceIconPosition(
  index: number,
  total: number,
  outerR = 45,
  innerR = 18,
): { left: string; top: string } {
  const count = Math.max(total, 1);
  const startAngle = (index / count) * 2 * Math.PI - Math.PI / 2;
  const endAngle = ((index + 1) / count) * 2 * Math.PI - Math.PI / 2;
  const midAngle = (startAngle + endAngle) / 2;
  const midR = (outerR + innerR) / 2;

  const x = 50 + midR * Math.cos(midAngle);
  const y = 50 + midR * Math.sin(midAngle);

  return { left: `${x.toFixed(1)}%`, top: `${y.toFixed(1)}%` };
}

function getWheelIconPosition(
  index: number,
  total: number,
  innerRadius = 15,
  outerRadius = 48,
  centerX = 50,
  centerY = 50,
): { left: string; top: string } {
  const anglePerSegment = (2 * Math.PI) / Math.max(total, 1);
  const midAngle = (index + 0.5) * anglePerSegment;
  const midR = (outerRadius + innerRadius) / 2;

  const x = centerX + midR * Math.cos(midAngle);
  const y = centerY + midR * Math.sin(midAngle);

  return { left: `${x.toFixed(1)}%`, top: `${y.toFixed(1)}%` };
}

const generateFlowerPetalPath = (
  index: number,
  totalSegments: number,
  cx: number,
  cy: number,
  radius: number,
): string => {
  const segments = Math.max(totalSegments, 1);
  const anglePerSegment = (2 * Math.PI) / segments;
  const midAngle = index * anglePerSegment + anglePerSegment / 2;
  const radialRadius = radius * (segments <= 4 ? 0.49 : 0.44);
  const tangentRadius = Math.max(
    radius * 0.15,
    Math.min(radius * 0.5, radius * Math.sin(anglePerSegment / 2) * 0.82),
  );
  const centerDistance = Math.max(0, radius - radialRadius + radius * 0.02);
  const petalCx = cx + centerDistance * Math.cos(midAngle);
  const petalCy = cy + centerDistance * Math.sin(midAngle);
  const rotationDeg = (midAngle * 180) / Math.PI;
  const innerRadialRadius = radialRadius * 0.58;
  const innerTangentRadius = tangentRadius * 0.58;

  return generateEllipseDonutPath(
    petalCx,
    petalCy,
    radialRadius,
    tangentRadius,
    innerRadialRadius,
    innerTangentRadius,
    rotationDeg,
  );
};

function formatSvgNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function getRotatedEllipsePoint(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotationRad: number,
  theta: number,
): { x: number; y: number } {
  const cosRotation = Math.cos(rotationRad);
  const sinRotation = Math.sin(rotationRad);
  const x = rx * Math.cos(theta);
  const y = ry * Math.sin(theta);

  return {
    x: cx + x * cosRotation - y * sinRotation,
    y: cy + x * sinRotation + y * cosRotation,
  };
}

function generateEllipseDonutPath(
  cx: number,
  cy: number,
  outerRx: number,
  outerRy: number,
  innerRx: number,
  innerRy: number,
  rotationDeg = 0,
): string {
  const rotationRad = (rotationDeg * Math.PI) / 180;
  const outerStart = getRotatedEllipsePoint(
    cx,
    cy,
    outerRx,
    outerRy,
    rotationRad,
    0,
  );
  const outerMid = getRotatedEllipsePoint(
    cx,
    cy,
    outerRx,
    outerRy,
    rotationRad,
    Math.PI,
  );
  const innerStart = getRotatedEllipsePoint(
    cx,
    cy,
    innerRx,
    innerRy,
    rotationRad,
    0,
  );
  const innerMid = getRotatedEllipsePoint(
    cx,
    cy,
    innerRx,
    innerRy,
    rotationRad,
    Math.PI,
  );
  const pathNumbers = [
    outerStart.x,
    outerStart.y,
    outerRx,
    outerRy,
    rotationDeg,
    outerMid.x,
    outerMid.y,
    outerStart.x,
    outerStart.y,
    innerStart.x,
    innerStart.y,
    innerRx,
    innerRy,
    rotationDeg,
    innerMid.x,
    innerMid.y,
    innerStart.x,
    innerStart.y,
  ].map(formatSvgNumber);

  return [
    `M ${pathNumbers[0]} ${pathNumbers[1]}`,
    `A ${pathNumbers[2]} ${pathNumbers[3]} ${pathNumbers[4]} 1 1 ${pathNumbers[5]} ${pathNumbers[6]}`,
    `A ${pathNumbers[2]} ${pathNumbers[3]} ${pathNumbers[4]} 1 1 ${pathNumbers[7]} ${pathNumbers[8]}`,
    "Z",
    `M ${pathNumbers[9]} ${pathNumbers[10]}`,
    `A ${pathNumbers[11]} ${pathNumbers[12]} ${pathNumbers[13]} 1 1 ${pathNumbers[14]} ${pathNumbers[15]}`,
    `A ${pathNumbers[11]} ${pathNumbers[12]} ${pathNumbers[13]} 1 1 ${pathNumbers[16]} ${pathNumbers[17]}`,
    "Z",
  ].join(" ");
}

export type CycleVariant = "cycle" | "flower" | "ring" | "circle";

function getIconPositionForVariant(
  variant: CycleVariant,
  index: number,
  total: number,
): { left: string; top: string } {
  const cx = 50;
  const cy = 50;
  const innerR = 15;
  const outerR = 48;

  switch (variant) {
    case "flower": {
      const anglePerSegment = (2 * Math.PI) / Math.max(total, 1);
      const midAngle = (index + 0.5) * anglePerSegment;
      const r = outerR * 0.55;
      return {
        left: `${(cx + r * Math.cos(midAngle)).toFixed(1)}%`,
        top: `${(cy + r * Math.sin(midAngle)).toFixed(1)}%`,
      };
    }
    case "ring": {
      const ringR = (innerR + outerR) / 2;
      const anglePerSegment = (2 * Math.PI) / Math.max(total, 1);
      const midAngle = (index + 0.5) * anglePerSegment;
      return {
        left: `${(cx + ringR * Math.cos(midAngle)).toFixed(1)}%`,
        top: `${(cy + ringR * Math.sin(midAngle)).toFixed(1)}%`,
      };
    }
    case "circle":
      return getSliceIconPosition(index, total);
    default:
      return getWheelIconPosition(index, total);
  }
}

function DynamicWheelSVG({
  segments,
  variant = "cycle",
}: {
  segments: number;
  variant?: CycleVariant;
}) {
  const centerX = 50;
  const centerY = 50;
  const innerRadius = 15;
  const outerRadius = 48;
  const ringRadius = (innerRadius + outerRadius) / 2;
  const flowerHubOuterRadius = 22;
  const flowerHubInnerRadius = 8.5;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      style={{
        fill: "var(--presentation-smart-layout, var(--presentation-primary))",
        color: "var(--presentation-smart-layout, var(--presentation-primary))",
      }}
    >
      {variant === "ring" ? (
        <>
          <circle
            cx={centerX}
            cy={centerY}
            r={ringRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
          />
          {Array.from({ length: segments }).map((_, idx) => {
            const angle = (2 * Math.PI * (idx + 0.5)) / segments;
            return (
              <circle
                key={idx}
                cx={centerX + ringRadius * Math.cos(angle)}
                cy={centerY + ringRadius * Math.sin(angle)}
                r={7}
                fill="currentColor"
              />
            );
          })}
        </>
      ) : variant === "flower" ? (
        <>
          {Array.from({ length: segments }).map((_, idx) => (
            <path
              key={idx}
              d={generateFlowerPetalPath(
                idx,
                segments,
                centerX,
                centerY,
                outerRadius,
              )}
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
            />
          ))}
          <path
            d={generateEllipseDonutPath(
              centerX,
              centerY,
              flowerHubOuterRadius,
              flowerHubOuterRadius,
              flowerHubInnerRadius,
              flowerHubInnerRadius,
            )}
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          />
        </>
      ) : variant === "circle" ? (
        Array.from({ length: segments }).map((_, idx) => (
          <path
            key={idx}
            d={generateRoundedSlicePath(
              idx,
              segments,
              centerX,
              centerY,
              outerRadius,
              innerRadius,
            )}
            fill="currentColor"
            stroke="var(--presentation-background)"
            strokeWidth="2"
          />
        ))
      ) : (
        Array.from({ length: segments }).map((_, idx) => (
          <path
            key={idx}
            d={generateSegmentPath(
              idx,
              segments,
              innerRadius,
              outerRadius,
              centerX,
              centerY,
            )}
            fill="currentColor"
            stroke="var(--presentation-background)"
            strokeWidth="1"
          />
        ))
      )}
    </svg>
  );
}

export function CycleWheel({
  items,
  onIconChange,
  sizePx,
  totalSegments,
  variant = "cycle",
}: {
  items: TCycleItemElement[];
  onIconChange?: (item: TCycleItemElement, index: number, icon: string) => void;
  sizePx?: number;
  totalSegments: number;
  variant?: CycleVariant;
}) {
  return (
    <div
      data-decor="true"
      className={cn(
        "group relative shrink-0 self-center",
        sizePx === undefined && "size-56 @[700px]/cycle-layout:size-72",
      )}
      style={
        sizePx === undefined
          ? undefined
          : {
              height: sizePx,
              width: sizePx,
            }
      }
    >
      <DynamicWheelSVG segments={totalSegments} variant={variant} />
      {items.map((child, idx) => {
        if (!child.icon && !onIconChange) {
          return null;
        }

        const iconPos = getIconPositionForVariant(variant, idx, totalSegments);
        const key = getCycleItemKey(child, idx);

        return (
          <div
            key={key}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2",
              !onIconChange && "pointer-events-none",
            )}
            style={iconPos}
          >
            {onIconChange ? (
              <IconPicker
                defaultIcon={child.icon}
                hidePlaceholderWhenEmpty
                onIconSelect={(iconName) => onIconChange(child, idx, iconName)}
                onIconRemove={() => onIconChange(child, idx, "")}
                className="size-8 rounded-full border-transparent bg-transparent text-white shadow-none hover:bg-white/15 hover:text-white focus-visible:bg-white/15 focus-visible:text-white [&_svg]:drop-shadow-sm"
                size="sm"
              />
            ) : (
              <PresentationIcon
                icon={child.icon}
                size={18}
                className="text-white drop-shadow-sm"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function splitCycleChildren(
  children: React.ReactNode[],
  isMultiColumn: boolean,
) {
  if (!isMultiColumn) {
    return {
      leftChildren: [] as React.ReactNode[],
      rightChildren: children,
    };
  }

  return {
    leftChildren: children.filter((_, index) => index % 2 === 0),
    rightChildren: children.filter((_, index) => index % 2 === 1),
  };
}

function CycleColumn({
  children,
  isMultiColumn,
  side,
}: {
  children: React.ReactNode[];
  isMultiColumn: boolean;
  side: CycleColumnSide;
}) {
  const contextValue = React.useMemo(
    () => ({ isMultiColumn, side }),
    [isMultiColumn, side],
  );

  if (children.length === 0) {
    return <div className="min-w-0" aria-hidden="true" />;
  }

  return (
    <CycleContext.Provider value={contextValue}>
      <div
        className={cn(
          "flex min-w-0 flex-col justify-center",
          isMultiColumn ? "h-full gap-4" : "gap-1",
        )}
      >
        {children}
      </div>
    </CycleContext.Provider>
  );
}

export const CycleElement = ({
  className,
  ref,
  element,
  ...props
}: StyledPlateElementProps<TCycleGroupElement>) => {
  const { alignment = "center", variant } = element;
  const resolvedVariant: CycleVariant = variant ?? "cycle";
  const totalChildren = element.children?.length ?? 0;
  const accentColor = getPresentationAccentColor(
    element,
    undefined,
    "var(--presentation-smart-layout, var(--presentation-primary))",
  );

  useForceUpdateChildrenOnLengthChange(props.editor, element);

  const { containerRef, layoutRef, frameStyle, fitStyle } =
    useCycleFitScale<HTMLDivElement>();
  const childArray = React.Children.toArray(props.children);
  const { leftChildren, rightChildren } = splitCycleChildren(childArray, true);
  const totalSegments = totalChildren > 0 ? totalChildren : 6;
  const handleWheelIconChange = (
    item: TCycleItemElement,
    index: number,
    icon: string,
  ) => {
    const itemPath = props.editor.api.findPath(item);
    if (itemPath) {
      props.editor.tf.setNodes({ icon }, { at: itemPath });
      return;
    }

    const cyclePath = props.editor.api.findPath(element);
    if (!cyclePath) {
      return;
    }

    props.editor.tf.setNodes({ icon }, { at: [...cyclePath, index] });
  };

  return (
    <PlateElement
      ref={ref}
      className={cn("relative my-0", className)}
      element={element}
      {...props}
      style={
        {
          "--presentation-smart-layout": accentColor,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "flex w-full",
          alignment === "left" && "justify-start",
          alignment === "right" && "justify-end",
          alignment === "center" && "justify-center",
        )}
      >
        <div
          ref={containerRef}
          className="@container/cycle-layout mx-auto w-full"
        >
          <div className="mx-auto" style={frameStyle}>
            <div
              ref={layoutRef}
              className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-4"
              style={fitStyle}
            >
              <CycleColumn isMultiColumn side="left">
                {leftChildren}
              </CycleColumn>

              <CycleWheel
                items={element.children as TCycleItemElement[]}
                onIconChange={handleWheelIconChange}
                sizePx={CYCLE_WHEEL_SIZE_PX}
                totalSegments={totalSegments}
                variant={resolvedVariant}
              />

              <CycleColumn isMultiColumn side="right">
                {rightChildren}
              </CycleColumn>
            </div>
          </div>
        </div>
      </div>
    </PlateElement>
  );
};
