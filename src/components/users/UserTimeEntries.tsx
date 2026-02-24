import type { TimeEntry } from '../../types/time';

interface UserTimeEntriesProps {
  entries: TimeEntry[];
}

export function UserTimeEntries({ entries }: UserTimeEntriesProps) {
  if (entries.length === 0) {
    return (
      <p className="text-sm text-text-secondary">No time entries for this period.</p>
    );
  }

  return (
    <div className="mt-4 border border-dark-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-dark-bg/60 text-text-secondary">
          <tr>
            <th className="px-4 py-2 text-left">Date</th>
            <th className="px-4 py-2 text-left">Customer</th>
            <th className="px-4 py-2 text-left">Project</th>
            <th className="px-4 py-2 text-right">Hours</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr
              key={`${entry.date}-${entry.projectId ?? ''}-${entry.customerId ?? ''}-${index}`}
              className="border-t border-dark-border/60 hover:bg-dark-bg/40"
            >
              <td className="px-4 py-2 text-text-primary">
                {new Date(entry.date).toLocaleDateString()}
              </td>
              <td className="px-4 py-2 text-text-secondary">
                {entry.customerName || entry.customerId || '—'}
              </td>
              <td className="px-4 py-2 text-text-secondary">
                {entry.projectName || entry.projectId || '—'}
              </td>
              <td className="px-4 py-2 text-text-primary text-right">
                {entry.hours.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
