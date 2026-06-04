"use client";

import { type VariantProps } from "class-variance-authority";
import { Loader2, Plus, X } from "lucide-react";
import { useReadOnly } from "platejs/react";
import React, { useEffect, useState, type ReactNode } from "react";

import {
  DEFAULT_PRESENTATION_ICON,
  getPopularPresentationIcons,
  resolvePresentationIcon,
  searchPresentationIcons,
  type ResolvedPresentationIcon,
} from "@/components/notebook/presentation/editor/custom-elements/presentation-icon-utils";
import { Button } from "@/components/ui/button";
import { type buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePresentationState } from "@/states/presentation-state";

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

// Define interfaces for type safety
interface IconItem {
  name: string;
  component: ReactNode;
}

const renderResolvedIcon = (
  resolvedIcon: ResolvedPresentationIcon | null,
  iconPixelSize = 16,
  iconClassName?: string,
) => {
  if (!resolvedIcon) {
    return null;
  }

  return React.createElement(resolvedIcon.Component, {
    "aria-hidden": true,
    className: iconClassName,
    size: iconPixelSize,
  });
};

// Define the prop types
interface IconPickerProps
  extends
    React.ComponentProps<"button">,
    Omit<VariantProps<typeof buttonVariants>, "size"> {
  onIconSelect?: (iconName: string, iconComponent: ReactNode) => void;
  onIconRemove?: () => void;
  defaultIcon?: string;
  hidePlaceholderWhenEmpty?: boolean;
  iconClassName?: string;
  iconPixelSize?: number;
  placeholder?: ReactNode;
  size?: "sm" | "md" | "lg";
}

// Main Icon Picker Component
const IconPicker = ({
  onIconSelect,
  onIconRemove,
  defaultIcon,
  placeholder,
  className,
  hidePlaceholderWhenEmpty,
  iconClassName,
  iconPixelSize,
  size,
  ...props
}: IconPickerProps) => {
  const [icon, setIcon] = useState<string>(defaultIcon?.trim() ?? "");
  const [iconComponent, setIconComponent] = useState<ReactNode>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const openIconPicker = usePresentationState((state) => state.openIconPicker);
  const readOnly = useReadOnly();
  const hasIcon = Boolean(icon.trim());

  // Size mappings for the trigger button

  useEffect(() => {
    let cancelled = false;

    const syncCurrentIcon = async () => {
      const normalizedDefaultIcon = defaultIcon?.trim();
      setIcon(normalizedDefaultIcon ?? "");

      if (!normalizedDefaultIcon) {
        setIconComponent(null);
        return;
      }

      setIsLoading(true);

      try {
        const resolvedIcon = await resolvePresentationIcon(
          normalizedDefaultIcon,
        );

        if (cancelled) {
          if (!cancelled) {
            setIsLoading(false);
          }
          return;
        }

        if (resolvedIcon) {
          setIcon(resolvedIcon.name);
          setIconComponent(
            renderResolvedIcon(resolvedIcon, iconPixelSize, iconClassName),
          );
          if (!cancelled) {
            setIsLoading(false);
          }
          return;
        }

        const fallbackIcon = await resolvePresentationIcon(
          DEFAULT_PRESENTATION_ICON,
        );

        if (cancelled) {
          if (!cancelled) {
            setIsLoading(false);
          }
          return;
        }

        setIcon(fallbackIcon?.name ?? DEFAULT_PRESENTATION_ICON);
        setIconComponent(
          renderResolvedIcon(fallbackIcon, iconPixelSize, iconClassName),
        );
      } catch (error) {
        try {
          console.error("Error resolving icon:", error);

          if (!cancelled && normalizedDefaultIcon) {
            const fallbackIcon = await resolvePresentationIcon(
              DEFAULT_PRESENTATION_ICON,
            );

            if (!cancelled) {
              setIcon(fallbackIcon?.name ?? DEFAULT_PRESENTATION_ICON);
              setIconComponent(
                renderResolvedIcon(fallbackIcon, iconPixelSize, iconClassName),
              );
            }
          } else if (!cancelled) {
            setIcon("");
            setIconComponent(null);
          }
        } catch (reactDoctorFinallyError) {
          if (!cancelled) {
            setIsLoading(false);
          }
          throw reactDoctorFinallyError;
        }
      }
      if (!cancelled) {
        setIsLoading(false);
      }
    };

    void syncCurrentIcon();

    return () => {
      cancelled = true;
    };
  }, [defaultIcon, iconClassName, iconPixelSize]);

  const handleRemoveIcon = () => {
    setIcon("");
    setIconComponent(null);
    onIconRemove?.();
  };

  const handleOpenIconPicker = (event: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(event);

    if (event.defaultPrevented || props.disabled) {
      return;
    }

    if (readOnly) {
      return;
    }

    openIconPicker(
      icon,
      async (selectedName) => {
        setIsLoading(true);

        try {
          const resolvedIcon = await resolvePresentationIcon(selectedName);
          const resolvedName = resolvedIcon?.name ?? selectedName;
          const component = renderResolvedIcon(
            resolvedIcon,
            iconPixelSize,
            iconClassName,
          );

          setIcon(resolvedName);
          setIconComponent(component);
          onIconSelect?.(resolvedName, component);
        } catch (error) {
          try {
            console.error("Error selecting icon:", error);
          } catch (reactDoctorCatchError) {
            setIsLoading(false);
            throw reactDoctorCatchError;
          }
        }
        setIsLoading(false);
      },
      handleRemoveIcon,
    );
  };

  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        sizeClasses[size ?? "md"],
        "flex items-center justify-center rounded-md border shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden",
        className,
        hidePlaceholderWhenEmpty &&
          !hasIcon &&
          !readOnly &&
          "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100",
        hidePlaceholderWhenEmpty && !hasIcon && readOnly && "hidden",
      )}
      aria-label="Select icon"
      {...props}
      onClick={handleOpenIconPicker}
    >
      {isLoading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        (iconComponent ??
        placeholder ?? <Plus className="size-4 text-muted-foreground" />)
      )}
    </Button>
  );
};

