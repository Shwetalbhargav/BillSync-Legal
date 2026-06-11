export function Checkbox({ label, ...props }) {
  return (
    <label className="flex items-center gap-3 text-sm font-semibold text-ink">
      <input className="focus-ring h-4 w-4 rounded border-border text-primary" type="checkbox" {...props} />
      {label}
    </label>
  );
}
