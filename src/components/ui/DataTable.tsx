import { EmptyState } from "./EmptyState";

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onEdit,
  onDelete,
  extra,
}: {
  columns: { key: keyof T | string; label: string }[];
  rows: T[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  extra?: (row: T) => React.ReactNode;
}) {
  if (!rows.length) return <EmptyState title="No records found" hint="Add the first record to get started." />;

  return (
    <div className="hidden overflow-x-auto rounded-3xl border border-line bg-white md:block">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-muted">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="px-4 py-3 font-bold">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete || extra) && <th className="px-4 py-3">Action</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-line">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-3 text-ink">
                  {String(row[col.key as keyof T] ?? "")}
                </td>
              ))}
              {(onEdit || onDelete || extra) && (
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {onEdit ? (
                      <button className="font-semibold text-brand" onClick={() => onEdit(row.id)}>
                        Edit
                      </button>
                    ) : null}
                    {onDelete ? (
                      <button className="font-semibold text-danger" onClick={() => onDelete(row.id)}>
                        Delete
                      </button>
                    ) : null}
                    {extra?.(row)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
