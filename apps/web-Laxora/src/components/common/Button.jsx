import clsx from "clsx";
import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-primary text-white hover:bg-primaryStrong",
  secondary: "border border-border bg-panel text-primary hover:bg-blueSoft",
  ghost: "text-muted hover:bg-blueSoft hover:text-primary",
  danger: "bg-danger text-white hover:bg-danger/90",
  success: "bg-success text-white hover:bg-success/90",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
  icon: "h-10 w-10 p-0",
};

export function Button({ children, className, disabled, isLoading = false, size = "md", variant = "primary", ...props }) {
  return (
    <button
      className={clsx(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-55",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      {children}
    </button>
  );
}
