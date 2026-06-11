import clsx from "clsx";

const toneMap = {
  neutral: "border-border bg-blueSoft text-primary",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-danger/30 bg-danger/10 text-danger",
  accent: "border-accent/30 bg-accent/10 text-[#735A00]",
};

export function StatusBadge({ children, className, tone = "neutral" }) {
  return (
    <span className={clsx("inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-bold", toneMap[tone], className)}>
      {children}
    </span>
  );
}
