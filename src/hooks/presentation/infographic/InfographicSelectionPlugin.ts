import {
  Plugin,
  type ICommandManager,
  type IStateManager,
  type PluginInitOptions,
  type Selection,
} from "@antv/infographic";

type InfographicSelectionType = "text" | "icon" | "geometry" | "mixed" | "none";

export interface InfographicSelectionPayload {
  type: InfographicSelectionType;
  boundingRect: DOMRect | null;
  selection: Selection;
  textElements: SVGForeignObjectElement[];
  iconElements: SVGElement[];
  geometryElements: SVGElement[];
  iconIndexes: number[][];
  commander: ICommandManager | null;
  state: IStateManager | null;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
}

type SelectionBuckets = {
  geometryElements: SVGElement[];
  iconElements: SVGElement[];
  iconIndexes: number[][];
  textElements: SVGForeignObjectElement[];
  type: InfographicSelectionType;
};

const TEXT_ROLES = new Set(["title", "desc", "item-label", "item-desc"]);
const ICON_ROLES = new Set(["item-icon", "item-icon-group"]);
const GEOMETRY_TAGS = new Set([
  "rect",
  "circle",
  "ellipse",
  "line",
  "polygon",
  "polyline",
  "path",
]);

const EMPTY_SELECTION_PAYLOAD: InfographicSelectionPayload = {
  type: "none",
  boundingRect: null,
  selection: [],
  textElements: [],
  iconElements: [],
  geometryElements: [],
  iconIndexes: [],
  commander: null,
  state: null,
};

export class InfographicSelectionPlugin extends Plugin {
  name = "infographic-selection-plugin";
  private selection: Selection = [];
  private onSelectionChange: (payload: InfographicSelectionPayload) => void;

  constructor(
    onSelectionChange: (payload: InfographicSelectionPayload) => void,
  ) {
    super();
    this.onSelectionChange = onSelectionChange;
  }

  init(options: PluginInitOptions) {
    super.init(options);
    const { emitter } = options;
    emitter.on("selection:change", this.handleSelectionChanged);
    emitter.on("selection:geometrychange", this.handleGeometryChanged);
    emitter.on("history:change", this.handleHistoryChanged);
  }

  destroy(): void {
    if (this.emitter) {
      this.emitter.off("selection:change", this.handleSelectionChanged);
      this.emitter.off("selection:geometrychange", this.handleGeometryChanged);
      this.emitter.off("history:change", this.handleHistoryChanged);
    }
  }

  private handleSelectionChanged = ({ next }: { next: Selection }) => {
    this.selection = next;
    this.emitSelectionUpdate();
  };

  private handleGeometryChanged = ({
    target,
  }: {
    type: "selection:geometrychange";
    target: Selection[number];
  }) => {
    if (!this.selection.includes(target)) return;
    this.emitSelectionUpdate();
  };

  private handleHistoryChanged = () => {
    if (this.selection.length === 0) return;
    this.emitSelectionUpdate();
  };

  private emitSelectionUpdate(): void {
    if (this.selection.length === 0) {
      this.onSelectionChange(EMPTY_SELECTION_PAYLOAD);
      return;
    }

    const buckets = getSelectionBuckets(this.selection);
    const textStyle = getSelectedTextStyle(buckets.textElements);

    this.onSelectionChange({
      type: buckets.type,
      boundingRect: getSelectionBoundingRect(this.selection),
      selection: this.selection,
      textElements: buckets.textElements,
      iconElements: buckets.iconElements,
      geometryElements: buckets.geometryElements,
      iconIndexes: buckets.iconIndexes,
      commander: this.commander,
      state: this.state,
      fontFamily: textStyle.fontFamily,
      fontSize: textStyle.fontSize,
      fontWeight: textStyle.fontWeight,
    });
  }
}

function getSelectionBuckets(selection: Selection): SelectionBuckets {
  const textElements: SVGForeignObjectElement[] = [];
  const iconElements: SVGElement[] = [];
  const geometryElements: SVGElement[] = [];
  const iconIndexes: number[][] = [];

  for (const element of selection) {
    if (isTextElement(element)) {
      textElements.push(element);
      continue;
    }

    if (isIconElement(element)) {
      iconElements.push(element);
      const indexes = getIconIndexes(element);
      if (indexes) iconIndexes.push(indexes);
      continue;
    }

    if (isGeometryElement(element)) {
      geometryElements.push(element);
    }
  }

  return {
    textElements,
    iconElements,
    geometryElements,
    iconIndexes,
    type: getSelectionType({
      hasText: textElements.length > 0,
      hasIcon: iconElements.length > 0,
      hasGeometry: geometryElements.length > 0,
    }),
  };
}

function isTextElement(
  element: SVGElement,
): element is SVGForeignObjectElement {
  const role = element.getAttribute("data-element-type");
  return TEXT_ROLES.has(role ?? "");
}

function isIconElement(element: SVGElement): boolean {
  const role = element.getAttribute("data-element-type");
  const parentRole = element.parentElement?.getAttribute("data-element-type");

  return (
    ICON_ROLES.has(role ?? "") ||
    (element.tagName.toLowerCase() === "use" && parentRole === "item-icon")
  );
}

function isGeometryElement(element: SVGElement): boolean {
  return GEOMETRY_TAGS.has(element.tagName.toLowerCase());
}

function getIconIndexes(element: SVGElement): number[] | null {
  const entity =
    element.tagName.toLowerCase() === "use"
      ? element
      : (element.querySelector<SVGElement>("use") ?? element);
  const indexes = entity.dataset.indexes;

  if (!indexes) return null;

  return indexes.split(",").map(Number);
}

function getSelectionType({
  hasText,
  hasIcon,
  hasGeometry,
}: {
  hasGeometry: boolean;
  hasIcon: boolean;
  hasText: boolean;
}): InfographicSelectionType {
  if (hasText && !hasIcon && !hasGeometry) return "text";
  if (!hasText && hasIcon && !hasGeometry) return "icon";
  if (!hasText && !hasIcon && hasGeometry) return "geometry";

  return "mixed";
}

function getSelectionBoundingRect(selection: Selection): DOMRect | null {
  try {
    const rects = selection.map((element) => element.getBoundingClientRect());
    if (rects.length === 0) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const rect of rects) {
      minX = Math.min(minX, rect.left);
      minY = Math.min(minY, rect.top);
      maxX = Math.max(maxX, rect.right);
      maxY = Math.max(maxY, rect.bottom);
    }

    return new DOMRect(minX, minY, maxX - minX, maxY - minY);
  } catch {
    return null;
  }
}

function getSelectedTextStyle(textElements: SVGForeignObjectElement[]): {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
} {
  const [firstText] = textElements;
  if (!firstText) {
    return {
      fontFamily: "",
      fontSize: 14,
      fontWeight: "normal",
    };
  }

  const css = getComputedStyle(firstText);

  return {
    fontFamily:
      css.fontFamily || firstText.getAttribute("font-family") || "Open Sans",
    fontSize: Number.parseFloat(
      css.fontSize || firstText.getAttribute("font-size") || "14",
    ),
    fontWeight:
      css.fontWeight || firstText.getAttribute("font-weight") || "normal",
  };
}
