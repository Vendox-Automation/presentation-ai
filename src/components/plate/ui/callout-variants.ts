export const CALLOUT_VARIANTS = {
  caution: {
    backgroundColor: "#FEF2F2",
    icon: "FiXCircle",
    textColor: "#991B1B",
    textClassName: "text-red-800",
  },
  info: {
    backgroundColor: "hsl(var(--card))",
    icon: "FiInfo",
    textColor: "hsl(var(--foreground))",
    textClassName: "text-foreground",
  },
  note: {
    backgroundColor: "hsl(var(--card))",
    icon: "FiFileText",
    textColor: "hsl(var(--foreground))",
    textClassName: "text-foreground",
  },
  question: {
    backgroundColor: "hsl(var(--card))",
    icon: "FiHelpCircle",
    textColor: "hsl(var(--foreground))",
    textClassName: "text-foreground",
  },
  success: {
    backgroundColor: "#F0FDF4",
    icon: "FiCheckCircle",
    textColor: "#065F46",
    textClassName: "text-emerald-800",
  },
  warning: {
    backgroundColor: "#FFF7ED",
    icon: "FiAlertTriangle",
    textColor: "#92400E",
    textClassName: "text-amber-800",
  },
} as const;

export type CalloutVariant = keyof typeof CALLOUT_VARIANTS;

const DEFAULT_CALLOUT_VARIANT = "note" satisfies CalloutVariant;

export function getCalloutVariant(value: unknown): CalloutVariant {
  return typeof value === "string" && value in CALLOUT_VARIANTS
    ? (value as CalloutVariant)
    : DEFAULT_CALLOUT_VARIANT;
}
