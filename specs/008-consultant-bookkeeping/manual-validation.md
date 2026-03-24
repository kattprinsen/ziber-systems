# Manual Validation: Consultant Contribution Analysis MVP

This document outlines how to manually validate the feature against success criteria SC-001–SC-005 from the spec.

## SC-001: Monthly entry speed

- Create ~20 active consultants.
- For a given month, enter billable and non-billable hours for each consultant via the Dashboard.
- Confirm that completing entry and viewing the summary can reasonably be done within 5 minutes on a typical laptop.

## SC-002: Metric traceability

- For a selected month, pick a few consultants.
- Verify that each per-consultant metric in the UI (revenue, cost approximation, margin, utilization) can be recomputed from:
  - The consultant's salary and hourly rate, and
  - The MonthlyEntry record (billable/non-billable hours).
- Confirm that team totals and averages match the aggregation of per-consultant values.

## SC-003: Performance with 24 months of data

- Populate data for roughly 20 consultants over 24 months (can be synthetic).
- Load several different months in the Dashboard.
- Confirm that summaries render without noticeable lag and that the browser remains responsive.

## SC-004: Historical integrity under consultant changes

- Create a consultant and enter hours for at least one historical month.
- Mark the consultant as `inactive` on the Consultants tab.
- Confirm:
  - The consultant no longer appears in new months' input forms.
  - Historical summaries still show their contributions for past months.
- Optionally, reactivate the consultant and verify they appear again in future months while history remains intact.

## SC-005: 3-month trend consistency

- Enter data for at least three consecutive months.
- On the Dashboard, compare the **3-month team trend** values with the corresponding single-month summaries:
  - For each month shown in the trend table, confirm revenue, cost, margin, and average utilization match the standalone summary for that month.
- Confirm that as you add more months, the trend view always shows the last three months with data.

## Status

- The checks above describe how to validate the system manually.
- As of this document's creation, automated tests cover core calculations and summary aggregation; a human should still perform the end-to-end checks described here before considering the MVP fully validated.
