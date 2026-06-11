export function DataTable({ columns, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-blueSoft text-left text-xs font-bold uppercase tracking-wide text-primary">
          <tr>
            {columns.map((column) => (
              <th className="px-4 py-3" key={column.key}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-panel">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-blueSoft/60">
              {columns.map((column) => (
                <td className="px-4 py-3 text-ink" key={column.key}>
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
