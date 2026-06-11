import clsx from "clsx";

export function Field({ description, error, label, leftIcon: LeftIcon, ...props }) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <span className="relative mt-1 block">
        {LeftIcon ? <LeftIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" /> : null}
        <input
          className={clsx(
            "focus-ring w-full rounded-lg border bg-panel py-3 pr-3 text-sm text-ink placeholder:text-muted",
            LeftIcon ? "pl-10" : "pl-3",
            error ? "border-danger" : "border-border",
          )}
          {...props}
        />
      </span>
      {description ? <span className="mt-1 block text-xs font-normal text-muted">{description}</span> : null}
      {error ? <span className="mt-1 block text-xs font-semibold text-danger">{error}</span> : null}
    </label>
  );
}
