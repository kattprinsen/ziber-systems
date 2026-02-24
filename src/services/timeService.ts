import apiClient from './api';
import type {
  TimeEntry,
  TimeFilter,
  TimeSummary,
  CustomerTimeSummary,
  ProjectTimeSummary,
} from '../types/time';

class TimeService {
  private basePath = '/users';

  async getUserTimeEntries(userId: string, filters: TimeFilter): Promise<TimeEntry[]> {
    const params = new URLSearchParams();

    params.append('fromDate', filters.fromDate);
    params.append('toDate', filters.toDate);

    if (filters.customerId) {
      params.append('customerId', filters.customerId);
    }
    if (filters.customerName) {
      params.append('customerName', filters.customerName);
    }
    if (filters.projectId) {
      params.append('projectId', filters.projectId);
    }
    if (filters.projectName) {
      params.append('projectName', filters.projectName);
    }

    const queryString = params.toString();
    const endpoint = `${this.basePath}/${userId}/time?${queryString}`;

    const response = await apiClient.get<TimeEntry[]>(endpoint);
    return response.data ?? [];
  }

  getTimeSummary(entries: TimeEntry[]): TimeSummary {
    const customerMap = new Map<string, CustomerTimeSummary>();
    const projectMap = new Map<string, ProjectTimeSummary>();

    for (const entry of entries) {
      const customerId = entry.customerId ?? null;
      const customerName = entry.customerName ?? null;
      const projectId = entry.projectId ?? null;
      const projectName = entry.projectName ?? null;

      const customerKey = `${customerId ?? 'none'}||${customerName ?? 'Unknown customer'}`;
      const existingCustomer = customerMap.get(customerKey) ?? {
        customerId,
        customerName,
        totalHours: 0,
      };
      existingCustomer.totalHours += entry.hours;
      customerMap.set(customerKey, existingCustomer);

      const projectKey = `${projectId ?? 'none'}||${projectName ?? 'Unknown project'}`;
      const existingProject = projectMap.get(projectKey) ?? {
        projectId,
        projectName,
        totalHours: 0,
      };
      existingProject.totalHours += entry.hours;
      projectMap.set(projectKey, existingProject);
    }

    const customers = Array.from(customerMap.values()).sort((a, b) => {
      const nameA = a.customerName ?? '';
      const nameB = b.customerName ?? '';
      return nameA.localeCompare(nameB);
    });

    const projects = Array.from(projectMap.values()).sort((a, b) => {
      const nameA = a.projectName ?? '';
      const nameB = b.projectName ?? '';
      return nameA.localeCompare(nameB);
    });

    return { customers, projects };
  }
}

export default new TimeService();
