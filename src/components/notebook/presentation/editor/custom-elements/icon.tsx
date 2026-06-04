"use client";

import {
  PlateElement,
  useEditorRef,
  type PlateElementProps,
} from "platejs/react";

import { IconPicker } from "@/components/ui/icon-picker";
import { cn } from "@/lib/utils";
import { type TIconElement } from "../plugins/icon-plugin";

// Icon component that uses IconPicker
export const Icon = ({
  element,
  className,
  ref,
  ...props
}: PlateElementProps<TIconElement>) => {
  const { query, name } = element;
  const editor = useEditorRef();

  // Handle icon selection
  const handleIconSelect = (iconName: string) => {
    const path = editor.api.findPath(element);
    if (!path) return;
    editor.tf.setNodes({ name: iconName } as Partial<TIconElement>, {
      at: path,
    });
  };

  return (
    <PlateElement
      ref={ref}
      element={element}
      className={cn("group inline-flex justify-center", className)}
      {...props}
    >
      <div className="mb-2 p-2">
        <IconPicker
          defaultIcon={name || query}
          hidePlaceholderWhenEmpty
          onIconSelect={(iconName) => handleIconSelect(iconName)}
          onIconRemove={() => {
            const path = editor.api.findPath(element);
            if (!path) return;
            editor.tf.setNodes({ name: "" } as Partial<TIconElement>, {
              at: path,
            });
          }}
          className="bg-transparent! hover:opacity-80"
        />
      </div>
    </PlateElement>
  );
};
