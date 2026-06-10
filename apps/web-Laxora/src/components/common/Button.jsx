import clsx from "clsx";

const variants = {
  primary: "bg-primary text-white hover:bg-primaryStrong",
  secondary: "border border-border bg-panel text-primary hover:bg-blueSoft",
  ghost: "text-muted hover:bg-blueSoft hover:text-primary",
};

export function Button({ className, variant = "primary", ...props }) {
  return (
    <button
      className={clsx(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
