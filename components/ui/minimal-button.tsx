import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * MinimalButton — sage CTA with a subtle diagonal hatch pattern overlay.
 * Adapted to Tailwind v3 + the Chalk & Cedar tokens (accent #4a7a5a).
 * Renders a real <button>; pass onClick to navigate.
 */
const MinimalButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "relative h-10 px-4 overflow-hidden rounded-full border-none bg-primary text-primary-foreground [--pattern:#ffffff] shadow-[0px_8px_24px_-6px_#4a7a5a80] transition-all hover:bg-primary/90",
          className,
        )}
        {...props}
      >
        <span className="absolute inset-0 h-full w-full bg-[repeating-linear-gradient(315deg,var(--pattern)_0,var(--pattern)_1px,transparent_0,transparent_50%)] bg-[length:10px_10px] opacity-20" />
        <span className="relative z-10 flex items-center justify-center gap-1.5">
          {children}
        </span>
      </Button>
    );
  },
);
MinimalButton.displayName = "MinimalButton";

export default MinimalButton;
