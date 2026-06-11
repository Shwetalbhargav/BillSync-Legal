export function SelectField({ children, description, label, ...props }) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <select className="focus-ring mt-1 w-full rounded-lg border border-border bg-panel px-3 py-3 text-sm text-ink" {...props}>
        {children}
      </select>
      {description ? <span className="mt-1 block text-xs font-normal text-muted">{description}</span> : null}
    </label>
  );
}
