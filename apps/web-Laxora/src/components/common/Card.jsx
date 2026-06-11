import clsx from "clsx";

export function Card({ children, className }) {
  return <section className={clsx("surface-card min-w-0", className)}>{children}</section>;
}

export function CardHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex min-w-0 flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-wide text-accent">{eyebrow}</p> : null}
        <h2 className="mt-1 text-lg font-bold text-primary">{title}</h2>
        {description ? <p className="mt-1 text-sm leading-6 text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ children, className }) {
  return <div className={clsx("min-w-0 p-5", className)}>{children}</div>;
}
