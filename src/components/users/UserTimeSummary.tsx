import type { TimeEntry } from '../../types/time';
import timeService from '../../services/timeService';

interface UserTimeSummaryProps {
  entries: TimeEntry[];
}

export function UserTimeSummary({ entries }: UserTimeSummaryProps) {
  if (!entries.length) {
    return (
      <p className="mt-4 text-sm text-text-secondary">
        No summary data available for this interval.
      </p>
    );
  }

  const summary = timeService.getTimeSummary(entries);

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">
          Hours by customer
        </h3>
        <div className="bg-dark-bg border border-dark-border rounded-md overflow-hidden text-sm">
          <div className="grid grid-cols-[2fr,1fr] px-3 py-2 border-b border-dark-border text-text-secondary">
            <span>Customer</span>
            <span className="text-right">Hours</span>
          </div>
          {summary.customers.map((customer) => (
            <div
              key={`${customer.customerId ?? 'none'}-${customer.customerName ?? 'unknown'}`}
              className="grid grid-cols-[2fr,1fr] px-3 py-1.5 border-t border-dark-border/40 text-text-primary"
            >
              <span>{customer.customerName ?? 'Unspecified customer'}</span>
              <span className="text-right">
                {customer.totalHours.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">
          Hours by project
        </h3>
        <div className="bg-dark-bg border border-dark-border rounded-md overflow-hidden text-sm">
          <div className="grid grid-cols-[2fr,1fr] px-3 py-2 border-b border-dark-border text-text-secondary">
            <span>Project</span>
            <span className="text-right">Hours</span>
          </div>
          {summary.projects.map((project) => (
            <div
              key={`${project.projectId ?? 'none'}-${project.projectName ?? 'unknown'}`}
              className="grid grid-cols-[2fr,1fr] px-3 py-1.5 border-t border-dark-border/40 text-text-primary"
            >
              <span>{project.projectName ?? 'Unspecified project'}</span>
              <span className="text-right">
                {project.totalHours.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
