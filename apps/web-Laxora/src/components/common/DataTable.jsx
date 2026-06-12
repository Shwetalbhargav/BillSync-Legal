export function DataTable({ columns, rows, label = "Workspace records" }) {
  return (
    <div className="scroll-region rounded-lg border border-border" role="region" aria-label={`${label} table`} tabIndex={0}>
      <table className="min-w-full divide-y divide-border text-sm">
        <caption className="sr-only">{label}</caption>
        <thead className="bg-blueSoft text-left text-xs font-bold uppercase tracking-wide text-primary">
          <tr>
            {columns.map((column) => (
              <th className="px-4 py-3 align-top" key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-panel">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-blueSoft/60 focus-within:bg-blueSoft/60">
              {columns.map((column) => (
                <td className="safe-text px-4 py-3 align-top text-ink" key={column.key}>
                  {row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
