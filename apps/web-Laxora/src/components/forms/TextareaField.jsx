export function TextareaField({ description, label, ...props }) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <textarea className="focus-ring mt-1 min-h-28 w-full rounded-lg border border-border bg-panel px-3 py-3 text-sm text-ink" {...props} />
      {description ? <span className="mt-1 block text-xs font-normal text-muted">{description}</span> : null}
    </label>
  );
}
