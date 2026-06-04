const SMART_LAYOUT_COLOR = "var(--presentation-smart-layout)";

export function getSmartLayoutStepColor(index: number, total: number) {
  if (total <= 1) {
    return SMART_LAYOUT_COLOR;
  }

  const progress = index / (total - 1);

  if (progress < 0.5) {
    const darken = Math.round((1 - progress / 0.5) * 10);
    return `color-mix(in srgb, ${SMART_LAYOUT_COLOR} ${100 - darken}%, black ${darken}%)`;
  }

  if (progress > 0.5) {
    const lighten = Math.round(((progress - 0.5) / 0.5) * 10);
    return `color-mix(in srgb, ${SMART_LAYOUT_COLOR} ${100 - lighten}%, white ${lighten}%)`;
  }

  return SMART_LAYOUT_COLOR;
}
