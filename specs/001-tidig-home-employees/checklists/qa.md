# QA Checklist: Tidig home page employees and monthly performance

**Purpose**: Guide manual validation of the SBQ home page behavior across all user stories.

## User Story 1 – SBQ employees from Tidig subtree

- [ ] Environment has a representative Tidig subtree configured where SBQ has direct child employees and at least one deeper structural node.
- [ ] Load the home page and confirm that only SBQ and employees from the SBQ subtree are rendered in the consultant breakdown (no unrelated groups from other subtrees).
- [ ] Verify that SBQ itself is rendered in the consultant breakdown (SBQ appears as one of the consultants on the page).
- [ ] Confirm that structural/group nodes under SBQ that still have children (for example, team or department nodes) are **not** rendered as consultants.
- [ ] Temporarily misconfigure the SBQ subtree (or use a subtree where SBQ has no children) and confirm that the home page handles the empty/degenerate case gracefully (no crash, clear "No data" messaging).

## User Story 2 – Monthly hours per employee

- [ ] Open `backend/src/data/users.json` and identify a small set of SBQ employees, including SBQ themself if applicable.
- [ ] For those employees, add or update `monthlyHours` entries for the current calendar month (`YYYY-MM`), using realistic but clearly testable values.
- [ ] Ensure that `hourlyRate` is set for at least one of these employees so SEK values can be computed.
- [ ] Reload the home page and confirm that the group performance chart reflects the new current-month hours (total hours change in line with your `monthlyHours` edits).
- [ ] Confirm that the tooltip for the current month shows both hours and SEK when `hourlyRate` is present, and hours only when no rate is configured.
- [ ] Change one employee's `monthlyHours` for the current month, reload, and verify that both hours and SEK totals change accordingly on the home page.

## User Story 3 – Configuration reuse

- [ ] Confirm that no new environment variables were introduced for this feature by reviewing `.env` and Tidig-related config; existing keys are reused.
- [ ] Verify that SBQ is still identified using the existing Tidig configuration (no new SBQ-specific flags or IDs were added).
- [ ] Confirm that the home page only depends on existing endpoints (`/api/sync/subtree`, `/api/users`) and `backend/src/data/users.json` for its behavior.
- [ ] Adjust SBQ-related configuration (within the existing mechanism) and/or `users.json`, then restart/reload the app and verify that the home page behavior updates correctly without any code changes.

## Cross-cutting checks

- [ ] Verify that when `users.json` has no `monthlyHours` for the current month, the chart falls back to using existing snapshot totals (no regressions in hours when there is no internal data yet).
- [ ] Confirm that zero or missing `monthlyHours` entries do not break the chart or consultant breakdown (the page still renders and displays a reasonable "No data" or zero-hours state).
- [ ] Exercise navigation across several months in the home page month navigator and confirm that hours and SEK values stay consistent with the underlying `monthlyHours` data for each month key.
