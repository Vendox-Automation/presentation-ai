"use client";

import { type TDateElement } from "platejs";
import {
  PlateElement,
  useReadOnly,
  type PlateElementProps,
} from "platejs/react";

import { Calendar } from "@/components/plate/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/plate/ui/popover";
import { cn } from "@/lib/utils";

function formatDateElementLabel(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function DateElement(props: PlateElementProps<TDateElement>) {
  const { editor, element } = props;

  const readOnly = useReadOnly();

  const trigger = (
    <span
      className={cn(
        "w-fit cursor-pointer rounded-sm bg-muted px-1 text-muted-foreground",
      )}
      contentEditable={false}
      draggable
    >
      {element.date ? (
        formatDateElementLabel(element.date)
      ) : (
        <span>Pick a date</span>
      )}
    </span>
  );

  if (readOnly) {
    return trigger;
  }

  return (
    <PlateElement
      {...props}
      className="inline-block"
      attributes={{
        ...props.attributes,
        contentEditable: false,
      }}
    >
      <Popover>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            selected={new Date(element.date as string)}
            onSelect={(date) => {
              if (!date) return;

              editor.tf.setNodes(
                { date: date.toDateString() },
                { at: element },
              );
            }}
            mode="single"
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {props.children}
    </PlateElement>
  );
}
