import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { ListSkeleton } from './Skeleton';

export interface DataTableColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  loading?: boolean;
}

/** Astryd table: card shell, 10px uppercase dim headers, hairline row dividers, 13px cells. */
export function DataTable<T>({ columns, rows, rowKey, emptyMessage = 'Nothing here yet.', loading = false }: DataTableProps<T>) {
  if (loading) {
    return <ListSkeleton />;
  }

  if (rows.length === 0) {
    return <EmptyState icon={Inbox} title={emptyMessage} />;
  }

  return (
    <div className="overflow-hidden astryd-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[var(--astryd-divider)]">
              {columns.map((col) => (
                <th key={col.header} className={`astryd-th ${col.className ?? ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="astryd-row last:border-0">
                {columns.map((col) => (
                  <td key={col.header} className={`px-4 py-3 align-middle astryd-text-bright ${col.className ?? ''}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
