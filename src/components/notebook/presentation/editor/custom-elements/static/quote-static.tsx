import { cva } from "class-variance-authority";
import { SlateElement, type SlateElementProps } from "platejs/static";

import { cn } from "@/lib/utils";

// Quote variant styles (matching editor component)
const quoteVariants = cva("relative my-3 w-full max-w-full overflow-hidden", {
  variants: {
    variant: {
      large: "flex flex-col items-center py-4 text-center",
      "sidequote-icon":
        "rounded-r-lg border-l-4 border-(--presentation-primary) bg-(--presentation-primary)/5 py-3 pr-4 pl-12",
      sidequote: "border-l-4 border-(--presentation-primary) py-2 pr-4 pl-4",
    },
  },
  defaultVariants: {
    variant: "large",
  },
});

// Large decorative quote mark SVG
const QuoteMark = ({
  className,
  flip = false,
}: {
  className?: string;
  flip?: boolean;
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cn(
      "size-12 text-(--presentation-primary)/30",
      flip && "rotate-180",
      className,
    )}
  >
    <path d="M6.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35l.539-.222.474-.197-.485-1.938-.597.144c-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.317.143-.686.238-1.028.467-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.944-.33.358-.656.734-.909 1.162-.293.408-.492.856-.702 1.299-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539l.025.168.026-.006A4.5 4.5 0 1 0 6.5 10zm11 0c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35l.539-.222.474-.197-.485-1.938-.597.144c-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.317.143-.686.238-1.028.467-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.944-.33.358-.656.734-.909 1.162-.293.408-.492.856-.702 1.299-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539l.025.168.026-.006A4.5 4.5 0 1 0 17.5 10z" />
  </svg>
);

// Quote icon for sidequote-icon variant
const QuoteIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={cn("size-6 text-(--presentation-primary)", className)}
  >
    <path d="M6.5 10c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35l.539-.222.474-.197-.485-1.938-.597.144c-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.317.143-.686.238-1.028.467-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.944-.33.358-.656.734-.909 1.162-.293.408-.492.856-.702 1.299-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539l.025.168.026-.006A4.5 4.5 0 1 0 6.5 10zm11 0c-.223 0-.437.034-.65.065.069-.232.14-.468.254-.68.114-.308.292-.575.469-.844.148-.291.409-.488.601-.737.201-.242.475-.403.692-.604.213-.21.492-.315.714-.463.232-.133.434-.28.65-.35l.539-.222.474-.197-.485-1.938-.597.144c-.191.048-.424.104-.689.171-.271.05-.56.187-.882.312-.317.143-.686.238-1.028.467-.344.218-.741.4-1.091.692-.339.301-.748.562-1.05.944-.33.358-.656.734-.909 1.162-.293.408-.492.856-.702 1.299-.19.443-.343.896-.468 1.336-.237.882-.343 1.72-.384 2.437-.034.718-.014 1.315.028 1.747.015.204.043.402.063.539l.025.168.026-.006A4.5 4.5 0 1 0 17.5 10z" />
  </svg>
);

export function QuoteStatic(props: SlateElementProps) {
  const { variant = "large", author } = props.element as {
    variant?: "large" | "sidequote-icon" | "sidequote";
    author?: string;
  };

  if (variant === "large") {
    return (
      <SlateElement
        {...props}
        className={cn(quoteVariants({ variant }), props.className)}
      >
        <div className="relative w-full max-w-3xl px-10">
          {/* Opening quote mark */}
          <QuoteMark className="absolute top-0 left-0 size-8" />

          <div className="flex flex-1 flex-col items-center">
            {/* Quote text */}
            <blockquote className="font-serif text-xl text-(--presentation-foreground) italic md:text-2xl">
              {props.children}
            </blockquote>

            {/* Author */}
            {author && (
              <p className="mt-4 text-sm font-medium text-(--presentation-muted-foreground)">
                Ã¢â‚¬â€ {author}
              </p>
            )}
          </div>

          {/* Closing quote mark */}
          <QuoteMark className="absolute top-0 right-0 size-8" flip />
        </div>
      </SlateElement>
    );
  }

  if (variant === "sidequote-icon") {
    return (
      <SlateElement
        {...props}
        className={cn(quoteVariants({ variant }), props.className)}
      >
        {/* Quote icon */}
        <QuoteIcon className="absolute top-3 left-4" />

        {/* Quote text */}
        <blockquote className="text-base text-(--presentation-foreground) italic md:text-lg">
          {props.children}
        </blockquote>

        {/* Author */}
        {author && (
          <p className="mt-3 text-sm font-semibold text-(--presentation-foreground)">
            {author}
          </p>
        )}
      </SlateElement>
    );
  }

  // Default: sidequote (simple border left)
  return (
    <SlateElement
      {...props}
      className={cn(quoteVariants({ variant: "sidequote" }), props.className)}
    >
      {/* Quote text */}
      <blockquote className="text-base text-(--presentation-foreground)">
        {props.children}
      </blockquote>

      {/* Author */}
      {author && (
        <p className="mt-2 text-sm text-(--presentation-muted-foreground)">
          Ã¢â‚¬â€ {author}
        </p>
      )}
    </SlateElement>
  );
}