const IconPickerPanel = () => {
  const initialIcon = usePresentationState(
    (state) => state.iconPickerCurrentIcon,
  );
  const [currentIcon, setCurrentIcon] = useState(initialIcon);

  useEffect(() => {
    setCurrentIcon(initialIcon);
  }, [initialIcon]);
  const selectIcon = usePresentationState(
    (state) => state.iconPickerSelectIcon,
  );
  const removeIcon = usePresentationState(
    (state) => state.iconPickerRemoveIcon,
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [internalSearchTerm, setInternalSearchTerm] = useState<string>("");
  const [filteredIcons, setFilteredIcons] = useState<IconItem[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadIcons = async () => {
      setIsLoading(true);

      try {
        const resolvedIcons = internalSearchTerm.trim()
          ? await searchPresentationIcons(internalSearchTerm, 60)
          : await getPopularPresentationIcons(30);

        if (cancelled) {
          if (!cancelled) {
            setIsLoading(false);
          }
          return;
        }

        setFilteredIcons(
          resolvedIcons.map((resolvedIcon) => ({
            name: resolvedIcon.name,
            component: renderResolvedIcon(resolvedIcon),
          })),
        );
      } catch (error) {
        try {
          console.error("Error loading icons:", error);

          if (!cancelled) {
            setFilteredIcons([]);
          }
        } catch (reactDoctorFinallyError) {
          if (!cancelled) {
            setIsLoading(false);
          }
          throw reactDoctorFinallyError;
        }
      }
      if (!cancelled) {
        setIsLoading(false);
      }
    };

    void loadIcons();

    return () => {
      cancelled = true;
    };
  }, [internalSearchTerm]);

  const handleSelectIcon = (selectedName: string) => {
    setCurrentIcon(selectedName);
    selectIcon?.(selectedName);
  };

  const handleRemoveIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCurrentIcon("");
    removeIcon?.();
  };

  const hasIcon = Boolean(currentIcon.trim());

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4">
      <Input
        placeholder="Search icons..."
        value={internalSearchTerm}
        onChange={(e) => setInternalSearchTerm(e.target.value)}
        className="w-full"
        autoFocus
      />

      {isLoading ? (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-6 content-start gap-1 overflow-y-auto p-1">
          {hasIcon && (
            <Button
              variant="outline"
              className="flex aspect-square h-10 items-center justify-center p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleRemoveIcon}
              title="Remove icon"
            >
              <X className="size-4" />
            </Button>
          )}
          {filteredIcons.length > 0 ? (
            filteredIcons.map((item, index) => (
              <Button
                key={`${item.name}-${index}`}
                variant={currentIcon === item.name ? "default" : "ghost"}
                className="flex aspect-square h-10 items-center justify-center p-0"
                onClick={() => handleSelectIcon(item.name)}
                title={item.name}
              >
                {item.component}
              </Button>
            ))
          ) : (
            <div className="col-span-5 py-8 text-center text-muted-foreground">
              No icons found. Try a different search term.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Export the component
export { IconPicker, IconPickerPanel };
