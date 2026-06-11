export function Progress({ label, value = 0 }) {
  const bounded = Math.min(100, Math.max(0, value));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-ink">{label}</span>
        <span className="font-bold text-primary">{bounded}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-blueLine">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${bounded}%` }} />
      </div>
    </div>
  );
}
