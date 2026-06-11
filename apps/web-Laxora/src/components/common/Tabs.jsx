import clsx from "clsx";

export function Tabs({ items, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-lg bg-blueSoft p-1">
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            className={clsx(
              "focus-ring rounded-md px-3 py-2 text-sm font-semibold transition",
              active ? "bg-panel text-primary shadow-sm" : "text-muted hover:text-primary",
            )}
            key={item.value}
            onClick={() => onChange?.(item.value)}
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
